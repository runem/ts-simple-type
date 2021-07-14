import * as tsModule from "typescript";
import { Declaration, Node, Signature, SignatureDeclaration, Symbol as ESSymbol, Type, TypeChecker } from "typescript";
import { inspect } from "util";
import { DEFAULT_TYPE_CACHE } from "../constants";
import {
	isSimpleType,
	SimpleType,
	SimpleTypeAlias,
	SimpleTypeEnumMember,
	SimpleTypeFunction,
	SimpleTypeFunctionParameter,
	SimpleTypeGenericParameter,
	SimpleTypeInterface,
	SimpleTypeLiteral,
	SimpleTypeMemberNamed,
	SimpleTypeMethod,
	SimpleTypeObject
} from "../simple-type";
import { getTypescriptModule } from "../ts-module";
import { simplifySimpleTypes } from "../utils/simple-type-util";
import {
	getDeclaration,
	getModifiersFromDeclaration,
	getTypeArguments,
	isArray,
	isBigInt,
	isBigIntLiteral,
	isBoolean,
	isBooleanLiteral,
	isDate,
	isEnum,
	isESSymbolLike,
	isFunction,
	isImplicitGeneric,
	isLiteral,
	isMethod,
	isMethodSignature,
	isNever,
	isNode,
	isNonPrimitive,
	isNull,
	isNumber,
	isObject,
	isObjectTypeReference,
	isPromise,
	isString,
	isSymbol,
	isThisType,
	isTupleTypeReference,
	isUndefined,
	isUniqueESSymbol,
	isUnknown,
	isVoid
} from "../utils/ts-util";

export interface ToSimpleTypeOptions {
	eager?: boolean;
	cache?: WeakMap<Type, SimpleType>;
}

interface ToSimpleTypeInternalOptions {
	cache: WeakMap<Type, SimpleType>;
	checker: TypeChecker;
	ts: typeof tsModule;
	eager?: boolean;
}

/**
 * Converts a Typescript type to a "SimpleType"
 * @param type The type to convert.
 * @param checker
 * @param options
 */
export function toSimpleType(type: SimpleType, checker?: TypeChecker, options?: ToSimpleTypeOptions): SimpleType;
export function toSimpleType(type: Node, checker: TypeChecker, options?: ToSimpleTypeOptions): SimpleType;
export function toSimpleType(type: Type, checker: TypeChecker, options?: ToSimpleTypeOptions): SimpleType;
export function toSimpleType(type: Type | Node | SimpleType, checker: TypeChecker, options?: ToSimpleTypeOptions): SimpleType;
export function toSimpleType(type: Type | Node | SimpleType, checker?: TypeChecker, options: ToSimpleTypeOptions = {}): SimpleType {
	if (isSimpleType(type)) {
		return type;
	}

	checker = checker!;

	if (isNode(type)) {
		// "type" is a "Node", convert it to a "Type" and continue.
		return toSimpleType(checker.getTypeAtLocation(type), checker);
	}

	return toSimpleTypeCached(type, {
		checker,
		eager: options.eager,
		cache: options.cache || DEFAULT_TYPE_CACHE,
		ts: getTypescriptModule()
	});
}

