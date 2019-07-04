import test from "ava";
import { combineIntersectingSimpleTypes } from "../src/combine-intersecting-simple-types";
import { SimpleType, SimpleTypeKind } from "../src/simple-type";

test.skip("hej", t => {
	const result = combineIntersectingSimpleTypes([
		{
			kind: SimpleTypeKind.INTERSECTION,
			types: [
				{
					kind: SimpleTypeKind.UNION,
					types: [
						{
							kind: SimpleTypeKind.NUMBER_LITERAL,
							value: 1
						},
						{
							kind: SimpleTypeKind.NUMBER_LITERAL,
							value: 2
						}
					]
				},
				{
					kind: SimpleTypeKind.UNION,
					types: [
						{
							kind: SimpleTypeKind.NUMBER_LITERAL,
							value: 1
						},
						{
							kind: SimpleTypeKind.NUMBER_LITERAL,
							value: 4
						}
					]
				}
			]
		}
	]);

	t.is(result, {
		kind: SimpleTypeKind.NUMBER_LITERAL,
		value: 1
	} as SimpleType);
});
