import {
	isSimpleTypeLiteral,
	PRIMITIVE_TYPE_KINDS,
	SimpleType,
	SimpleTypeBooleanLiteral,
	SimpleTypeIntersection,
	SimpleTypeKind,
	SimpleTypeNull,
	SimpleTypeNumberLiteral,
	SimpleTypeTuple,
	SimpleTypeUndefined,
	SimpleTypeUnion
} from "./simple-type";

/**
 * Returns a type that represents the length of the Tuple type
 * Read more here: https://github.com/microsoft/TypeScript/pull/24897
 * @param tuple
 */
export function getTupleLengthType(tuple: SimpleTypeTuple): SimpleType {
	// When the tuple has rest argument, return "number"
	if (tuple.hasRestElement) {
		return {
			kind: SimpleTypeKind.NUMBER
		};
	}

	// Else return an intersection of number literals that represents all possible lengths
	const minLength = tuple.members.filter(member => !member.optional).length;

	if (minLength === tuple.members.length) {
		return {
			kind: SimpleTypeKind.NUMBER_LITERAL,
			value: minLength
		};
	}

	return {
		kind: SimpleTypeKind.UNION,
		types: new Array(tuple.members.length - minLength + 1).fill(0).map(
			(_, i) =>
				({
					kind: SimpleTypeKind.NUMBER_LITERAL,
					value: minLength + i
				} as SimpleTypeNumberLiteral)
		)
	};
}

export function simplifySimpleTypes(types: SimpleType[]): SimpleType[] {
	let newTypes: SimpleType[] = [...types];
	const NULLABLE_TYPE_KINDS = [SimpleTypeKind.UNDEFINED, SimpleTypeKind.NULL];

	// Only include one instance of primitives and literals
	newTypes = newTypes.filter((type, i) => {
		// Only include one of each literal with specific value
		if (isSimpleTypeLiteral(type)) {
			return !newTypes.slice(0, i).some(newType => newType.kind === type.kind && newType.value === type.value);
		}

		if (PRIMITIVE_TYPE_KINDS.includes(type.kind) || NULLABLE_TYPE_KINDS.includes(type.kind)) {
			// Remove this type from the array if there is already a primitive in the array
			return !newTypes.slice(0, i).some(t => t.kind === type.kind);
		}

		return true;
	});

	// Simplify boolean literals
	const booleanLiteralTypes = newTypes.filter((t): t is SimpleTypeBooleanLiteral => t.kind === SimpleTypeKind.BOOLEAN_LITERAL);
	if (booleanLiteralTypes.find(t => t.value === true) != null && booleanLiteralTypes.find(t => t.value === false) != null) {
		newTypes = [...newTypes.filter(type => type.kind !== SimpleTypeKind.BOOLEAN_LITERAL), { kind: SimpleTypeKind.BOOLEAN }];
	}

	// Reorder "NULL" and "UNDEFINED" to be last
	const nullableTypes = newTypes.filter((t): t is SimpleTypeUndefined | SimpleTypeNull => NULLABLE_TYPE_KINDS.includes(t.kind));
	if (nullableTypes.length > 0) {
		newTypes = [
			...newTypes.filter(t => !NULLABLE_TYPE_KINDS.includes(t.kind)),
			...nullableTypes.sort((t1, t2) => (t1.kind === SimpleTypeKind.NULL ? (t2.kind === SimpleTypeKind.UNDEFINED ? -1 : 0) : t2.kind === SimpleTypeKind.NULL ? 1 : 0))
		];
	}

	return newTypes;
}

/**
 * Combine and simplify structural types (union and intersection) recursively.
 * @param type
 */
export function simplifyStructuralType(type: SimpleTypeIntersection | SimpleTypeUnion): SimpleTypeIntersection | SimpleTypeUnion {
	const combinedMembers = new Map<SimpleTypeKind.INTERSECTION | SimpleTypeKind.UNION, SimpleTypeIntersection | SimpleTypeUnion>();
	const members: SimpleType[] = [];

	for (const member of type.types) {
		switch (member.kind) {
			case SimpleTypeKind.INTERSECTION:
			case SimpleTypeKind.UNION:
				if (combinedMembers.has(member.kind)) {
					combinedMembers.set(
						member.kind,
						simplifyStructuralType({
							kind: member.kind,
							types: [...member.types, ...combinedMembers.get(member.kind)!.types]
						} as SimpleTypeIntersection | SimpleTypeUnion)
					);
				} else {
					combinedMembers.set(member.kind, simplifyStructuralType(member));
				}
				break;
			case SimpleTypeKind.NEVER:
				break;
			default:
				members.push(member);
		}
	}

	if (combinedMembers.has(type.kind)) {
		members.push(...combinedMembers.get(type.kind)!.types);
		combinedMembers.delete(type.kind);
	}

	members.push(...Array.from(combinedMembers.values()));

	return {
		kind: type.kind,
		types: simplifySimpleTypes(members)
	} as SimpleTypeIntersection | SimpleTypeUnion;
}