function toSimpleTypeCached(type: Type, options: ToSimpleTypeInternalOptions): SimpleType {
	if (options.cache.has(type)) {
		return options.cache.get(type)!;
	}

	// This function will resolve the type and assign the content to "target".
	// This way we can cache "target" before calling "toSimpleTypeInternal" recursively
	const resolveType = (target: SimpleType): void => {
		// Construct the simple type recursively
		//const simpleTypeOverwrite = options.cache.has(type) ? options.cache.get(type)! : toSimpleTypeInternal(type, options);
		const simpleTypeOverwrite = toSimpleTypeInternal(type, options);

		// Strip undefined keys to make the output cleaner
		Object.entries(simpleTypeOverwrite).forEach(([k, v]) => {
			if (v == null) delete simpleTypeOverwrite[k as keyof typeof simpleTypeOverwrite];
		});

		// Transfer properties on the simpleType to the placeholder
		// This makes it possible to keep on using the reference "placeholder".
		Object.assign(target, simpleTypeOverwrite);
	};

	if (options.eager === true) {
		// Make and cache placeholder
		const placeholder = {} as SimpleType;
		options.cache.set(type, placeholder);

		// Resolve type into placeholder
		resolveType(placeholder);

		Object.freeze(placeholder);
		return placeholder;
	} else {
		const placeholder = {} as SimpleType;

		// A function that only resolves the type once
		let didResolve = false;
		const ensureResolved = () => {
			if (!didResolve) {
				resolveType(placeholder);
				didResolve = true;
			}
		};

		// Use "toStringTag" as a hook into resolving the type.
		// If we don't have this hook, console.log would always print "{}" because the type hasn't been resolved
		Object.defineProperty(placeholder, Symbol.toStringTag, {
			get(): string {
				resolveType(placeholder);
				// Don't return any tag. Only use this function as a hook for calling "resolveType"
				return undefined as never;
			}
		});

		// Return a proxy with the purpose of resolving the type lazy
		const proxy = new Proxy(placeholder, {
			ownKeys(target: SimpleType) {
				ensureResolved();
				return [...Object.getOwnPropertyNames(target), ...Object.getOwnPropertySymbols(target)];
			},
			has(target: SimpleType, p: PropertyKey) {
				// Always return true if we test for "kind", but don't resolve the type
				// This way "isSimpleType" (which checks for "kind") will succeed without resolving the type
				if (p === "kind") {
					return true;
				}

				ensureResolved();
				return p in target;
			},
			getOwnPropertyDescriptor(target: SimpleType, p: keyof SimpleType) {
				ensureResolved();
				return Object.getOwnPropertyDescriptor(target, p);
			},
			get: (target: SimpleType, p: keyof SimpleType) => {
				ensureResolved();
				return target[p];
			},
			set: (target: SimpleType, p: keyof SimpleType) => {
				throw new TypeError(`Cannot assign to read only property '${p}'`);
			}
		});

		options.cache.set(type, proxy);

		return proxy;
	}
}

/**
 * Tries to lift a potential generic type and wrap the result in a "GENERIC_ARGUMENTS" simple type and/or "ALIAS" type.
 * Returns the "simpleType" otherwise.
 * @param simpleType
 * @param type
 * @param options
 */
function liftGenericType(type: Type, options: ToSimpleTypeInternalOptions): { generic: (target: SimpleType) => SimpleType; target: Type } | undefined {
	// Check for alias reference
	if (type.aliasSymbol != null) {
		const aliasDeclaration = getDeclaration(type.aliasSymbol, options.ts);
		const typeParameters = getTypeParameters(aliasDeclaration, options);

		return {
			target: type,
			generic: target => {
				// Lift the simple type to an ALIAS type.
				const aliasType: SimpleTypeAlias = {
					kind: "ALIAS",
					name: type.aliasSymbol!.getName() || "",
					target,
					typeParameters
				};

				// Lift the alias type if it uses generic arguments.
				if (type.aliasTypeArguments != null) {
					const typeArguments = Array.from(type.aliasTypeArguments || []).map(t => toSimpleTypeCached(t, options));

					return {
						kind: "GENERIC_ARGUMENTS",
						target: aliasType,
						typeArguments
					};
				}

				return target;
			}
		};
	}

	// Check if the type is a generic interface/class reference and lift it.
	else if (isObject(type, options.ts) && isObjectTypeReference(type, options.ts) && type.typeArguments != null && type.typeArguments.length > 0) {
		// Special case for array, tuple and promise, they are generic in themselves
		if (isImplicitGeneric(type, options.checker, options.ts)) {
			return undefined;
		}

		return {
			target: type.target,
			generic: target => {
				const typeArguments = Array.from(type.typeArguments || []).map(t => toSimpleTypeCached(t, options));

				return {
					kind: "GENERIC_ARGUMENTS",
					target,
					typeArguments
				};
			}
		};
	}

	return undefined;
}

