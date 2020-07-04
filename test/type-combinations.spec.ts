import { testAssignments } from "./helpers/test-assignment";
import { TypescriptType } from "./helpers/type-test";

export const BOOLEAN_TYPES: TypescriptType[] = [`Boolean`, `true`, `false`, `boolean`];

export const NUMBER_TYPES: TypescriptType[] = [`Number`, `123`, `number`, `42`];

export const STRING_TYPES: TypescriptType[] = [`String`, `"foo"`, `string`, `"bar"`];

export const BIG_INT_TYPES: TypescriptType[] = [`BigInt`, `123n`, `bigint`, `42n`];

export const ES_SYMBOL_TYPES: TypescriptType[] = [`Symbol`, `Symbol("hello")`, `unique symbol`, `symbol`];

export const NULLABLE_TYPES: TypescriptType[] = [`undefined`, `null`];

export const PRIMITIVE_TYPES: TypescriptType[] = [...BOOLEAN_TYPES, ...NUMBER_TYPES, ...STRING_TYPES, ...NULLABLE_TYPES, ...BIG_INT_TYPES, ...ES_SYMBOL_TYPES];

export const SPECIAL_TYPES: TypescriptType[] = [`never`, `void`, `any`, `unknown`];

export const TUPLE_TYPES: TypescriptType[] = [`[]`, `[string]`, `[string, number]`, `[string, boolean?]`, `[string, ...boolean[]]`, `[{ foo: string, bar: number }]`];

export const ARRAY_TYPES: TypescriptType[] = [
	`Array<string>`,
	`string[]`,
	`number[]` /*, `ReadonlyArray<string | number>`*/,
	`(number | string)[]`,
	`["foo", 123]`,
	`["foo", true, 123]`,
	`{ foo: string, bar: number }[];`
];

export const CLASS_TYPES: TypescriptType[] = [
	{
		setup: id => `class EmptyClass${id} {}`,
		type: id => `EmptyClass${id}`
	},
	{
		setup: id => `class ClassWithOptional${id} { a?: number; }`,
		type: id => `ClassWithOptional${id}`
	},
	{
		setup: id => `
class CallableClassA${id} {
	(call: number): string;
	a: number;
}`,
		type: id => `CallableClassA${id}`
	},
	{
		setup: id => `
class CallableClassB${id} {
	(call: string): CallableClassB;
	a: number;
}`,
		type: id => `CallableClassB${id}`
	},
	{
		setup: id => `
class CtorClassA${id} {
	constructor (input: string) { }
}`,
		type: id => `CtorClassA${id}`
	},
	{
		setup: id => `
class CtorClassB${id} {
	constructor (input: number) { }
}`,
		type: id => `CtorClassB${id}`
	}
];

export const OBJECT_TYPES: TypescriptType[] = [
	`Object`,
	`object`,
	`{}`,
	`{a: string}`,
	`{a: string, b: number}`,
	`{a: number}`,
	`{foo: "", bar: true}`,
	`{a?: number | string}`,
	`{(): string}`,
	`{(): string, a?: number}`,
	`{(a: number): string, a: string | number}`,
	`{ hello(t: string): number }`,
	`{ new(input: number): any }`,
	`{ new(input: string): any }`,
	`{ new(): any, a: number }`,
	`{ x : number|string, () : void }`
];

