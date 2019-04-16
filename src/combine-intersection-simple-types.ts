import { isSimpleTypeLiteral, isSimpleTypePrimitive, SimpleType, SimpleTypeArray, SimpleTypeInterface, SimpleTypeKind, SimpleTypeLiteral, SimpleTypeMemberNamed, SimpleTypeTuple } from "./simple-type";
import { zip } from "./util";

/**
 * Combines multiple intersecting types into one single type.
 * This function can return an INTERSECTION type again if the types doesn't overlap.
 * @param types
 */
export function combineIntersectionSimpleTypes(types: SimpleType[]): SimpleType {
	// TODO: Combine tuples and arrays
	// TODO: Combine generic type ar

	const combined = new Map<SimpleTypeKind, SimpleType>();

	// Loop through types adding and combining them into the "combined" map
	for (const type of types) {
		// Check for overlapping type literals
		if (isSimpleTypeLiteral(type)) {
			setExistingOrCombine(combined, type.kind, type, (existing: SimpleTypeLiteral) => (existing.value === type.value ? existing : { kind: SimpleTypeKind.NEVER }));
		}

		// Check for overlapping type primities
		else if (isSimpleTypePrimitive(type)) {
			setExistingOrCombine(combined, type.kind, type, existing => existing);
		}

		// Combine complex types
		// This algorithm combines CLASS, INTERFACE and OBJECT into a single INTERFACE
		else {
			switch (type.kind) {
				// Combine classes
				case SimpleTypeKind.CLASS:
					setExistingOrCombine(
						combined,
						SimpleTypeKind.INTERFACE,
						type,
						(existing: SimpleTypeInterface) =>
							({
								kind: SimpleTypeKind.INTERFACE,
								members: combineNamedMembers([...type.properties, ...type.methods, ...(existing.members || [])])
							} as SimpleTypeInterface)
					);
					break;

				// Combine objects and interfaces
				case SimpleTypeKind.OBJECT:
				case SimpleTypeKind.INTERFACE:
					setExistingOrCombine(
						combined,
						SimpleTypeKind.INTERFACE,
						type,
						(existing: SimpleTypeInterface) =>
							({
								kind: SimpleTypeKind.INTERFACE,
								members: combineNamedMembers([...(type.members || []), ...(existing.members || [])])
							} as SimpleTypeInterface)
					);
					break;

				// Combine arrays
				case SimpleTypeKind.ARRAY:
					setExistingOrCombine(
						combined,
						SimpleTypeKind.ARRAY,
						type,
						(existing: SimpleTypeArray) =>
							({
								kind: SimpleTypeKind.ARRAY,
								type: combineIntersectionSimpleTypes([type.type, existing.type])
							} as SimpleTypeArray)
					);
					break;

				// Combine tuples
				case SimpleTypeKind.TUPLE:
					setExistingOrCombine(combined, SimpleTypeKind.TUPLE, type, (existing: SimpleTypeTuple) => {
						const members = zipCombine(type.members, existing.members, ([mA, mB]) => ({
							optional: mA.optional && mB.optional,
							type: combineIntersectionSimpleTypes([mA.type, mB.type])
						}));

						// Return a tuple with [never] if the length of members are not the same (members is null)
						return {
							...type,
							members: members == null ? [{ type: { kind: SimpleTypeKind.NEVER } }] : members
						} as SimpleTypeTuple;
					});
					break;
			}
		}
	}

	// If all types were combined into one, return this one
	const combinedTypes = Array.from(combined.values());
	if (combinedTypes.length === 1) {
		return combinedTypes[0];
	}

	// If we still have multiple choices types, return an intersection
	return {
		kind: SimpleTypeKind.INTERSECTION,
		types: combinedTypes
	};

	//return { kind: SimpleTypeKind.NEVER };
}

/**
 * Zips two lists with a combine callback
 * @param listA
 * @param listB
 * @param combine
 */
function zipCombine<T, U>(listA: T[], listB: U[], combine: (lists: [T, U]) => T | U): (T | U)[] | null {
	const result = zip(listA, listB);
	return result == null ? null : result.map(combine);
}

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
						type: combineIntersectionSimpleTypes([member.type, existingMember.type])
					})),
				new Map<string, SimpleTypeMemberNamed>()
			)
			.values()
	);
}