function toSimpleTypeInternal(type: Type, options: ToSimpleTypeInternalOptions): SimpleType {
	const { checker, ts } = options;

	const symbol: ESSymbol | undefined = type.getSymbol();
	const name = symbol != null ? getRealSymbolName(symbol, ts) : undefined;

	let simpleType: SimpleType | undefined;

	const generic = liftGenericType(type, options);
	if (generic != null) {
		type = generic.target;
	}

	if (isLiteral(type, ts)) {
		const literalSimpleType = primitiveLiteralToSimpleType(type, checker, ts);
		if (literalSimpleType != null) {
			// Enum members
			if (symbol != null && symbol.flags & ts.SymbolFlags.EnumMember) {
				const parentSymbol = (symbol as ESSymbol & { parent: ESSymbol | undefined }).parent;

				if (parentSymbol != null) {
					return {
						name: name || "",
						fullName: `${parentSymbol.name}.${name}`,
						kind: "ENUM_MEMBER",
						type: literalSimpleType
					};
				}
			}

			// Literals types
			return literalSimpleType;
		}
	}

	// Primitive types
	else if (isString(type, ts)) {
		simpleType = { kind: "STRING", name };
	} else if (isNumber(type, ts)) {
		simpleType = { kind: "NUMBER", name };
	} else if (isBoolean(type, ts)) {
		simpleType = { kind: "BOOLEAN", name };
	} else if (isBigInt(type, ts)) {
		simpleType = { kind: "BIG_INT", name };
	} else if (isESSymbolLike(type, ts)) {
		simpleType = { kind: "ES_SYMBOL", name };
	} else if (isUndefined(type, ts)) {
		simpleType = { kind: "UNDEFINED", name };
	} else if (isNull(type, ts)) {
		simpleType = { kind: "NULL", name };
	} else if (isUnknown(type, ts)) {
		simpleType = { kind: "UNKNOWN", name };
	} else if (isVoid(type, ts)) {
		simpleType = { kind: "VOID", name };
	} else if (isNever(type, ts)) {
		simpleType = { kind: "NEVER", name };
	}

	// Enum
	else if (isEnum(type, ts) && type.isUnion()) {
		simpleType = {
			name: name || "",
			kind: "ENUM",
			types: type.types.map(t => toSimpleTypeCached(t, options) as SimpleTypeEnumMember)
		};
	}

	// Promise
	else if (isPromise(type, checker, ts)) {
		simpleType = {
			kind: "PROMISE",
			name,
			type: toSimpleTypeCached(getTypeArguments(type, checker, ts)[0], options)
		};
	}

	// Unions and intersections
	else if (type.isUnion()) {
		simpleType = {
			kind: "UNION",
			types: simplifySimpleTypes(type.types.map(t => toSimpleTypeCached(t, options))),
			name
		};
	} else if (type.isIntersection()) {
		simpleType = {
			kind: "INTERSECTION",
			types: simplifySimpleTypes(type.types.map(t => toSimpleTypeCached(t, options))),
			name
		};
	}

	// Date
	else if (isDate(type, ts)) {
		simpleType = {
			kind: "DATE",
			name
		};
	}

	// Array
	else if (isArray(type, checker, ts)) {
		simpleType = {
			kind: "ARRAY",
			type: toSimpleTypeCached(getTypeArguments(type, checker, ts)[0], options),
			name
		};
	} else if (isTupleTypeReference(type, ts)) {
		const types = getTypeArguments(type, checker, ts);

		const minLength = type.target.minLength;

		simpleType = {
			kind: "TUPLE",
			rest: type.target.hasRestElement || false,
			members: types.map((childType, i) => {
				return {
					optional: i >= minLength,
					type: toSimpleTypeCached(childType, options)
				};
			}),
			name
		};
	}

	// Method signatures
	else if (isMethodSignature(type, ts)) {
		const callSignatures = type.getCallSignatures();
		simpleType = getSimpleFunctionFromCallSignatures(callSignatures, options);
	}

	// Class
	else if (type.isClass() && symbol != null) {
		const classDecl = getDeclaration(symbol, ts);

		if (classDecl != null && ts.isClassDeclaration(classDecl)) {
			const ctor = (() => {
				const ctorSymbol = symbol != null && symbol.members != null ? symbol.members.get("__constructor" as never) : undefined;
				if (ctorSymbol != null && symbol != null) {
					const ctorDecl = ctorSymbol.declarations !== undefined && ctorSymbol.declarations?.length > 0 ? ctorSymbol.declarations[0] : ctorSymbol.valueDeclaration;

					if (ctorDecl != null && ts.isConstructorDeclaration(ctorDecl)) {
						return getSimpleFunctionFromSignatureDeclaration(ctorDecl, options) as SimpleTypeFunction;
					}
				}
			})();

			const call = getSimpleFunctionFromCallSignatures(type.getCallSignatures(), options) as SimpleTypeFunction;

			const members = checker
				.getPropertiesOfType(type)
				.map(symbol => {
					const declaration = getDeclaration(symbol, ts);

					// Some instance properties may have an undefined declaration.
					// Since we can't do too much without a declaration, filtering
					// these out seems like the best strategy for the moment.
					//
					// See https://github.com/runem/web-component-analyzer/issues/60 for
					// more info.
					if (declaration == null) return null;

					return {
						name: symbol.name,
						optional: (symbol.flags & ts.SymbolFlags.Optional) !== 0,
						modifiers: getModifiersFromDeclaration(declaration, ts),
						type: toSimpleTypeCached(checker.getTypeAtLocation(declaration), options)
					} as SimpleTypeMemberNamed;
				})
				.filter((member): member is NonNullable<typeof member> => member != null);

			const typeParameters = getTypeParameters(getDeclaration(symbol, ts), options);

			simpleType = {
				kind: "CLASS",
				name,
				call,
				ctor,
				typeParameters,
				members
			};
		}
	}

	// Interface
	else if ((type.isClassOrInterface() || isObject(type, ts)) && !(symbol?.name === "Function")) {
		// Handle the empty object
		if (isObject(type, ts) && symbol?.name === "Object") {
			return {
				kind: "OBJECT"
			};
		}

		const members = type.getProperties().map(symbol => {
			const declaration = getDeclaration(symbol, ts);

			return {
				name: symbol.name,
				optional: (symbol.flags & ts.SymbolFlags.Optional) !== 0,
				modifiers: declaration != null ? getModifiersFromDeclaration(declaration, ts) : [],
				type: toSimpleTypeCached(checker.getTypeAtLocation(symbol.valueDeclaration!), options)
			};
		});

		const ctor = getSimpleFunctionFromCallSignatures(type.getConstructSignatures(), options) as SimpleTypeFunction;

		const call = getSimpleFunctionFromCallSignatures(type.getCallSignatures(), options) as SimpleTypeFunction;

		const typeParameters =
			(type.isClassOrInterface() && type.typeParameters != null ? type.typeParameters.map(t => toSimpleTypeCached(t, options) as SimpleTypeGenericParameter) : undefined) ||
			(symbol != null ? getTypeParameters(getDeclaration(symbol, ts), options) : undefined);

		let indexType: SimpleTypeInterface["indexType"] = {};
		if (type.getStringIndexType()) {
			indexType["STRING"] = toSimpleTypeCached(type.getStringIndexType()!, options);
		}
		if (type.getNumberIndexType()) {
			indexType["NUMBER"] = toSimpleTypeCached(type.getNumberIndexType()!, options);
		}
		if (Object.keys(indexType).length === 0) {
			indexType = undefined;
		}

		// Simplify: if there is only a single "call" signature and nothing else, just return the call signature
		/*if (call != null && members.length === 0 && ctor == null && indexType == null) {
			return { ...call, name, typeParameters };
		}*/

		simpleType = {
			kind: type.isClassOrInterface() ? "INTERFACE" : "OBJECT",
			typeParameters,
			ctor,
			members,
			name,
			indexType,
			call
		} as SimpleTypeInterface | SimpleTypeObject;
	}

	// Handle "object" type
	else if (isNonPrimitive(type, ts)) {
		return {
			kind: "NON_PRIMITIVE"
		};
	}

	// Function
	else if (symbol != null && (isFunction(type, ts) || isMethod(type, ts))) {
		simpleType = getSimpleFunctionFromCallSignatures(type.getCallSignatures(), options, name);

		if (simpleType == null) {
			simpleType = {
				kind: "FUNCTION",
				name
			};
		}
	}

	// Type Parameter
	else if (type.isTypeParameter() && symbol != null) {
		// This type
		if (isThisType(type, ts) && symbol.valueDeclaration != null) {
			return toSimpleTypeCached(checker.getTypeAtLocation(symbol.valueDeclaration), options);
		}

		const defaultType = type.getDefault();
		const defaultSimpleType = defaultType != null ? toSimpleTypeCached(defaultType, options) : undefined;

		simpleType = {
			kind: "GENERIC_PARAMETER",
			name: symbol.getName(),
			default: defaultSimpleType
		} as SimpleTypeGenericParameter;
	}

	// If no type was found, return "ANY"
	if (simpleType == null) {
		simpleType = {
			kind: "ANY",
			name
		};
	}

	// Lift generic types and aliases if possible
	if (generic != null) {
		return generic.generic(simpleType);
	}

	return simpleType;
}

