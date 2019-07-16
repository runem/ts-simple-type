import { Declaration, Node, Symbol, Type, TypeChecker } from "typescript";
import {
	isImplicitGenericType,
	SimpleType,
	SimpleTypeAlias,
	SimpleTypeClassMember,
	SimpleTypeEnumMember,
	SimpleTypeFunction,
	SimpleTypeFunctionArgument,
	SimpleTypeGenericParameter,
	SimpleTypeInterface,
	SimpleTypeKind,
	SimpleTypeLiteral,
	SimpleTypeMethod,
	SimpleTypeObject
} from "./simple-type";
import { simplifySimpleTypes } from "./simple-type-util";
import { tsModule } from "./ts-module";
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
	isFunction,
	isLiteral,
	isMethod,
	isNever,
	isNode,
	isNull,
	isNumber,
	isObject,
	isObjectTypeReference,
	isPromise,
	isString,
	isTupleTypeReference,
	isUndefined,
	isUnknown,
	isVoid
} from "./ts-util";

/**
 * Converts a Typescript type to a "SimpleType"
 * @param type The type to convert.
 * @param checker
 * @param cache
 */
export function toSimpleType(type: Node, checker: TypeChecker, cache?: WeakMap<Type, SimpleType>): SimpleType;
export function toSimpleType(type: Type, checker: TypeChecker, cache?: WeakMap<Type, SimpleType>): SimpleType;
export function toSimpleType(type: Type | Node, checker: TypeChecker, cache?: WeakMap<Type, SimpleType>): SimpleType {
	if (isNode(type)) {
		// "type" is a "Node", convert it to a "Type" and continue.
		return toSimpleType(checker.getTypeAtLocation(type), checker);
	}

	return toSimpleTypeInternalCaching(type, {
		checker,
		circularCache: new WeakMap<Type, SimpleType>(),
		cache: cache || new WeakMap<Type, SimpleType>()
	});
}

export interface ToSimpleTypeOptions {
	circularCache: WeakMap<Type, SimpleType>;
	cache: WeakMap<Type, SimpleType>;
	checker: TypeChecker;
}

function toSimpleTypeInternalCaching(type: Type, options: ToSimpleTypeOptions): SimpleType {
	const placeholder: SimpleType = {} as any;

	// Cache the result of the conversion to a SimpleType if the type doesn't refer to an alias and is not a type parameter.
	// Here we make sure that all SimpleTypes refer to the same instance.
	if (!options.cache.has(type)) {
		if (type.aliasSymbol == null && type.aliasTypeArguments == null && !type.isTypeParameter() && !(isObject(type) && isObjectTypeReference(type))) {
			options.cache.set(type, placeholder);
		}
	} else {
		return options.cache.get(type)!;
	}

	if (options.circularCache.has(type)) {
		return {
			kind: SimpleTypeKind.CIRCULAR_TYPE_REF,
			ref: options.circularCache.get(type)!
		};
	} else {
		// Connect the type to the placeholder reference
		// Circular types will point to this reference
		// Only return a circular ref if it's a class of interface.
		// Don't return circular ref if it's a primitive like a "number"
		if (type.isClassOrInterface() || (isObject(type) && isObjectTypeReference(type))) {
			options.circularCache.set(type, placeholder);
		}
	}

	// Construct the simple type recursively
	const simpleTypeOverwrite = toSimpleTypeInternal(type, options);

	// Strip undefined keys to make the output cleaner
	Object.entries<any>(simpleTypeOverwrite).forEach(([k, v]) => {
		if (v == null) delete simpleTypeOverwrite[k as keyof typeof simpleTypeOverwrite];
	});

	// Transfer properties on the simpleType to the placeholder
	// This makes it possible to keep on using the reference "placeholder".
	Object.assign(placeholder, simpleTypeOverwrite);

	// Try to lift a potential generic type and wrap the result in a "GENERIC_ARGUMENTS" simple type and/or "ALIAS" type.
	return liftGenericType(placeholder, type, options);
}

/**
 * Tries to lift a potential generic type and wrap the result in a "GENERIC_ARGUMENTS" simple type and/or "ALIAS" type.
 * Returns the "simpleType" otherwise.
 * @param simpleType
 * @param type
 * @param options
 */
