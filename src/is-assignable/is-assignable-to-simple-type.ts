import { DEFAULT_GENERIC_PARAMETER_TYPE, DEFAULT_RESULT_CACHE, NEVER_TYPE } from "../constants";
import {
	isSimpleTypeLiteral,
	isSimpleTypePrimitive,
	SimpleType,
	SimpleTypeFunctionParameter,
	SimpleTypeGenericArguments,
	SimpleTypeGenericParameter,
	SimpleTypeIntersection,
	SimpleTypeKind,
	SimpleTypeMemberNamed,
	SimpleTypeObject,
	SimpleTypeObjectTypeBase,
	SimpleTypeTuple
} from "../simple-type";
import { simpleTypeToString } from "../transform/simple-type-to-string";
import { and, or } from "../utils/list-util";
import { resolveType as resolveTypeUnsafe } from "../utils/resolve-type";
import { extendTypeParameterMap, getTupleLengthType } from "../utils/simple-type-util";
import { isAssignableToSimpleTypeKind } from "./is-assignable-to-simple-type-kind";
import { SimpleTypeComparisonOptions } from "./simple-type-comparison-options";

interface IsAssignableToSimpleTypeInternalOptions {
	config: SimpleTypeComparisonOptions;
	cache: WeakMap<SimpleType, WeakMap<SimpleType, boolean>>;
	insideType: Set<SimpleType>;
	comparingTypes: Map<SimpleType, Set<SimpleType>>;
	genericParameterMapA: Map<string, SimpleType>;
	genericParameterMapB: Map<string, SimpleType>;
	preventCaching: () => void;
	operations: { value: number };
	depth: number;
}

/**
 * Returns if typeB is assignable to typeA.
 * @param typeA Type A
 * @param typeB Type B
 * @param config
 */
export function isAssignableToSimpleType(typeA: SimpleType, typeB: SimpleType, config?: SimpleTypeComparisonOptions): boolean {
	const userCache = config?.cache;

	config = {
		...config,
		cache: undefined,
		strict: config?.strict ?? true,
		strictFunctionTypes: config?.strictFunctionTypes ?? config?.strict ?? true,
		strictNullChecks: config?.strictNullChecks ?? config?.strict ?? true,
		maxDepth: config?.maxDepth ?? 50,
		maxOps: config?.maxOps ?? 1000
	};

	const cacheKey = `${config.strict}:${config.strictFunctionTypes}:${config.strictNullChecks}`;
	const cache = DEFAULT_RESULT_CACHE.get(cacheKey) || new WeakMap();
	DEFAULT_RESULT_CACHE.set(cacheKey, cache);

	return isAssignableToSimpleTypeCached(typeA, typeB, {
		config,
		operations: { value: 0 },
		depth: 0,
		cache: userCache || cache,
		insideType: new Set(),
		comparingTypes: new Map(),
		genericParameterMapA: new Map(),
		genericParameterMapB: new Map(),
		preventCaching: () => {}
	});
}

function isAssignableToSimpleTypeCached(typeA: SimpleType, typeB: SimpleType, options: IsAssignableToSimpleTypeInternalOptions): boolean {
	let typeACache = options.cache.get(typeA)!;
	let preventCaching = false;

	if (typeACache?.has(typeB)) {
		if (options.config.debug) {
			logDebug(
				options,
				"caching",
				`Found cache when comparing: ${simpleTypeToStringLazy(typeA)} (${typeA.kind}) and ${simpleTypeToStringLazy(typeB)} (${typeB.kind}). Cache content: ${typeACache.get(typeB)}`
			);
		}

		return typeACache.get(typeB)!;
	}

	// Call "isAssignableToSimpleTypeInternal" with a mutated options object
	const result = isAssignableToSimpleTypeInternal(typeA, typeB, {
		depth: options.depth,
		operations: options.operations,
		genericParameterMapA: options.genericParameterMapA,
		genericParameterMapB: options.genericParameterMapB,
		config: options.config,
		insideType: options.insideType,
		comparingTypes: options.comparingTypes,
		cache: options.cache,
		preventCaching: () => {
			options.preventCaching();
			preventCaching = true;
		}
	});

	if (!preventCaching) {
		/*if (options.config.debug) {
			logDebug(
				options,
				"caching",
				`Setting cache for comparison between ${simpleTypeToStringLazy(typeA)} (${typeA.kind}) and ${simpleTypeToStringLazy(typeB)} (${typeB.kind}). Result: ${result}`
			);
		}*/
		if (typeACache == null) {
			typeACache = new WeakMap();
			options.cache.set(typeA, typeACache);
		}

		typeACache.set(typeB, result);
	}

	return result;
}

function isCacheableType(simpleType: SimpleType, options: IsAssignableToSimpleTypeInternalOptions): boolean {
	switch (simpleType.kind) {
		case "UNION":
		case "INTERSECTION":
			if (options.genericParameterMapA.size !== 0 || options.genericParameterMapB.size !== 0) {
				return false;
			}

			break;
	}
	return !("typeParameters" in simpleType) && !["GENERIC_ARGUMENTS", "GENERIC_PARAMETER", "PROMISE", "LAZY"].includes(simpleType.kind);
}