function primitiveLiteralToSimpleType(type: Type, checker: TypeChecker, ts: typeof tsModule): SimpleTypeLiteral | undefined {
	if (type.isNumberLiteral()) {
		return {
			kind: "NUMBER_LITERAL",
			value: type.value
		};
	} else if (type.isStringLiteral()) {
		return {
			kind: "STRING_LITERAL",
			value: type.value
		};
	} else if (isBooleanLiteral(type, ts)) {
		// See https://github.com/Microsoft/TypeScript/issues/22269 for more information
		return {
			kind: "BOOLEAN_LITERAL",
			value: checker.typeToString(type) === "true"
		};
	} else if (isBigIntLiteral(type, ts)) {
		return {
			kind: "BIG_INT_LITERAL",
			/* global BigInt */
			value: BigInt(`${type.value.negative ? "-" : ""}${type.value.base10Value}`)
		};
	} else if (isUniqueESSymbol(type, ts)) {
		return {
			kind: "ES_SYMBOL_UNIQUE",
			value: String(type.escapedName) || Math.floor(Math.random() * 100000000).toString()
		};
	}
}

function getSimpleFunctionFromCallSignatures(signatures: readonly Signature[], options: ToSimpleTypeInternalOptions, fallbackName?: string): SimpleTypeFunction | SimpleTypeMethod | undefined {
	if (signatures.length === 0) {
		return undefined;
	}

	const signature = signatures[signatures.length - 1];

	const signatureDeclaration = signature.getDeclaration();

	return getSimpleFunctionFromSignatureDeclaration(signatureDeclaration, options, fallbackName);
}

