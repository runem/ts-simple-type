import { isSimpleTypeLiteral, isSimpleTypePrimitive, SimpleType, SimpleTypeArray, SimpleTypeInterface, SimpleTypeKind, SimpleTypeLiteral, SimpleTypeMemberNamed, SimpleTypeTuple } from "./simple-type";

/**
 * Combines multiple intersecting types into one single type.
 * This function can return an INTERSECTION type again if the types doesn't overlap.
 * @param types
 */
export function combineIntersectingSimpleTypes(types: SimpleType[]): SimpleType {
	// TODO: Combine tuples and arrays
	// TODO: Combine generic type ar

	const combined = new Map<SimpleTypeKind, SimpleType>();

	let impossibleToCombine = false;

	// Loop through types adding and combining them into the "combined" map
	for (const type of types) {
		// Check for overlapping type literals
		if (isSimpleTypeLiteral(type)) {
			setExistingOrCombine(combined, type.kind, type, (existing: SimpleTypeLiteral) => {
				if (existing.value !== type.value) {
					impossibleToCombine = true;
				}

				return existing;
			});
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
					setExistingOrCombine(combined, SimpleTypeKind.TUPLE, type, (existing: SimpleTypeTuple) => {
						const members = zipCombine(type.members, existing.members, (mA, mB) => ({
							optional: (mA && mA.optional && mB && mB.optional) || false,
							type: mA != null && mB != null ? combineIntersectingSimpleTypes([mA.type, mB.type]) : mA != null ? mA.type : mB!.type
						}));
						//console.log(members);
						/*const members = zipCombine(type.members, existing.members, ([mA, mB]) => ({
						 optional: mA.optional && mB.optional,
						 type: combineIntersectingSimpleTypes([mA.type, mB.type])
						 }));*/

						// Return a tuple with [never] if the length of members are not the same (members is null)
						return {
							...type,
							members
						} as SimpleTypeTuple;
					});
					break;
			}
		}
	}

	// Return the intersection of the original types if we gave up midway
	if (impossibleToCombine) {
		return {
			kind: SimpleTypeKind.INTERSECTION,
			types
		};
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
function zipCombine<T, U>(listA: T[], listB: U[], combine: (a: T, b: U) => T | U): (T | U)[] {
	//function zipCombine<T, U>(listA: T[], listB: U[], combine: (list: [T, U]) => T | U): (T | U)[] | null {
	return new Array(Math.max(listA.length, listB.length)).fill({} as any).map((_, i) => combine(listA[i], listB[i]));
	//const result = zip(listA, listB);
	//return result == null ? null : result.map(combine);
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
						type: combineIntersectingSimpleTypes([member.type, existingMember.type])
					})),
				new Map<string, SimpleTypeMemberNamed>()
			)
			.values()
	);
}
