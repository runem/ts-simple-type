import { isSimpleTypeLiteral, isSimpleTypePrimitive, SimpleType, SimpleTypeInterface, SimpleTypeKind, SimpleTypeLiteral, SimpleTypeMemberNamed, SimpleTypeTuple } from "./simple-type";
import { zip } from "./util";

export function combineSimpleTypes(types: SimpleType[]): SimpleType {
	const combined = new Map<SimpleTypeKind, SimpleType>();

	for (const type of types) {
		if (isSimpleTypeLiteral(type)) {
			setExistingOrCombine(combined, type.kind, type, (existing: SimpleTypeLiteral) => (existing.value === type.value ? existing : { kind: SimpleTypeKind.NEVER }));
		}

		if (isSimpleTypePrimitive(type)) {
			setExistingOrCombine(combined, type.kind, type, existing => existing);
		}

		switch (type.kind) {
			case SimpleTypeKind.CLASS:
				setExistingOrCombine(
					combined,
					SimpleTypeKind.INTERFACE,
					type,
					(existing: SimpleTypeInterface) =>
						({
							kind: SimpleTypeKind.INTERFACE,
							members: combineNamedMembersIntoInterface([...type.properties, ...type.methods, ...(existing.members || [])])
						} as SimpleTypeInterface)
				);
				break;

			case SimpleTypeKind.OBJECT:
			case SimpleTypeKind.INTERFACE:
				setExistingOrCombine(
					combined,
					SimpleTypeKind.INTERFACE,
					type,
					(existing: SimpleTypeInterface) =>
						({
							kind: SimpleTypeKind.INTERFACE,
							members: combineNamedMembersIntoInterface([...(type.members || []), ...(existing.members || [])])
						} as SimpleTypeInterface)
				);
				break;

			case SimpleTypeKind.TUPLE:
				setExistingOrCombine(combined, SimpleTypeKind.TUPLE, type, (existing: SimpleTypeTuple) => {
					const members = zipCombine(type.members, existing.members, ([mA, mB]) => ({
						optional: mA.optional && mB.optional,
						type: combineSimpleTypes([mA.type, mB.type])
					}));

					return {
						...type,
						members: members == null ? [{ type: { kind: SimpleTypeKind.NEVER } }] : members
					} as SimpleTypeTuple;
				});
				break;
		}
	}

	//console.dir(combined, { depth: 4 });
	const combinedTypes = Array.from(combined.values());
	if (combinedTypes.length === 1) {
		return combinedTypes[0];
	}
	/*} else {
		return {
			kind: SimpleTypeKind.INTERSECTION,
			types: combinedTypes
		};
	}*/

	return { kind: SimpleTypeKind.NEVER };
}

function zipCombine<T, U>(listA: T[], listB: U[], combine: (lists: [T, U]) => T | U): (T | U)[] | null {
	const result = zip(listA, listB);
	return result == null ? null : result.map(combine);
}

function setExistingOrCombine<T, U, Z = U>(map: Map<T, U>, key: T, alternative: U, combine: (existing: Z) => U): Map<T, U> {
	const existing = map.get(key) as Z | undefined;
	map.set(key, existing == null ? alternative : combine(existing));
	return map;
}

function combineNamedMembersIntoInterface(members: SimpleTypeMemberNamed[]): SimpleTypeMemberNamed[] {
	return Array.from(
		members
			.reduce(
				(map, member) =>
					setExistingOrCombine(map, member.name, member, existingMember => ({
						name: member.name,
						optional: member.optional && existingMember.optional,
						type: combineSimpleTypes([member.type, existingMember.type])
					})),
				new Map<string, SimpleTypeMemberNamed>()
			)
			.values()
	);
}