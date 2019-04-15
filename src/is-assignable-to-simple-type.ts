import { combineSimpleTypes } from "./combine-simple-types";
import { isSimpleTypeLiteral, PRIMITIVE_TYPE_TO_LITERAL_MAP, SimpleType, SimpleTypeGenericArguments, SimpleTypeKind } from "./simple-type";
import { and, or } from "./util";

/**
 * Returns if typeB is assignable to typeA.
 * @param typeA Type A
 * @param typeB Type B
 */
export function isAssignableToSimpleType(typeA: SimpleType, typeB: SimpleType): boolean {
	return isAssignabletoSimpleTypeInternal(typeA, typeB, {
		inCircularA: false,
		inCircularB: false,
		insideType: new Set(),
		genericParameterMapA: new Map(),
		genericParameterMapB: new Map()
	});
}

interface IsAssignableToSimpleTypeOptions {
	inCircularA: boolean;
	inCircularB: boolean;
	insideType: Set<SimpleType>;
	genericParameterMapA: Map<string, SimpleType>;
	genericParameterMapB: Map<string, SimpleType>;
}

function isAssignabletoSimpleTypeInternal(typeA: SimpleType, typeB: SimpleType, options: IsAssignableToSimpleTypeOptions): boolean {
	/**
	options = { ...options };
	(options as any).depth = ((options as any).depth || 0) + 1;
	console.log( "###", "\t".repeat((options as any).depth), require("./simple-type-to-string").simpleTypeToString(typeA), "===", require("./simple-type-to-string").simpleTypeToString(typeB), "(", typeA.kind, "===", typeB.kind, ")", (options as any).depth, "###" );
	/**/

	if (typeA === typeB) {
		return true;
	}

	// We might need a better way of handling refs, but these check are good for now
	if (options.insideType.has(typeA)) {
		return true;
	}

	if (options.inCircularA && options.inCircularB) {
		return true;
	}

	if (typeA.kind === SimpleTypeKind.UNKNOWN || typeA.kind === SimpleTypeKind.ANY || typeB.kind === SimpleTypeKind.ANY) {
		return true;
	}

	switch (typeB.kind) {
		case SimpleTypeKind.NEVER:
			return true;
		case SimpleTypeKind.CIRCULAR_TYPE_REF:
			return isAssignabletoSimpleTypeInternal(typeA, typeB.ref, {
				...options,
				inCircularB: true,
				insideType: new Set([...options.insideType, typeB])
			});
		case SimpleTypeKind.ENUM_MEMBER:
			return isAssignabletoSimpleTypeInternal(typeA, typeB.type, options);
		case SimpleTypeKind.ENUM:
			return and(typeB.types, childTypeB => isAssignabletoSimpleTypeInternal(typeA, childTypeB, options));
		case SimpleTypeKind.UNION:
			return and(typeB.types, childTypeB => isAssignabletoSimpleTypeInternal(typeA, childTypeB, options));
		case SimpleTypeKind.INTERSECTION:
			const combinedIntersectionType = combineSimpleTypes(typeB.types);
			return isAssignabletoSimpleTypeInternal(typeA, combinedIntersectionType, options);

		case SimpleTypeKind.ALIAS:
			return isAssignabletoSimpleTypeInternal(typeA, typeB.target, options);
		case SimpleTypeKind.GENERIC_ARGUMENTS:
			return isAssignabletoSimpleTypeInternal(typeA, typeB.target, {
				...options,
				genericParameterMapB: extendTypeParameterMap(typeB, options.genericParameterMapB)
			});
		case SimpleTypeKind.GENERIC_PARAMETER:
			const realType = options.genericParameterMapB.get(typeB.name);
			return isAssignabletoSimpleTypeInternal(typeA, realType || typeB.default || { kind: SimpleTypeKind.ANY }, options);
	}

	switch (typeA.kind) {
		// Circular references
		case SimpleTypeKind.CIRCULAR_TYPE_REF:
			return isAssignabletoSimpleTypeInternal(typeA.ref, typeB, {
				...options,
				inCircularA: true,
				insideType: new Set([...options.insideType, typeA])
			});

		// Literals and enum members
		case SimpleTypeKind.NUMBER_LITERAL:
		case SimpleTypeKind.STRING_LITERAL:
		case SimpleTypeKind.BIG_INT_LITERAL:
		case SimpleTypeKind.BOOLEAN_LITERAL:
			return isSimpleTypeLiteral(typeB) ? typeA.value === typeB.value : false;

		case SimpleTypeKind.ENUM_MEMBER:
			return isAssignabletoSimpleTypeInternal(typeA.type, typeB, options);

		// Primitive types
		case SimpleTypeKind.STRING:
		case SimpleTypeKind.BOOLEAN:
		case SimpleTypeKind.NUMBER:
		case SimpleTypeKind.BIG_INT:
		case SimpleTypeKind.UNDEFINED:
		case SimpleTypeKind.NULL:
			if (isSimpleTypeLiteral(typeB)) {
				return PRIMITIVE_TYPE_TO_LITERAL_MAP[typeA.kind] === typeB.kind;
			}

			return typeA.kind === typeB.kind;

		// Void
		case SimpleTypeKind.VOID:
			return typeB.kind === SimpleTypeKind.VOID || typeB.kind === SimpleTypeKind.UNDEFINED;

		// Never
		case SimpleTypeKind.NEVER:
			return false;

		// Alias
		case SimpleTypeKind.ALIAS:
			return isAssignabletoSimpleTypeInternal(typeA.target, typeB, options);

		// Generic types
		case SimpleTypeKind.GENERIC_PARAMETER:
			const realType = options.genericParameterMapA.get(typeA.name);
			return isAssignabletoSimpleTypeInternal(realType || typeA.default || { kind: SimpleTypeKind.ANY }, typeB, options);

		case SimpleTypeKind.GENERIC_ARGUMENTS:
			return isAssignabletoSimpleTypeInternal(typeA.target, typeB, {
				...options,
				genericParameterMapA: extendTypeParameterMap(typeA, options.genericParameterMapA)
			});

		// Arrays
		case SimpleTypeKind.ARRAY:
			if (typeB.kind === SimpleTypeKind.ARRAY) {
				if (typeA) {
					return isAssignabletoSimpleTypeInternal(typeA.type, typeB.type, options);
				}
			}

			return false;

		// Functions
		case SimpleTypeKind.FUNCTION:
		case SimpleTypeKind.METHOD:
			if (typeB.kind !== SimpleTypeKind.FUNCTION && typeB.kind !== SimpleTypeKind.METHOD) return false;

			// Any returntype is assignable to void
			if (typeA.returnType.kind !== SimpleTypeKind.VOID && !isAssignabletoSimpleTypeInternal(typeA.returnType, typeB.returnType, options)) return false;

			// A function with 0 args can be assigned to any other function
			if (typeB.argTypes.length === 0) {
				return true;
			}

			// Compare the types of each arg
			for (let i = 0; i < Math.max(typeA.argTypes.length, typeB.argTypes.length); i++) {
				const argA = typeA.argTypes[i];
				const argB = typeB.argTypes[i];

				// If argA is not present, check if argB is optional or not present as well
				if (argA == null) {
					return argB == null || argB.optional;
				}

				// If argB is not present, check if argA is optional
				if (argB == null) {
					return argA.optional;
				}

				// Check if we are comparing a spread against a non-spread
				if (argA.spread && argA.type.kind === SimpleTypeKind.ARRAY && (!argB.spread && argB.type.kind !== SimpleTypeKind.ARRAY)) {
					if (!isAssignabletoSimpleTypeInternal(argA.type.type, argB.type, options)) {
						return false;
					}

					continue;
				}

				// If the types are not assignable return false right away
				if (!isAssignabletoSimpleTypeInternal(argB.type, argA.type, options)) {
					return false;
				}
			}

			return true;

		// Unions and enum members
		case SimpleTypeKind.ENUM:
		case SimpleTypeKind.UNION:
			return or(typeA.types, childTypeA => isAssignabletoSimpleTypeInternal(childTypeA, typeB, options));

		// Intersections
		case SimpleTypeKind.INTERSECTION:
			const combinedIntersectionType = combineSimpleTypes(typeA.types);
			return isAssignabletoSimpleTypeInternal(combinedIntersectionType, typeB, options);

		// Interfaces
		case SimpleTypeKind.INTERFACE:
		case SimpleTypeKind.OBJECT:
		case SimpleTypeKind.CLASS:
			// If there are no members check that "typeB" is not assignable to 'null' and 'undefined'.
			// Here we allow assigning anything but 'null' and 'undefined' to the type '{}'
			if ("members" in typeA && (typeA.members == null || typeA.members.length === 0)) {
				return !isAssignabletoSimpleTypeInternal(
					{
						kind: SimpleTypeKind.UNION,
						types: [{ kind: SimpleTypeKind.NULL }, { kind: SimpleTypeKind.UNDEFINED }]
					},
					typeB,
					options
				);
			}

			switch (typeB.kind) {
				case SimpleTypeKind.INTERFACE:
				case SimpleTypeKind.OBJECT:
				case SimpleTypeKind.CLASS:
					const membersA = typeA.kind === SimpleTypeKind.CLASS ? [...typeA.methods, ...typeA.properties] : typeA.members || [];
					const membersB = typeB.kind === SimpleTypeKind.CLASS ? [...typeB.methods, ...typeB.properties] : typeB.members || [];

					const newOptions = {
						...options,
						insideType: new Set([...options.insideType, typeA, typeB])
					};

					return (
						and(membersA, memberA => {
							// Make sure that every required prop in typeA is present
							const memberB = membersB.find(memberB => memberA.name === memberB.name);
							return memberB == null ? memberA.optional : true;
						}) &&
						and(membersB, memberB => {
							// Do not allow new props in subtype: contravariance
							// Strict type checking
							const memberA = membersA.find(memberA => memberA.name === memberB.name);
							if (memberA == null) {
								// If we find a member in typeB which isn't in typeA, allow it if both typeA and typeB are object
								return typeA.kind === SimpleTypeKind.OBJECT && typeB.kind === SimpleTypeKind.OBJECT;
							}
							return isAssignabletoSimpleTypeInternal(memberA.type, memberB.type, newOptions);
						})
					);
				default:
					return false;
			}

		case SimpleTypeKind.TUPLE:
			if (typeB.kind !== SimpleTypeKind.TUPLE) return false;
			return and(typeA.members, (memberA, i) => {
				const memberB = typeB.members[i];
				if (memberB == null) return memberA.optional;
				return isAssignabletoSimpleTypeInternal(memberA.type, memberB.type, options);
			});

		case SimpleTypeKind.PROMISE:
			return typeB.kind === SimpleTypeKind.PROMISE && isAssignabletoSimpleTypeInternal(typeA.type, typeB.type, options);

		case SimpleTypeKind.DATE:
			return typeB.kind === SimpleTypeKind.DATE;

		//default:
		//throw new Error(`Unsupported comparison: ${typeA.kind}`);
	}
}

function extendTypeParameterMap(genericType: SimpleTypeGenericArguments, existingMap: Map<string, SimpleType>) {
	if ("typeParameters" in genericType.target) {
		const parameterEntries = (genericType.target.typeParameters || []).map(
			(parameter, i) => [parameter.name, genericType.typeArguments[i] || parameter.default || { kind: SimpleTypeKind.ANY }] as [string, SimpleType]
		);
		const allParameterEntries = [...existingMap.entries(), ...parameterEntries];
		return new Map(allParameterEntries);
	}

	throw new Error(`Couldn't find 'typeParameter' for type '${genericType.target.kind}'`);
	//return existingMap;
}
