import { testAssignments } from "./helpers/test-assignment";
import { TypescriptType } from "./helpers/type-test";

export const BOOLEAN_TYPES: TypescriptType[] = [`true`, `false`, `boolean`];

export const NUMBER_TYPES: TypescriptType[] = [`123`, `number`];

export const STRING_TYPES: TypescriptType[] = [`"foo"`, `string`];

export const BIG_INT_TYPES: TypescriptType[] = [`111n`, `BigInt`];

export const NULLABLE_TYPES: TypescriptType[] = [`undefined`, `null`];

export const PRIMITIVE_TYPES: TypescriptType[] = [...BOOLEAN_TYPES, ...NUMBER_TYPES, ...STRING_TYPES, ...NULLABLE_TYPES, ...BIG_INT_TYPES];

export const SPECIAL_TYPES: TypescriptType[] = [`never`, `void`, `any`, `unknown`];

export const TUPLE_TYPES: TypescriptType[] = [`[]`, `[string]`, `[string, number]`, `[string, boolean?]`, `[string, ...boolean[]]`, `[{ foo: string, bar: number }]`];

export const ARRAY_TYPES: TypescriptType[] = [
	`string[]`,
	`number[]` /*, `ReadonlyArray<string | number>`*/,
	`(number | string)[]`,
	`["foo", 123]`,
	`["foo", true, 123]`,
	`{ foo: string, bar: number }[];`
];

export const CLASS_TYPES: TypescriptType[] = [
	{
		setup: "class EmptyClass {}",
		type: "EmptyClass"
	}
];

export const OBJECT_TYPES: TypescriptType[] = [/*`object`, */ `{}`, `{a: string}`, `{a: string, b: number}`, `{a: number}`, `{ foo: "", bar: true }`, `{a?: number | string}`];

export const INTERFACE_TYPES: TypescriptType[] = [
	{
		setup: `interface MyInterface1 {a: string}`,
		type: `MyInterface1`
	},
	{
		setup: `interface MyInterface2 {a: string, b: number}`,
		type: `MyInterface2`
	},
	{
		setup: `interface MyInterface3 {a: number}`,
		type: `MyInterface3`
	}
];

export const FUNCTION_TYPES: TypescriptType[] = [`(() => void)`, `((a: string) => void)`, `(() => string)`, `((a: number) => string)`];

export const FUNCTION_THIS_TYPES: TypescriptType[] = [`(this: string, a: number) => any`, `(this: number, a: number) => any`, `(this: number) => any`];

export const UNION_TYPES: TypescriptType[] = [`string | number`, `undefined | null | string`];

export const INTERSECTION_TYPES: TypescriptType[] = [
	`{ foo: string }[] & { bar: number }[]`,
	`{ foo: string, bar: boolean } & { hello (): void };`,
	`[{ foo: string }] & { bar: number }`,
	`[string, number] & [string, number]`,
	`[string, number] & [string]`
];

export const EXTRA_TYPES: TypescriptType[] = [`Date`, `Promise<string>`, `Promise<number>`, `PathLike`];

export const TYPE_ALIAS_TYPES: TypescriptType[] = [
	{
		setup: id => `type MyTypeAlias${id} = string`,
		type: id => `MyTypeAlias${id}`
	},
	{
		setup: id => `type MyTypeAlias1${id} = string; type MyTypeAlias2${id} = MyTypeAlias1${id}`,
		type: id => `MyTypeAlias2${id}`
	},
	{
		setup: `type MyTypeAlias2<T> = T`,
		type: `MyTypeAlias2<number>`
	}
];

export const ENUM_TYPES: TypescriptType[] = [
	{
		setup: `enum Colors {RED = "RED", GREEN = "GREEN", BLUE = "BLUE"}`,
		type: `Colors.GREEN`
	},
	/*{
	 setup: id => `enum UniqueColorEnum${id} {RED = "RED", GREEN = "GREEN", BLUE = "BLUE"}`,
	 type: id => `UniqueColorEnum${id}.GREEN`
	 },*/
	{
		setup: `enum Sizes {SMALL, MEDIUM, LARGE}`,
		type: `Sizes.MEDIUM`
	}
];

/*
 Still missing tests for:

 INTERFACE
 CLASS
 CIRCULAR TYPE
 GENERICS
 FUNCTIONS + (WITH THIS) + GENERIC
 UNION + INTERSECTION
 INHERITANCE
 */

export const ALL_TYPES: TypescriptType[] = [
	...PRIMITIVE_TYPES,
	...SPECIAL_TYPES,
	...ENUM_TYPES,
	...TYPE_ALIAS_TYPES,
	...TUPLE_TYPES,
	...ARRAY_TYPES,
	...OBJECT_TYPES,
	...INTERFACE_TYPES,
	...FUNCTION_TYPES,
	...FUNCTION_THIS_TYPES,
	...UNION_TYPES,
	...INTERSECTION_TYPES,
	...EXTRA_TYPES,
	...CLASS_TYPES
];

const A_TYPES = process.env.TYPEA == null ? ALL_TYPES : process.env.TYPEA.split(";");
const B_TYPES = process.env.TYPEB == null ? ALL_TYPES : process.env.TYPEB.split(";");

testAssignments(A_TYPES, B_TYPES);