function isAssignableToSimpleTypeInternal(typeA: SimpleType, typeB: SimpleType, options: IsAssignableToSimpleTypeInternalOptions): boolean {
	// It's assumed that the "options" parameter is already an unique reference that is safe to mutate.

	// Mutate depth and "operations"
	options.depth = options.depth + 1;
	options.operations.value++;

	// Handle debugging nested calls to isAssignable
	if (options.config.debug === true) {
		logDebugHeader(typeA, typeB, options);
	}

	if (options.depth >= options.config.maxDepth! || options.operations.value >= options.config.maxOps!) {
		options.preventCaching();
		return true;
	}

	// When comparing types S and T, the relationship in question is assumed to be true
	//   for every directly or indirectly nested occurrence of the same S and the same T
	if (options.comparingTypes.has(typeA)) {
		if (options.comparingTypes.get(typeA)!.has(typeB)) {
			options.preventCaching();

			if (options.config.debug) {
				logDebug(options, "comparing types", "Returns true because this relation is already being checking");
			}

			return true;
		}
	}

	// We might need a better way of handling refs, but these check are good for now
	if (options.insideType.has(typeA) || options.insideType.has(typeB)) {
		if (options.config.debug) {
			logDebug(
				options,
				"inside type",
				`{${typeA.kind}, ${typeB.kind}} {typeA: ${options.insideType.has(typeA)}} {typeB: ${options.insideType.has(typeB)}} {insideTypeMap: ${Array.from(options.insideType.keys())
					.map(t => simpleTypeToStringLazy(t))
					.join()}}`
			);
		}

		options.preventCaching();

		return true;
	}

	// Handle two types being equal
	// Types are not necessarily equal if they have typeParams because we still need to check the actual generic arguments
	if (isCacheableType(typeA, options) && isCacheableType(typeB, options)) {
		if (typeA === typeB) {
			if (options.config.debug) {
				logDebug(options, "equal", "The two types are equal!", typeA.kind, typeB.kind);
			}
			return true;
		}
	} else {
		options.preventCaching();
	}

	// Make it possible to overwrite default behavior by running user defined logic for comparing types
	if (options.config.isAssignable != null) {
		const result = options.config.isAssignable(typeA, typeB, options.config);
		if (result != null) {
			//options.preventCaching();
			return result;
		}
	}

	// Any and unknown. Everything is assignable to "ANY" and "UNKNOWN"
	if (typeA.kind === "UNKNOWN" || typeA.kind === "ANY") {
		return true;
	}

	// Mutate options and add this comparison to "comparingTypes".
	// Only do this if one of the types is not a primitive to save memory.
	if (!isSimpleTypePrimitive(typeA) && !isSimpleTypePrimitive(typeB)) {
		const comparingTypes = new Map(options.comparingTypes);

		if (comparingTypes.has(typeA)) {
			comparingTypes.get(typeA)!.add(typeB);
		} else {
			comparingTypes.set(typeA, new Set([typeB]));
		}

		options.comparingTypes = comparingTypes;
	}

	// #####################
	// Expand typeB
	// #####################
	switch (typeB.kind) {
		// [typeB] (expand)
		case "UNION": {
			// Some types seems to absorb other types when type checking a union (eg. 'unknown').
			// Usually typescript will absorb those types for us, but not when working with generic parameters.
			// The following line needs to be improved.
			const types = typeB.types.filter(t => resolveType(t, options.genericParameterMapB) !== DEFAULT_GENERIC_PARAMETER_TYPE);
			return and(types, childTypeB => isAssignableToSimpleTypeCached(typeA, childTypeB, options));
		}

		// [typeB] (expand)
		case "INTERSECTION": {
			// If we compare an intersection against an intersection, we need to compare from typeA and not typeB
			// Example: [string, number] & [string] === [string, number] & [string]
			if (typeA.kind === "INTERSECTION") {
				break;
			}

			const combined = reduceIntersectionIfPossible(typeB, options.genericParameterMapB);

			if (combined.kind === "NEVER") {
				if (options.config.debug) {
					logDebug(options, "intersection", `Combining types in intersection is impossible. Comparing with 'never' instead.`);
				}

				return isAssignableToSimpleTypeCached(typeA, { kind: "NEVER" }, options);
			}

			if (options.config.debug) {
				if (combined !== typeB) {
					logDebug(options, "intersection", `Types in intersection were combined into: ${simpleTypeToStringLazy(combined)}`);
				}
			}

			if (combined.kind !== "INTERSECTION") {
				return isAssignableToSimpleTypeCached(typeA, combined, options);
			}

			// An intersection type I is assignable to a type T if any type in I is assignable to T.
			return or(combined.types, memberB => isAssignableToSimpleTypeCached(typeA, memberB, options));
		}

		// [typeB] (expand)
		case "ALIAS": {
			return isAssignableToSimpleTypeCached(typeA, typeB.target, options);
		}

		// [typeB] (expand)
		case "GENERIC_ARGUMENTS": {
			const updatedGenericParameterMapB = extendTypeParameterMap(typeB, options.genericParameterMapB);

			if (options.config.debug) {
				logDebug(
					options,
					"generic args",
					"Expanding with typeB args: ",
					Array.from(updatedGenericParameterMapB.entries())
						.map(([name, type]) => `${name}=${simpleTypeToStringLazy(type)}`)
						.join("; "),
					"typeParameters" in typeB.target ? "" : "[No type parameters in target!]"
				);
			}

			return isAssignableToSimpleTypeCached(typeA, typeB.target, {
				...options,
				genericParameterMapB: updatedGenericParameterMapB
			});
		}

		// [typeB] (expand)
		case "GENERIC_PARAMETER": {
			const resolvedArgument = options.genericParameterMapB.get(typeB.name);
			const realTypeB = resolvedArgument || typeB.default || DEFAULT_GENERIC_PARAMETER_TYPE;

			if (options.config.debug) {
				logDebug(
					options,
					"generic",
					`Resolving typeB for param ${typeB.name} to:`,
					simpleTypeToStringLazy(realTypeB),
					", Default: ",
					simpleTypeToStringLazy(typeB.default),
					", In map: ",
					options.genericParameterMapB.has(typeB.name),
					", GenericParamMapB: ",
					Array.from(options.genericParameterMapB.entries())
						.map(([name, t]) => `${name}=${simpleTypeToStringLazy(t)}`)
						.join("; ")
				);
			}

			return isAssignableToSimpleTypeCached(typeA, realTypeB, options);
		}
	}

	// #####################
	// Compare typeB
	// #####################
	switch (typeB.kind) {
		// [typeB] (compare)
		case "ENUM_MEMBER": {
			return isAssignableToSimpleTypeCached(typeA, typeB.type, options);
		}

		// [typeB] (compare)
		case "ENUM": {
			return and(typeB.types, childTypeB => isAssignableToSimpleTypeCached(typeA, childTypeB, options));
		}

		// [typeB] (compare)
		case "UNDEFINED":
		case "NULL": {
			// When strict null checks are turned off, "undefined" and "null" are in the domain of every type but never
			if (!options.config.strictNullChecks) {
				return typeA.kind !== "NEVER";
			}

			break;
		}

		// [typeB] (compare)
		case "ANY": {
			// "any" can be assigned to anything but "never"
			return typeA.kind !== "NEVER";
		}

		// [typeB] (compare)
		case "NEVER": {
			// "never" can be assigned to anything
			return true;
		}
	}

	// #####################
	// Expand typeA
	// #####################
	switch (typeA.kind) {
		// [typeA] (expand)
		case "ALIAS": {
			return isAssignableToSimpleTypeCached(typeA.target, typeB, options);
		}

		// [typeA] (expand)
		case "GENERIC_PARAMETER": {
			const resolvedArgument = options.genericParameterMapA.get(typeA.name);
			const realTypeA = resolvedArgument || typeA.default || DEFAULT_GENERIC_PARAMETER_TYPE;

			if (options.config.debug) {
				logDebug(
					options,
					"generic",
					`Resolving typeA for param ${typeA.name} to:`,
					simpleTypeToStringLazy(realTypeA),
					", Default: ",
					simpleTypeToStringLazy(typeA.default),
					", In map: ",
					options.genericParameterMapA.has(typeA.name),
					", GenericParamMapA: ",
					Array.from(options.genericParameterMapA.entries())
						.map(([name, t]) => `${name}=${simpleTypeToStringLazy(t)}`)
						.join("; ")
				);
			}

			return isAssignableToSimpleTypeCached(realTypeA, typeB, options);
		}

		// [typeA] (expand)
		case "GENERIC_ARGUMENTS": {
			const updatedGenericParameterMapA = extendTypeParameterMap(typeA, options.genericParameterMapA);

			if (options.config.debug) {
				logDebug(
					options,
					"generic args",
					"Expanding with typeA args: ",
					Array.from(updatedGenericParameterMapA.entries())
						.map(([name, type]) => `${name}=${simpleTypeToStringLazy(type)}`)
						.join("; "),
					"typeParameters" in typeA.target ? "" : "[No type parameters in target!]"
				);
			}

			return isAssignableToSimpleTypeCached(typeA.target, typeB, {
				...options,
				genericParameterMapA: updatedGenericParameterMapA
			});
		}

		// [typeA] (expand)
		case "UNION": {
			// Some types seems to absorb other types when type checking a union (eg. 'unknown').
			// Usually typescript will absorb those types for us, but not when working with generic parameters.
			// The following line needs to be improved.
			const types = typeA.types.filter(t => resolveType(t, options.genericParameterMapA) !== DEFAULT_GENERIC_PARAMETER_TYPE || typeB === DEFAULT_GENERIC_PARAMETER_TYPE);
			return or(types, childTypeA => isAssignableToSimpleTypeCached(childTypeA, typeB, options));
		}

		// [typeA] (expand)
		case "INTERSECTION": {
			const combined = reduceIntersectionIfPossible(typeA, options.genericParameterMapA);

			if (combined.kind === "NEVER") {
				if (options.config.debug) {
					logDebug(options, "intersection", `Combining types in intersection is impossible. Comparing with 'never' instead.`);
				}

				return isAssignableToSimpleTypeCached({ kind: "NEVER" }, typeB, options);
			}

			if (options.config.debug) {
				if (combined !== typeA) {
					logDebug(options, "intersection", `Types in intersection were combined into: ${simpleTypeToStringLazy(combined)}`);
				}
			}

			if (combined.kind !== "INTERSECTION") {
				return isAssignableToSimpleTypeCached(combined, typeB, options);
			}

			// A type T is assignable to an intersection type I if T is assignable to each type in I.
			return and(combined.types, memberA => isAssignableToSimpleTypeCached(memberA, typeB, options));
		}
	}

	// #####################
	// Compare typeA
	// #####################
	switch (typeA.kind) {
		// [typeA] (compare)
		case "NON_PRIMITIVE": {
			if (options.config.debug) {
				logDebug(options, "object", `Checking if typeB is non-primitive [primitive=${isSimpleTypePrimitive(typeB)}] [hasName=${typeB.name != null}]`);
			}

			if (isSimpleTypePrimitive(typeB)) {
				return typeB.name != null;
			}

			return typeB.kind !== "UNKNOWN";
		}

		// [typeA] (compare)
		case "ARRAY": {
			if (typeB.kind === "ARRAY") {
				return isAssignableToSimpleTypeCached(typeA.type, typeB.type, options);
			} else if (typeB.kind === "TUPLE") {
				return and(typeB.members, memberB => isAssignableToSimpleTypeCached(typeA.type, memberB.type, options));
			}

			return false;
		}

		// [typeA] (compare)
		case "ENUM": {
			return or(typeA.types, childTypeA => isAssignableToSimpleTypeCached(childTypeA, typeB, options));
		}

		// [typeA] (compare)
		case "NUMBER_LITERAL":
		case "STRING_LITERAL":
		case "BIG_INT_LITERAL":
		case "BOOLEAN_LITERAL":
		case "ES_SYMBOL_UNIQUE": {
			return isSimpleTypeLiteral(typeB) ? typeA.value === typeB.value : false;
		}

		// [typeA] (compare)
		case "ENUM_MEMBER": {
			// You can always assign a "number" | "number literal" to a "number literal" enum member type.
			if (resolveType(typeA.type, options.genericParameterMapA).kind === "NUMBER_LITERAL" && ["NUMBER", "NUMBER_LITERAL"].includes(typeB.kind)) {
				if (typeB.name != null) {
					return false;
				}

				return true;
			}

			return isAssignableToSimpleTypeCached(typeA.type, typeB, options);
		}

		// [typeA] (compare)
		case "STRING":
		case "BOOLEAN":
		case "NUMBER":
		case "ES_SYMBOL":
		case "BIG_INT": {
			if (typeB.name != null) {
				return false;
			}

			if (isSimpleTypeLiteral(typeB)) {
				return PRIMITIVE_TYPE_TO_LITERAL_MAP[typeA.kind] === typeB.kind;
			}

			return typeA.kind === typeB.kind;
		}

		// [typeA] (compare)
		case "UNDEFINED":
		case "NULL": {
			return typeA.kind === typeB.kind;
		}

		// [typeA] (compare)
		case "VOID": {
			return typeB.kind === "VOID" || typeB.kind === "UNDEFINED";
		}

		// [typeA] (compare)
		case "NEVER": {
			return false;
		}

		// [typeA] (compare)
		// https://www.typescriptlang.org/docs/handbook/type-compatibility.html#comparing-two-functions
		case "FUNCTION":
		case "METHOD": {
			if ("call" in typeB && typeB.call != null) {
				return isAssignableToSimpleTypeCached(typeA, typeB.call, options);
			}

			if (typeB.kind !== "FUNCTION" && typeB.kind !== "METHOD") return false;

			if (typeB.parameters == null || typeB.returnType == null) return typeA.parameters == null || typeA.returnType == null;
			if (typeA.parameters == null || typeA.returnType == null) return true;

			// Any return type is assignable to void
			if (options.config.debug) {
				logDebug(options, "function", `Checking if return type of typeA is 'void'`);
			}

			if (!isAssignableToSimpleTypeKind(typeA.returnType, "VOID")) {
				//if (!isAssignableToSimpleTypeInternal(typeA.returnType, { kind: "VOID" }, options)) {
				if (options.config.debug) {
					logDebug(options, "function", `Return type is not void. Checking return types`);
				}

				if (!isAssignableToSimpleTypeCached(typeA.returnType, typeB.returnType, options)) {
					return false;
				}
			}

			// Test "this" types
			const typeAThisParam = typeA.parameters.find(arg => arg.name === "this");
			const typeBThisParam = typeB.parameters.find(arg => arg.name === "this");

			if (typeAThisParam != null && typeBThisParam != null) {
				if (options.config.debug) {
					logDebug(options, "function", `Checking 'this' param`);
				}

				if (!isAssignableToSimpleTypeCached(typeAThisParam.type, typeBThisParam.type, options)) {
					return false;
				}
			}

			// Get all "non-this" params
			const paramTypesA = typeAThisParam == null ? typeA.parameters : typeA.parameters.filter(arg => arg !== typeAThisParam);
			const paramTypesB = typeBThisParam == null ? typeB.parameters : typeB.parameters.filter(arg => arg !== typeBThisParam);

			// A function with 0 params can be assigned to any other function
			if (paramTypesB.length === 0) {
				return true;
			}

			// A function with more required params than typeA isn't assignable
			const requiredParamCountB = paramTypesB.reduce((sum, param) => (param.optional || param.rest ? sum : sum + 1), 0);
			if (requiredParamCountB > paramTypesA.length) {
				if (options.config.debug) {
					logDebug(options, "function", `typeB has more required params than typeA: ${requiredParamCountB} > ${paramTypesA.length}`);
				}
				return false;
			}

			let prevParamA: SimpleTypeFunctionParameter | undefined = undefined;
			let prevParamB: SimpleTypeFunctionParameter | undefined = undefined;

			// Compare the types of each param
			for (let i = 0; i < Math.max(paramTypesA.length, paramTypesB.length); i++) {
				let paramA = paramTypesA[i];
				let paramB = paramTypesB[i];

				if (options.config.debug) {
					logDebug(
						options,
						"function",
						`${i} ['${paramA?.name || "???"}' AND '${paramB?.name || "???"}'] Checking parameters ${options.config.strictFunctionTypes ? "[contravariant]" : "[bivariant]"}: [${
							paramA?.type == null ? "???" : simpleTypeToStringLazy(paramA.type)
						}  AND  ${paramB?.type == null ? "???" : simpleTypeToStringLazy(paramB.type)}]`
					);
				}

				// Try to find the last param in typeA. If it's a rest param, continue with that one
				if (paramA == null && prevParamA?.rest) {
					if (options.config.debug) {
						logDebug(options, "function", `paramA is null and but last param in typeA is rest. Use that one.`);
					}

					paramA = prevParamA;
				}

				// Try to find the last param in typeB. If it's a rest param, continue with that one
				if (paramB == null && prevParamB?.rest) {
					if (options.config.debug) {
						logDebug(options, "function", `paramB is null and but last param in typeB is rest. Use that one.`);
					}

					paramB = prevParamB;
				}

				prevParamA = paramA;
				prevParamB = paramB;

				// If paramA is not present, check if paramB is optional or not present as well
				if (paramA == null) {
					if (paramB != null && !paramB.optional && !paramB.rest) {
						if (options.config.debug) {
							logDebug(options, "function", `paramA is null and paramB is null, optional or has rest`);
						}
						return false;
					}

					if (options.config.debug) {
						logDebug(options, "function", `paramA is null and paramB it not null, but is optional or has rest`);
					}

					continue;
				}

				// If paramB isn't present, check if paramA is optional
				if (paramB == null) {
					if (options.config.debug) {
						logDebug(options, "function", `paramB is 'null' returning true`);
					}
					return true;
				}

				// Check if we are comparing a spread against a non-spread
				const resolvedTypeA = resolveType(paramA.type, options.genericParameterMapA);
				const resolvedTypeB = resolveType(paramB.type, options.genericParameterMapB);

				// Unpack the array of rest parameters if possible
				const paramAType = paramA.rest && resolvedTypeA.kind === "ARRAY" ? resolvedTypeA.type : paramA.type;
				const paramBType = paramB.rest && resolvedTypeB.kind === "ARRAY" ? resolvedTypeB.type : paramB.type;
				if (paramA.rest) {
					if (options.config.debug) {
						logDebug(options, "function", `paramA is 'rest' and has been resolved to '${simpleTypeToStringLazy(paramAType)}'`);
					}
				}

				if (paramB.rest) {
					if (options.config.debug) {
						logDebug(options, "function", `paramB is 'rest' and has been resolved to '${simpleTypeToStringLazy(paramBType)}'`);
					}
				}

				// Check if the param types are assignable
				// Function parameter type checking is bivariant (when strictFunctionTypes is off) and contravariant (when strictFunctionTypes is on)
				if (!options.config.strictFunctionTypes) {
					if (options.config.debug) {
						logDebug(options, "function", `Checking covariant relationship`);
					}

					// Strict is off, therefore start by checking the covariant.
					// The contravariant relationship will be checked afterwards resulting in bivariant behavior
					if (isAssignableToSimpleTypeCached(paramAType, paramBType, options)) {
						// Continue to next parameter
						continue;
					}
				}

				// There is something strange going on where it seems checking two methods is less strict and checking two functions.
				// I haven't found any documentation for this behavior, but it seems to be the case.
				/* Examples (with strictFunctionTypes):
						// -----------------------------
					    interface I1 {
						    test(b: string | null): void;
					    }
						interface I2 {
							test(a: string): void;
						}

						// This will not fail
						const thisWillNotFail: I1 = {} as I2;

					    // -----------------------------
						interface I3 {
							test: (b: string | null) => void;
						}

						interface I4 {
							test: (a: string) => void;
						}

						// This will fail with:
						//    Types of parameters 'a' and 'b' are incompatible.
						//      Type 'string | null' is not assignable to type 'string'.
						//         Type 'null' is not assignable to type 'string'
						const thisWillFail: I3 = {} as I4;
					*/

				const newOptions = {
					...options,
					config:
						typeA.kind === "METHOD" || typeB.kind === "METHOD"
							? {
									...options.config,
									strictNullChecks: false,
									strictFunctionTypes: false
							  }
							: options.config,
					cache: new WeakMap(),
					genericParameterMapB: options.genericParameterMapA,
					genericParameterMapA: options.genericParameterMapB
				};

				if (options.config.debug) {
					logDebug(options, "function", `Checking contravariant relationship`);
				}

				// Contravariant
				if (!isAssignableToSimpleTypeCached(paramBType, paramAType, newOptions)) {
					return false;
				}
			}

			return true;
		}

		// [typeA] (compare)
		case "INTERFACE":
		case "OBJECT":
		case "CLASS": {
			// If there are no members check that "typeB" is not assignable to a set of incompatible type kinds
			// This is to check the empty object {} and Object
			const typeAHasZeroMembers = isObjectEmpty(typeA, {
				ignoreOptionalMembers: (["UNKNOWN", "NON_PRIMITIVE"] as SimpleTypeKind[]).includes(typeB.kind)
			});

			if (typeAHasZeroMembers && typeA.call == null && (typeA.ctor == null || typeA.kind === "CLASS")) {
				if (options.config.debug) {
					logDebug(options, "object-type", `typeA is the empty object '{}'`);
				}

				return !isAssignableToSimpleTypeKind(typeB, ["NULL", "UNDEFINED", "NEVER", "VOID", ...(options.config.strictNullChecks ? ["UNKNOWN"] : [])] as SimpleTypeKind[], {
					matchAny: false
				});
			}

			switch (typeB.kind) {
				case "FUNCTION":
				case "METHOD":
					return typeA.call != null && isAssignableToSimpleTypeCached(typeA.call, typeB, options);

				case "INTERFACE":
				case "OBJECT":
				case "CLASS": {
					// Test both callable types
					const membersA = typeA.members || [];
					const membersB = typeB.members || [];

					options.insideType = new Set([...options.insideType, typeA, typeB]);

					// Check how many properties typeB has in common with typeA.
					let membersInCommon = 0;

					// Make sure that every required prop in typeA is present in typeB
					const requiredMembersInTypeAExistsInTypeB = and(membersA, memberA => {
						//if (memberA.optional) return true;
						const memberB = membersB.find(memberB => memberA.name === memberB.name);
						if (memberB != null) membersInCommon += 1;
						return memberB == null
							? // If corresponding "memberB" couldn't be found, return true if "memberA" is optional
							  memberA.optional
							: // If corresponding "memberB" was found, return true if "memberA" is optional or "memberB" is not optional
							  memberA.optional || !memberB.optional;
					});

					if (!requiredMembersInTypeAExistsInTypeB) {
						if (options.config.debug) {
							logDebug(options, "object-type", `Didn't find required members from typeA in typeB`);
						}
						return false;
					}

					// Check if construct signatures are assignable (if any)
					if (typeA.ctor != null && typeA.kind !== "CLASS") {
						if (options.config.debug) {
							logDebug(options, "object-type", `Checking if typeB.ctor is assignable to typeA.ctor`);
						}

						if (typeB.ctor != null && typeB.kind !== "CLASS") {
							if (!isAssignableToSimpleTypeCached(typeA.ctor, typeB.ctor, options)) {
								return false;
							}

							membersInCommon += 1;
						} else {
							if (options.config.debug) {
								logDebug(options, "object-type", `Expected typeB.ctor to have a ctor`);
							}
							return false;
						}
					}

					// Check if call signatures are assignable (if any)
					if (typeA.call != null) {
						if (options.config.debug) {
							logDebug(options, "object-type", `Checking if typeB.call is assignable to typeA.call`);
						}

						if (typeB.call != null) {
							if (!isAssignableToSimpleTypeCached(typeA.call, typeB.call, options)) {
								return false;
							}

							membersInCommon += 1;
						} else {
							return false;
						}
					}

					// They are not assignable if typeB has 0 members in common with typeA, and there are more than 0 members in typeB.
					// The ctor of classes are not counted towards if typeB is empty
					const typeBIsEmpty = membersB.length === 0 && typeB.call == null && ((typeB.kind !== "CLASS" && typeB.ctor == null) || typeB.kind === "CLASS");
					if (membersInCommon === 0 && !typeBIsEmpty) {
						if (options.config.debug) {
							logDebug(options, "object-type", `typeB has 0 members in common with typeA and there are more than 0 members in typeB`);
						}

						return false;
					}

					// Ensure that every member in typeB is assignable to corresponding members in typeA
					const membersInTypeBAreAssignableToMembersInTypeA = and(membersB, memberB => {
						const memberA = membersA.find(memberA => memberA.name === memberB.name);
						if (memberA == null) {
							return true;
						}
						if (options.config.debug) {
							logDebug(options, "object-type", `Checking member '${memberA.name}' types`);
						}
						return isAssignableToSimpleTypeCached(memberA.type, memberB.type, options);
					});

					if (options.config.debug) {
						if (!membersInTypeBAreAssignableToMembersInTypeA) {
							logDebug(options, "object-type", `Not all members in typeB is assignable to corresponding members in typeA`);
						} else {
							logDebug(options, "object-type", `All members were checked successfully`);
						}
					}

					return membersInTypeBAreAssignableToMembersInTypeA;
				}
				default:
					return false;
			}
		}

		// [typeA] (compare)
		case "TUPLE": {
			if (typeB.kind !== "TUPLE") return false;

			// Compare the length of each tuple, but compare the length type instead of the actual length
			// We compare the length type because Typescript compares the type of the "length" member of tuples
			if (!isAssignableToSimpleTypeCached(getTupleLengthType(typeA), getTupleLengthType(typeB), options)) {
				return false;
			}

			// Compare if typeB elements are assignable to typeA's rest element
			// Example: [string, ...boolean[]] === [any, true, 123]
			if (typeA.rest && typeB.members.length > typeA.members.length) {
				return and(typeB.members.slice(typeA.members.length), (memberB, i) => {
					return isAssignableToSimpleTypeCached(typeA.members[typeA.members.length - 1].type, memberB.type, options);
				});
			}

			// Compare that every type of typeB is assignable to corresponding members in typeA
			return and(typeA.members, (memberA, i) => {
				const memberB = typeB.members[i];
				if (memberB == null) return memberA.optional;
				return isAssignableToSimpleTypeCached(memberA.type, memberB.type, options);
			});
		}

		// [typeA] (compare)
		case "PROMISE": {
			return typeB.kind === "PROMISE" && isAssignableToSimpleTypeCached(typeA.type, typeB.type, options);
		}

		// [typeA] (compare)
		case "DATE": {
			return typeB.kind === "DATE";
		}
	}

	// If we some how end up here (we shouldn't), return "true" as a safe fallback
	// @ts-ignore
	return true;
}