function liftGenericType(simpleType: SimpleType, type: Type, options: ToSimpleTypeOptions): SimpleType {
	// Check for alias reference
	if (type.aliasSymbol != null) {
		const aliasDeclaration = getDeclaration(type.aliasSymbol);
		const typeParameters = getTypeParameters(aliasDeclaration, options);

		// Lift the simple type to an ALIAS type.
		const aliasType: SimpleTypeAlias = {
			kind: SimpleTypeKind.ALIAS,
			name: type.aliasSymbol.getName(),
			target: simpleType,
			typeParameters
		};

		// Lift the alias type if it uses generic arguments.
		if (type.aliasTypeArguments != null) {
			const typeArguments = Array.from(type.aliasTypeArguments || []).map(t => toSimpleTypeInternalCaching(t, options));

			return {
				kind: SimpleTypeKind.GENERIC_ARGUMENTS,
				target: aliasType,
				typeArguments
			};
		}

		return aliasType;
	}

	// Check if the type is a generic interface/class reference and lift it.
	else if (isObject(type) && isObjectTypeReference(type) && type.typeArguments != null) {
		// Special case for array, tuple and promise, they are generic in themselves
		if (isImplicitGenericType(simpleType)) {
			return simpleType;
		}

		const typeArguments = Array.from(type.typeArguments || []).map(t => toSimpleTypeInternalCaching(t, options));

		return {
			kind: SimpleTypeKind.GENERIC_ARGUMENTS,
			target: simpleType,
			typeArguments
		};
	}

	return simpleType;
}