function getSimpleFunctionFromSignatureDeclaration(
	signatureDeclaration: SignatureDeclaration,
	options: ToSimpleTypeInternalOptions,
	fallbackName?: string
): SimpleTypeFunction | SimpleTypeMethod | undefined {
	const { checker } = options;

	const symbol = checker.getSymbolAtLocation(signatureDeclaration);

	const parameters = signatureDeclaration.parameters.map(parameterDecl => {
		const argType = checker.getTypeAtLocation(parameterDecl);

		return {
			name: parameterDecl.name.getText() || fallbackName,
			optional: parameterDecl.questionToken != null,
			type: toSimpleTypeCached(argType, options),
			rest: parameterDecl.dotDotDotToken != null,
			initializer: parameterDecl.initializer != null
		} as SimpleTypeFunctionParameter;
	});

	const name = symbol != null ? symbol.getName() : undefined;

	const type = checker.getTypeAtLocation(signatureDeclaration);

	const kind = isMethod(type, options.ts) ? "METHOD" : "FUNCTION";

	const signature = checker.getSignatureFromDeclaration(signatureDeclaration);

	const returnType = signature == null ? undefined : toSimpleTypeCached(checker.getReturnTypeOfSignature(signature), options);

	const typeParameters = getTypeParameters(signatureDeclaration, options);

	return { name, kind, returnType, parameters, typeParameters } as SimpleTypeFunction | SimpleTypeMethod;
}

function getRealSymbolName(symbol: ESSymbol, ts: typeof tsModule): string | undefined {
	const name = symbol.getName();
	if (name != null && [ts.InternalSymbolName.Type, ts.InternalSymbolName.Object, ts.InternalSymbolName.Function].includes(name as never)) {
		return undefined;
	}

	return name;
}

function getTypeParameters(obj: ESSymbol | Declaration | undefined, options: ToSimpleTypeInternalOptions): SimpleTypeGenericParameter[] | undefined {
	if (obj == null) return undefined;

	if (isSymbol(obj)) {
		const decl = getDeclaration(obj, options.ts);
		return getTypeParameters(decl, options);
	}

	if (
		options.ts.isClassDeclaration(obj) ||
		options.ts.isFunctionDeclaration(obj) ||
		options.ts.isFunctionTypeNode(obj) ||
		options.ts.isTypeAliasDeclaration(obj) ||
		options.ts.isMethodDeclaration(obj) ||
		options.ts.isMethodSignature(obj)
	) {
		return obj.typeParameters == null
			? undefined
			: Array.from(obj.typeParameters)
					.map(td => options.checker.getTypeAtLocation(td))
					.map(t => toSimpleTypeCached(t, options) as SimpleTypeGenericParameter);
	}

	return undefined;
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
function log(input: unknown, d = 3) {
	const str = inspect(input, { depth: d, colors: true });

	// eslint-disable-next-line no-console
	console.log(str.replace(/checker: {[\s\S]*?}/g, ""));
}