function reduceIntersectionIfPossible(simpleType: SimpleTypeIntersection, parameterMap: Map<string, SimpleType>): SimpleType {
	// DOCUMENTATION FROM TYPESCRIPT SOURCE CODE (getIntersectionType)
	// We normalize combinations of intersection and union types based on the distributive property of the '&'
	// operator. Specifically, because X & (A | B) is equivalent to X & A | X & B, we can transform intersection
	// types with union type constituents into equivalent union types with intersection type constituents and
	// effectively ensure that union types are always at the top level in type representations.
	//
	// We do not perform structural deduplication on intersection types. Intersection types are created only by the &
	// type operator and we can't reduce those because we want to support recursive intersection types. For example,
	// a type alias of the form "type List<T> = T & { next: List<T> }" cannot be reduced during its declaration.
	// Also, unlike union types, the order of the constituent types is preserved in order that overload resolution
	// for intersections of types with signatures can be deterministic.

	// An intersection type is considered empty if it contains
	// the type never, or
	// more than one unit type or,
	// an object type and a nullable type (null or undefined), or
	// a string-like type and a type known to be non-string-like, or
	// a number-like type and a type known to be non-number-like, or
	// a symbol-like type and a type known to be non-symbol-like, or
	// a void-like type and a type known to be non-void-like, or
	// a non-primitive type and a type known to be primitive.
	const typeKindMap = new Map<SimpleTypeKind, SimpleType[]>();
	const primitiveSet = new Set<SimpleTypeKind>();
	const primitiveLiteralSet = new Map<SimpleTypeKind, unknown>();

	for (const member of simpleType.types) {
		const resolvedType = resolveType(member, parameterMap);
		typeKindMap.set(resolvedType.kind, [...(typeKindMap.get(resolvedType.kind) || []), resolvedType]);

		switch (resolvedType.kind) {
			case "NEVER":
				return NEVER_TYPE;
		}

		if (isSimpleTypePrimitive(resolvedType)) {
			if (isSimpleTypeLiteral(resolvedType)) {
				if (primitiveLiteralSet.has(resolvedType.kind) && primitiveLiteralSet.get(resolvedType.kind) !== resolvedType.value) {
					return NEVER_TYPE;
				}

				primitiveLiteralSet.set(resolvedType.kind, resolvedType.value);
			} else {
				primitiveSet.add(resolvedType.kind);

				if (primitiveSet.size > 1) {
					return NEVER_TYPE;
				}
			}
		}
	}

	if ((typeKindMap.get("TUPLE")?.length || 0) > 1) {
		let len: number | undefined = undefined;
		for (const type of typeKindMap.get("TUPLE") as SimpleTypeTuple[]) {
			if (len != null && len !== type.members.length) {
				return NEVER_TYPE;
			}

			len = type.members.length;
		}
	}

	if (typeKindMap.size === 1 && (typeKindMap.get("OBJECT")?.length || 0) > 1) {
		const members = new Map<string, SimpleTypeMemberNamed>();
		for (const type of typeKindMap.get("OBJECT") as SimpleTypeObject[]) {
			for (const member of type.members || []) {
				if (members.has(member.name)) {
					const combinedMemberType = reduceIntersectionIfPossible({ kind: "INTERSECTION", types: [members.get(member.name)!.type, member.type] }, parameterMap);
					if (combinedMemberType.kind === "NEVER") {
						return combinedMemberType;
					}

					members.set(member.name, { ...member, type: combinedMemberType });
				} else {
					members.set(member.name, member);
				}
			}
		}

		return { ...(typeKindMap.get("OBJECT")![0] as SimpleTypeObject), members: Array.from(members.values()) };
	}

	return simpleType;
}