function toSimpleTypeInternal(type: Type, options: ToSimpleTypeOptions): SimpleType {
	const { checker } = options;

	const symbol = type.getSymbol();
	const name = symbol != null ? getRealSymbolName(symbol) : undefined;

	if (isLiteral(type)) {
		const literalSimpleType = literalToSimpleType(type, checker);
		if (literalSimpleType != null) {
			// Enum members
			if (symbol != null && symbol.flags & tsModule.ts.SymbolFlags.EnumMember) {
				const parentSymbol = (symbol as any).parent as Symbol | undefined;

				if (parentSymbol != null) {
					return {
						name: name || "",
						fullName: `${parentSymbol.name}.${name}`,
						kind: SimpleTypeKind.ENUM_MEMBER,
						type: literalSimpleType
					};
				}
			}

			// Literals types
			return literalSimpleType;
		}
	}

	// Primitive types
	else if (isString(type)) {
		return { kind: SimpleTypeKind.STRING, name };
	} else if (isNumber(type)) {
		return { kind: SimpleTypeKind.NUMBER, name };
	} else if (isBoolean(type)) {
		return { kind: SimpleTypeKind.BOOLEAN, name };
	} else if (isBigInt(type)) {
		return { kind: SimpleTypeKind.BIG_INT, name };
	} else if (isUndefined(type)) {
		return { kind: SimpleTypeKind.UNDEFINED, name };
	} else if (isNull(type)) {
		return { kind: SimpleTypeKind.NULL, name };
	} else if (isUnknown(type)) {
		return { kind: SimpleTypeKind.UNKNOWN, name };
	} else if (isVoid(type)) {
		return { kind: SimpleTypeKind.VOID, name };
	} else if (isNever(type)) {
		return { kind: SimpleTypeKind.NEVER, name };
	}

	// Enum
	else if (isEnum(type) && type.isUnion()) {
		return {
			name: name || "",
			kind: SimpleTypeKind.ENUM,
			types: type.types.map(t => toSimpleTypeInternalCaching(t, options) as SimpleTypeEnumMember)
		};
	}

	// Promise
	else if (isPromise(type)) {
		return {
			kind: SimpleTypeKind.PROMISE,
			name,
			type: toSimpleTypeInternalCaching(getTypeArguments(type)[0], options)
		};
	}

	// Unions and intersections
	else if (type.isUnion()) {
		return {
			kind: SimpleTypeKind.UNION,
			types: simplifySimpleTypes(type.types.map(t => toSimpleTypeInternalCaching(t, options))),
			name
		};
	} else if (type.isIntersection()) {
		return {
			kind: SimpleTypeKind.INTERSECTION,
			types: simplifySimpleTypes(type.types.map(t => toSimpleTypeInternalCaching(t, options))),
			name
		};
	}

	// Date
	else if (isDate(type)) {
		return {
			kind: SimpleTypeKind.DATE,
			name
		};
	}

	// Array
	else if (isArray(type)) {
		return {
			kind: SimpleTypeKind.ARRAY,
			type: toSimpleTypeInternalCaching(getTypeArguments(type)[0], options),
			name
		};
	} else if (isTupleTypeReference(type)) {
		const types = getTypeArguments(type);

		const minLength = type.target.minLength;

		return {
			kind: SimpleTypeKind.TUPLE,
			hasRestElement: type.target.hasRestElement || false,
			members: types.map((childType, i) => {
				return {
					optional: i >= minLength,
					type: toSimpleTypeInternalCaching(childType, options)
				};
			}),
			name
		};
	}

	// Function
	else if (symbol != null && (isFunction(type) || isMethod(type))) {
		const functionDeclaration = getDeclaration(symbol);
		if (functionDeclaration != null) {
			const simpleType = getSimpleFunctionFromDeclaration(functionDeclaration, options, true);

			if (simpleType != null) {
				simpleType.name = simpleType.name || name;
			}

			if (simpleType != null) {
				return simpleType;
			}

			return {
				kind: SimpleTypeKind.FUNCTION,
				name
			};
		}
	}

	// Alternative way of getting functions
	else if (isObject(type) && type.getCallSignatures().length > 0) {
		const functionDeclaration = type.getCallSignatures()[0].getDeclaration();
		const simpleType = getSimpleFunctionFromDeclaration(functionDeclaration, options, true);
		if (simpleType != null) {
			return simpleType;
		}
	}

	// Class
	else if (type.isClass() && symbol != null) {
		const classDecl = getDeclaration(symbol);

		if (classDecl != null && tsModule.ts.isClassDeclaration(classDecl)) {
			const ctor = (() => {
				const ctorSymbol = symbol != null && symbol.members != null ? symbol.members.get("__constructor" as any) : undefined;
				if (ctorSymbol != null && symbol != null) {
					const ctorDecl = ctorSymbol.declarations.length > 0 ? ctorSymbol.declarations[0] : ctorSymbol.valueDeclaration;

					if (ctorDecl != null && tsModule.ts.isConstructorDeclaration(ctorDecl)) {
						return getSimpleFunctionFromDeclaration(ctorDecl, options, false) as SimpleTypeFunction;
					}
				}
			})();

			const members = checker
				.getPropertiesOfType(type)
				.map(symbol => {
					const declaration = getDeclaration(symbol);

					// Some instance properties may have an undefined declaration.
					// Since we can't do too much without a declaration, filtering
					// these out seems like the best strategy for the moment.
					//
					// See https://github.com/runem/web-component-analyzer/issues/60 for
					// more info.
					if (declaration == null) return null;

					return {
						name: symbol.name,
						modifiers: getModifiersFromDeclaration(declaration),
						type: toSimpleTypeInternalCaching(checker.getTypeAtLocation(declaration), options)
					} as SimpleTypeClassMember;
				})
				.filter((member): member is NonNullable<typeof member> => member != null);

			const typeParameters = getTypeParameters(getDeclaration(symbol), options);

			return {
				kind: SimpleTypeKind.CLASS,
				name,
				ctor,
				typeParameters,
				properties: members.filter(m => m.type.kind !== SimpleTypeKind.METHOD),
				methods: members.filter(m => m.type.kind === SimpleTypeKind.METHOD)
			};
		}
	}

	// Interface
	else if (type.isClassOrInterface() || isObject(type)) {
		const members = checker.getPropertiesOfType(type).map(symbol => ({
			name: symbol.name,
			optional: (symbol.flags & tsModule.ts.SymbolFlags.Optional) !== 0,
			type: toSimpleTypeInternalCaching(checker.getTypeAtLocation(symbol.valueDeclaration), options)
		}));

		const typeParameters =
			(isObjectTypeReference(type) && type.target.typeParameters ? type.target.typeParameters.map(t => toSimpleTypeInternalCaching(t, options) as SimpleTypeGenericParameter) : undefined) ||
			(symbol != null ? getTypeParameters(getDeclaration(symbol), options) : undefined);

		return {
			kind: type.isClassOrInterface() ? SimpleTypeKind.INTERFACE : SimpleTypeKind.OBJECT,
			typeParameters,
			members,
			name
		} as SimpleTypeInterface | SimpleTypeObject;
	}

	if (type.isTypeParameter() && symbol != null) {
		const defaultType = type.getDefault();
		const defaultSimpleType = defaultType != null ? toSimpleTypeInternalCaching(defaultType, options) : undefined;

		return {
			kind: SimpleTypeKind.GENERIC_PARAMETER,
			name: symbol.getName(),
			default: defaultSimpleType
		} as SimpleTypeGenericParameter;
	}

	return {
		kind: SimpleTypeKind.ANY,
		name
	};
}

