import { SimpleTypeKind, SimpleType, isSimpleTypeLiteral, PRIMITIVE_TYPE_TO_LITERAL_MAP } from "./simple-type";
import { and, or } from "./util";

/**
 * Returns if typeB is assignable to typeA.
 * @param typeA Type A
 * @param typeB Type B
 */
export function isAssignableToSimpleType(typeA: SimpleType, typeB: SimpleType): boolean {
	//console.log("###", require("./simple-type-to-string").simpleTypeToString(typeA), "===", require("./simple-type-to-string").simpleTypeToString(typeB), "###");

	if (typeA === typeB) return true;

	if (typeA.kind === SimpleTypeKind.UNKNOWN || typeA.kind === SimpleTypeKind.ANY || typeB.kind === SimpleTypeKind.ANY) {
		return true;
	}

	switch (typeB.kind) {
		case SimpleTypeKind.ENUM_MEMBER:
			return isAssignableToSimpleType(typeA, typeB.type);
		case SimpleTypeKind.ENUM:
			return and(typeB.types, childTypeB => isAssignableToSimpleType(typeA, childTypeB));
		case SimpleTypeKind.UNION:
			return and(typeB.types, childTypeB => isAssignableToSimpleType(typeA, childTypeB));
		case SimpleTypeKind.INTERSECTION:
			return and(typeB.types, childTypeB => isAssignableToSimpleType(typeA, childTypeB));
	}

	switch (typeA.kind) {
		// Circular references
		case SimpleTypeKind.CIRCULAR_TYPE_REF:
			if (typeB.kind === SimpleTypeKind.CIRCULAR_TYPE_REF) {
				return typeA.ref === typeB.ref || typeA.ref.name === typeB.ref.name;
			}
			return typeA.ref === typeB || typeA.ref.name === typeB.name;

		// Literals and enum members
		case SimpleTypeKind.NUMBER_LITERAL:
		case SimpleTypeKind.STRING_LITERAL:
		case SimpleTypeKind.BIG_INT_LITERAL:
		case SimpleTypeKind.BOOLEAN_LITERAL:
			return isSimpleTypeLiteral(typeB) ? typeA.value === typeB.value : false;

		case SimpleTypeKind.ENUM_MEMBER:
			return isAssignableToSimpleType(typeA.type, typeB);

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
			return typeB.kind === SimpleTypeKind.VOID;

		// Arrays
		case SimpleTypeKind.ARRAY:
			if (typeB.kind === SimpleTypeKind.ARRAY) {
				return isAssignableToSimpleType(typeA.type, typeB.type);
			}

			return false;

		// Functions
		case SimpleTypeKind.FUNCTION:
			if (typeB.kind !== SimpleTypeKind.FUNCTION) return false;
			if (!isAssignableToSimpleType(typeA.returnType, typeB.returnType)) return false;

			for (let i = 0; i < Math.max(typeA.argTypes.length, typeB.argTypes.length); i++) {
				const argA = typeA.argTypes[i];
				const argB = typeB.argTypes[i];

				if (argB == null && argA != null && !argA.optional) {
					return false;
				}

				if (argB != null && argA == null) {
					return false;
				}

				if (!isAssignableToSimpleType(argA.type, argB.type)) {
					if (argA.spread && argA.type.kind === SimpleTypeKind.ARRAY && (!argB.spread && argB.type.kind !== SimpleTypeKind.ARRAY)) {
						if (!isAssignableToSimpleType(argA.type.type, argB.type)) {
							return false;
						}
					}
				}
			}

			return true;

		// Unions and enum members
		case SimpleTypeKind.ENUM:
		case SimpleTypeKind.UNION:
			return or(typeA.types, childTypeA => isAssignableToSimpleType(childTypeA, typeB));

		// Intersections
		case SimpleTypeKind.INTERSECTION:
			return and(typeA.types, childTypeA => isAssignableToSimpleType(childTypeA, typeB));

		// Interfaces
		case SimpleTypeKind.INTERFACE:
		case SimpleTypeKind.OBJECT:
		case SimpleTypeKind.CLASS:
			switch (typeB.kind) {
				case SimpleTypeKind.INTERFACE:
				case SimpleTypeKind.OBJECT:
				case SimpleTypeKind.CLASS:
					const membersA = (typeA.kind === SimpleTypeKind.CLASS ? [...typeA.methods, ...typeA.properties] : typeA.members);
					const membersB = (typeB.kind === SimpleTypeKind.CLASS ? [...typeB.methods, ...typeB.properties] : typeB.members);

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
							if (memberA == null) return false;
							return isAssignableToSimpleType(memberA.type, memberB.type);
						})
					);
				default:
					return false;
			}

		default:
			throw new Error(`Unsupported comparison: ${typeA.kind}`);
	}
}