function isObjectEmpty(simpleType: SimpleTypeObjectTypeBase, { ignoreOptionalMembers }: { ignoreOptionalMembers?: boolean }): boolean {
	return simpleType.members == null || simpleType.members.length === 0 || (ignoreOptionalMembers && !simpleType.members.some(m => !m.optional)) || false;
}

export function resolveType(simpleType: SimpleType, parameterMap: Map<string, SimpleType>): Exclude<SimpleType, SimpleTypeGenericParameter | SimpleTypeGenericArguments> {
	return resolveTypeUnsafe(simpleType, parameterMap);
}

function logDebugHeader(typeA: SimpleType, typeB: SimpleType, options: IsAssignableToSimpleTypeInternalOptions): void {
	const silentConfig = { ...options.config, debug: false, maxOps: 20, maxDepth: 20 };
	let result: boolean | string;
	try {
		result = isAssignableToSimpleType(typeA, typeB, silentConfig);
	} catch (e) {
		result = e.message;
	}
	const depthChars = "   ".repeat(options.depth);

	const firstLogPart = ` ${depthChars}${simpleTypeToStringLazy(typeA)} ${colorText(options, ">:", "cyan")} ${simpleTypeToStringLazy(typeB)}   [${typeA.kind} === ${typeB.kind}]`;
	let text = `${firstLogPart} ${" ".repeat(Math.max(2, 120 - firstLogPart.length))}${colorText(options, options.depth, "yellow")} ### (${typeA.name || "???"} === ${
		typeB.name || "???"
	}) [result=${colorText(options, result, result === true ? "green" : "red")}]`;

	if (options.depth >= 50) {
		// Too deep
		if (options.depth === 50) {
			text = `Nested comparisons reach 100. Skipping logging...`;
		} else {
			return;
		}
	}

	// eslint-disable-next-line no-console
	(options.config.debugLog || console.log)(text);
}

