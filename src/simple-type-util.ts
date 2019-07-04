import { SimpleType, SimpleTypeKind, SimpleTypeNumberLiteral, SimpleTypeTuple } from "./simple-type";

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