export const INTERFACE_TYPES: TypescriptType[] = [
	{
		setup: id => `interface MyInterfaceA${id} {a: string}`,
		type: id => `MyInterfaceA${id}`
	},
	{
		setup: id => `interface MyInterfaceB${id} {a: string, b: number}`,
		type: id => `MyInterfaceB${id}`
	},
	{
		setup: id => `interface MyInterfaceC${id} {a: number}`,
		type: id => `MyInterfaceC${id}`
	},
	{
		setup: id => `interface MyInterfaceD${id} {a?: number}`,
		type: id => `MyInterfaceD${id}`
	},
	{
		setup: id => `interface MyInterfaceD${id} {(a: string): number}`,
		type: id => `MyInterfaceD${id}`
	},
	{
		setup: id => `interface MyInterfaceE${id} {(a: string): number, a: string}`,
		type: id => `MyInterfaceE${id}`
	},
	{
		setup: id => `interface MyInterfaceF${id} {(a: string): number, a: number}`,
		type: id => `MyInterfaceF${id}`
	},
	{
		setup: id => `interface MyInterfaceG${id} {new (input: string): MyInterfaceG${id}`,
		type: id => `MyInterfaceG${id}`
	},
	{
		setup: id => `
interface InterfaceWithReadonlyA${id} {
	readonly a?: boolean;
	readonly b: number;
}`,
		type: id => `InterfaceWithReadonlyA${id}`
	},
	{
		setup: id => `
interface InterfaceWithReadonlyB${id} {
	readonly b: number | string;
}`,
		type: id => `InterfaceWithReadonlyB${id}`
	}
];

export const FUNCTION_TYPES: TypescriptType[] = [
	//`Function`,
	`(value: string) => void`,
	`(() => void)`,
	`((a: string) => void)`,
	`(() => string)`,
	`((a: number) => string)`,
	`((a: number, b: number, c: number, d: number) => string)`,
	`((a: number, b?: string) => string)`,
	`((a: number, b: string) => string)`,
	`(): string | null`,
	`(): string | boolean | null | {a: string}`
];

export const FUNCTION_THIS_TYPES: TypescriptType[] = [`(this: string, a: number) => any`, `(this: number, a: number) => any`, `(this: number) => any`];

export const FUNCTION_REST_TYPES: TypescriptType[] = [`(...spread: number[]) => boolean`, `(...spread: (string | number)[]) => boolean`, `(a: number, b?: string, ...args: number[]) => boolean`];

export const UNION_TYPES: TypescriptType[] = [`string | number`, `undefined | null | string`];

export const INTERSECTION_TYPES: TypescriptType[] = [
	`{ foo: string }[] & { bar: number }[]`,
	`{ foo: string, bar: boolean } & { hello (): void };`,
	`[{ foo: string }] & { bar: number }`,
	`[string, number] & [string, number]`,
	`[string, number] & [string]`,
	"1 & 2",
	"'foo' & 'bar'",
	"number & string"
	/*{ // TODO: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#intersections-reduced-by-discriminant-properties
		setup: `
interface Circle {
  kind: "circle";
  radius: number;
}

interface Square {
  kind: "square";
  sideLength: number;
}
`,
		type: `Circle & Square`
	}*/
];

export const EXTRA_TYPES: TypescriptType[] = [`Date`, `Promise<string>`, `Promise<number>`, `PathLike`];