function literalToSimpleType(type: Type, checker: TypeChecker): SimpleTypeLiteral | undefined {
	if (type.isNumberLiteral()) {
		return {
			kind: SimpleTypeKind.NUMBER_LITERAL,
			value: type.value
		};
	} else if (type.isStringLiteral()) {
		return {
			kind: SimpleTypeKind.STRING_LITERAL,
			value: type.value
		};
	} else if (isBooleanLiteral(type)) {
		// See https://github.com/Microsoft/TypeScript/issues/22269 for more information
		return {
			kind: SimpleTypeKind.BOOLEAN_LITERAL,
			value: checker.typeToString(type) === "true"
		};
	} else if (isBigIntLiteral(type)) {
		return {
			kind: SimpleTypeKind.BIG_INT_LITERAL,
			value: BigInt(`${type.value.negative ? "-" : ""}${type.value.base10Value}`)
		};
	}
}

function getSimpleFunctionFromDeclaration(functionDeclaration: Declaration, options: ToSimpleTypeOptions, checkReturnType: boolean): SimpleTypeFunction | SimpleTypeMethod | undefined {
	const { checker } = options;

	const symbol = checker.getSymbolAtLocation(functionDeclaration);

	const type = checker.getTypeAtLocation(functionDeclaration);

	if (tsModule.ts.isFunctionLike(functionDeclaration)) {
		const signature = checker.getSignatureFromDeclaration(functionDeclaration);

		if (signature != null) {
			const argTypes = functionDeclaration.parameters.map(parameterDecl => {
				const argType = checker.getTypeAtLocation(parameterDecl);

				return {
					name: parameterDecl.name.getText(),
					optional: parameterDecl.questionToken != null,
					type: toSimpleTypeInternalCaching(argType, options),
					spread: parameterDecl.dotDotDotToken != null,
					initializer: parameterDecl.initializer != null
				} as SimpleTypeFunctionArgument;
			});

			const name = symbol != null ? symbol.getName() : undefined;

			const kind = isMethod(type) ? SimpleTypeKind.METHOD : SimpleTypeKind.FUNCTION;

			const returnType = toSimpleTypeInternalCaching(checker.getReturnTypeOfSignature(signature), options);

			const typeParameters = getTypeParameters(functionDeclaration, options);

			return { name, kind, returnType, argTypes, typeParameters } as SimpleTypeFunction | SimpleTypeMethod;
		}
	}
}

const BLACKLISTED_SYMBOL_NAMES = ["__type", "__object", "__function"];

function getRealSymbolName(symbol: Symbol): string | undefined {
	const name = symbol.getName();
	if (name != null && BLACKLISTED_SYMBOL_NAMES.includes(name)) {
		return undefined;
	}

	return name;
}

function getTypeParameters(declaration: Declaration | undefined, options: ToSimpleTypeOptions): SimpleTypeGenericParameter[] | undefined {
	if (declaration == null) return undefined;

	if (
		tsModule.ts.isClassDeclaration(declaration) ||
		tsModule.ts.isFunctionDeclaration(declaration) ||
		tsModule.ts.isFunctionTypeNode(declaration) ||
		tsModule.ts.isTypeAliasDeclaration(declaration) ||
		tsModule.ts.isMethodDeclaration(declaration) ||
		tsModule.ts.isMethodSignature(declaration)
	) {
		return declaration.typeParameters == null
			? undefined
			: Array.from(declaration.typeParameters)
					.map(td => options.checker.getTypeAtLocation(td))
					.map(t => toSimpleTypeInternalCaching(t, options) as SimpleTypeGenericParameter);
	}

	return undefined;
}