function logDebug(options: IsAssignableToSimpleTypeInternalOptions, title: string, ...args: unknown[]): void {
	const depthChars = "   ".repeat(options.depth);

	const text = `${depthChars} [${colorText(options, title, "blue")}] ${args.join(" ")}`;

	// eslint-disable-next-line no-console
	(options.config.debugLog || console.log)(colorText(options, text, "gray"));
}

function simpleTypeToStringLazy(simpleType: SimpleType | undefined): string {
	if (simpleType == null) {
		return "???";
	}
	return simpleTypeToString(simpleType);
}

function colorText(options: IsAssignableToSimpleTypeInternalOptions, text: unknown, color: "cyan" | "gray" | "red" | "blue" | "green" | "yellow"): string {
	if (options.config.debugLog != null) {
		return `${text}`;
	}

	const RESET = "\x1b[0m";
	const COLOR = (() => {
		switch (color) {
			case "gray":
				return "\x1b[2m\x1b[37m";
			case "red":
				return "\x1b[31m";
			case "green":
				return "\x1b[32m";
			case "yellow":
				return "\x1b[33m";
			case "blue":
				return "\x1b[34m";
			case "cyan":
				return "\x1b[2m\x1b[36m";
		}
	})();

	return `${COLOR}${text}${RESET}`;
}

const PRIMITIVE_TYPE_TO_LITERAL_MAP = {
	["STRING"]: "STRING_LITERAL",
	["NUMBER"]: "NUMBER_LITERAL",
	["BOOLEAN"]: "BOOLEAN_LITERAL",
	["BIG_INT"]: "BIG_INT_LITERAL",
	["ES_SYMBOL"]: "ES_SYMBOL_UNIQUE"
} as unknown as Record<SimpleTypeKind, SimpleTypeKind | undefined>;

/*const LITERAL_TYPE_TO_PRIMITIVE_TYPE_MAP = ({
	["STRING_LITERAL"]: "STRING",
	["NUMBER_LITERAL"]: "NUMBER",
	["BOOLEAN_LITERAL"]: "BOOLEAN",
	["BIG_INT_LITERAL"]: "BIG_INT",
	["ES_SYMBOL_UNIQUE"]: "ES_SYMBOL"
} as unknown) as Record<SimpleTypeKind, SimpleTypeKind | undefined>;*/