export const TYPE_ALIAS_TYPES: TypescriptType[] = [
	{
		setup: id => `type MyTypeAlias${id} = String`,
		type: id => `MyTypeAlias${id}`
	},
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

export const CIRCULAR_REF_TYPES: TypescriptType[] = [
	`Element`,
	`HTMLElement`,
	`Event`,
	`(typeof HTMLElement["prototype"]["addEventListener"])`,
	`DocumentFragment`,
	`NodeListOf<HTMLButtonElement>`,
	`EventTarget`,
	`ChildNode`,
	`HTMLSlotElement`,
	`EventListenerOrEventListenerObject`,
	`AssignedNodesOptions`,
	{
		setup: `
interface B { next: C; }
interface C { next: D; }
interface D { next: B; }`,
		type: "B"
	},
	{
		setup: `
interface List<T> {
	data: T;
	next: List<T>;
	owner: List<List<T>>;
}`,
		type: `List<string>`
	},
	{
		setup: id => `
interface MyCircularInterfaceA${id} {
	foo: string;
	bar: MyCircularInterfaceA${id};
}`,
		type: id => `MyCircularInterfaceB${id}`
	},
	{
		setup: id => `
interface MyCircularInterfaceGeneric${id}<T> {
	hello<U = T>(t: MyCircularInterfaceGeneric${id}<T | null>): void;
}
		`,
		type: id => [`MyCircularInterfaceGeneric${id}<string>`, `MyCircularInterfaceGeneric${id}<number>`]
	},
	{
		setup: id => `
export interface InterfaceWithRecursiveGenericB${id}<T extends string, F> {}

export interface InterfaceWithRecursiveGenericC${id}<T> {
	data?: T;
}

export interface InterfaceWithRecursiveGenericA${id}<T extends string> extends InterfaceWithRecursiveGenericB${id}<T, InterfaceWithRecursiveGenericA${id}<T>> {
	options: InterfaceWithRecursiveGenericC${id}<T>;
}`,
		type: id => [`InterfaceWithRecursiveGenericA${id}<string>`, `InterfaceWithRecursiveGenericA${id}<"hello">`]
	}
];

export const LIB_TYPES: TypescriptType[] = [`require("typescript").Node`, `require("fs").PathLike`];

export const GENERIC_TYPES: TypescriptType[] = [
	{
		setup: id => `
interface GenericInterfaceA${id}<T, U> {
	foo: T;
	bar: U;
}`,
		type: id => [`GenericInterfaceA${id}<boolean, number>`, `GenericInterfaceA${id}<string, number>`, `GenericInterfaceA${id}<"hello", 123>`]
	},
	{
		setup: id => `
class GenericClassA${id}<T> {
	foo!: T;

	hello<U, R = string>(t: T): U | R {
		return {} as U;
	}
}`,
		type: id => [`GenericClassA${id}<string>`, `GenericClassA${id}<number>`]
	},
	{
		setup: id => `type GenericFunctionA${id}<T> = (t: T) => T | undefined`,
		type: id => [`GenericFunctionA${id}<string>`, `GenericFunctionA${id}<string | number>`]
	},
	{
		setup: id => `type GenericFunctionB${id}<T, U> = (x: T, y: U) => [T, U]`,
		type: id => [`GenericFunctionB${id}<"hello">`, `GenericFunctionB${id}<string | number>`]
	},
	{
		setup: id => `type GenericFunctionC${id}<S> = (x: S, y: S) => [S, S]`,
		type: id => [`GenericFunctionC${id}<string>`, `GenericFunctionC${id}<number | "hello">`]
	}
	//`<T>(value: T | PromiseLike<T>) => void`
	/*`
{
	foo: "hello";
	hello<U>(t: string): U
}`,*/
];

export const CUSTOM_TYPES: TypescriptType[] = [`Promise<number>`, `Promise<string | number>`, `Promise<void>`];

export const ALL_TYPES: TypescriptType[] = [
	...PRIMITIVE_TYPES,
	...TYPE_ALIAS_TYPES,
	...ENUM_TYPES,
	...SPECIAL_TYPES,
	...TUPLE_TYPES,
	...ARRAY_TYPES,
	...INTERFACE_TYPES,
	...OBJECT_TYPES,
	...CLASS_TYPES,
	...FUNCTION_TYPES,
	...FUNCTION_THIS_TYPES,
	...FUNCTION_REST_TYPES,
	...UNION_TYPES,
	...EXTRA_TYPES,
	...CIRCULAR_REF_TYPES,
	...LIB_TYPES,
	...GENERIC_TYPES,
	...CUSTOM_TYPES,
	...INTERSECTION_TYPES
];

const A_TYPES = process.env.TYPEA == null ? ALL_TYPES : process.env.TYPEA.split(";");
const B_TYPES = process.env.TYPEB == null ? ALL_TYPES : process.env.TYPEB.split(";");

testAssignments(A_TYPES, B_TYPES);
