import {
	isSimpleTypeLiteral,
	isSimpleTypePrimitive,
	LITERAL_TYPE_TO_PRIMITIVE_TYPE_MAP,
	PRIMITIVE_TYPE_KINDS,
	SimpleType,
	SimpleTypeArray,
	SimpleTypeInterface,
	SimpleTypeKind,
	SimpleTypeMemberNamed
} from "./simple-type";

/**
 * Combines multiple intersecting types into one single type.
 * This function can return an INTERSECTION type again if the types doesn't overlap.
 * @param types
 */
export function combineIntersectingSimpleTypes(types: SimpleType[]): SimpleType {
	const combined = new Map<SimpleTypeKind, SimpleType>();
	let members: SimpleType[] = [];

	for (const type of types) {
		if (isSimpleTypeLiteral(type)) {
			const mappedPrimitive = LITERAL_TYPE_TO_PRIMITIVE_TYPE_MAP[type.kind]!;

			// 2 & number ---> number
			if (combined.has(mappedPrimitive)) {
				// Do nothing if the non-literal primitive is already in the map
				continue;
			}

			// 2 & string ---> never
			if (PRIMITIVE_TYPE_KINDS.some(primitiveType => primitiveType != mappedPrimitive && combined.has(primitiveType))) {
				combined.set(SimpleTypeKind.NEVER, { kind: SimpleTypeKind.NEVER });
			}

			// 2 & 3 ---> never
			if (members.some(member => member.kind === type.kind && member.value !== type.value)) {
				combined.set(SimpleTypeKind.NEVER, { kind: SimpleTypeKind.NEVER });
			}

			// Always push type literals to "members"
			members.push(type);
		} else if (isSimpleTypePrimitive(type)) {
			combined.set(type.kind, type);

			// A non-literal primitive always trumps a literal type.
			// Therefore, remove the literal from "members"
			members = members.filter(member => member.kind === LITERAL_TYPE_TO_PRIMITIVE_TYPE_MAP[type.kind]);
		} else {
			switch (type.kind) {
				// Combine classes
				case SimpleTypeKind.CLASS:
					setExistingOrCombine(
						combined,
						SimpleTypeKind.INTERFACE,
						type,
						(existing: SimpleTypeInterface): SimpleTypeInterface => ({
							kind: SimpleTypeKind.INTERFACE,
							members: combineNamedMembers([...type.properties, ...type.methods, ...(existing.members || [])])
						})
					);
					break;

				// Combine objects and interfaces
				case SimpleTypeKind.OBJECT:
				case SimpleTypeKind.INTERFACE:
					setExistingOrCombine(
						combined,
						SimpleTypeKind.INTERFACE,
						type,
						(existing: SimpleTypeInterface): SimpleTypeInterface => ({
							kind: SimpleTypeKind.INTERFACE,
							members: combineNamedMembers([...(type.members || []), ...(existing.members || [])])
						})
					);
					break;

				// Combine arrays
				case SimpleTypeKind.ARRAY:
					setExistingOrCombine(
						combined,
						SimpleTypeKind.ARRAY,
						type,
						(existing: SimpleTypeArray): SimpleTypeArray => ({
							kind: SimpleTypeKind.ARRAY,
							type: combineIntersectingSimpleTypes([type.type, existing.type])
						})
					);
					break;

				// Combine tuples
				case SimpleTypeKind.TUPLE:
					members.push(type);
					break;

				default:
					members.push(type);
					break;
			}
		}
	}

	// If all types were combined into one, return this one
	if (combined.has(SimpleTypeKind.NEVER) || combined.size === 0) {
		return {
			kind: SimpleTypeKind.INTERSECTION,
			types
		};
	}

	const combinedTypes = Array.from(combined.values());

	if (combinedTypes.length === 1) {
		return combinedTypes[0];
	}

	// If we still have multiple choices types, return an intersection
	return {
		kind: SimpleTypeKind.INTERSECTION,
		types: combinedTypes
	};
}

/**
 * Zips two lists with a combine callback
 * @param listA
 * @param listB
 * @param combine
 */

/*function zipCombine<T, U>(listA: T[], listB: U[], combine: (a: T, b: U) => T | U): (T | U)[] {
 return new Array(Math.max(listA.length, listB.length)).fill({} as any).map((_, i) => combine(listA[i], listB[i]));
 }*/

/**
 * Sets a key in a map to "alternative" if there is not already an existing key set.
 * If there is already an existing key set, the "combine" callback is called with the value.
 * @param map
 * @param key
 * @param alternative
 * @param combine
 */
function setExistingOrCombine<T, U, Z = U>(map: Map<T, U>, key: T, alternative: U, combine: (existing: Z) => U): Map<T, U> {
	const existing = map.get(key) as Z | undefined;
	map.set(key, existing == null ? alternative : combine(existing));
	return map;
}

/**
 * Combines multiple named members and their types.
 * @param members
 */
function combineNamedMembers(members: SimpleTypeMemberNamed[]): SimpleTypeMemberNamed[] {
	return Array.from(
		members
			.reduce(
				(map, member) =>
					setExistingOrCombine(map, member.name, member, existingMember => ({
						name: member.name,
						optional: member.optional && existingMember.optional,
						type: combineIntersectingSimpleTypes([member.type, existingMember.type])
					})),
				new Map<string, SimpleTypeMemberNamed>()
			)
			.values()
	);
}
