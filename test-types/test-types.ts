import { PathLike } from "fs";
import * as ts from "typescript";
import { MyTestInterface, MyType } from "./test-types-2";
import { myTestObj } from "./test-types-3";

// Circular references
interface MyCircularInterface1 {
	foo: string;
	bar: MyCircularInterface2;
}

interface MyCircularInterface2 {
	foo: number;
	bar: MyCircularInterface1;
}

interface MyCircularInterface3 {
	next: MyCircularType;
}

interface MyCircularInterface4<T> {
	hello<U = T> (t: (MyCircularInterface4<T | null>)): void;
}

type MyCircularType = MyCircularInterface3 | string;

{ const _: MyCircularInterface4<string> = {} as MyCircularInterface4<number>; }
{ const _: MyType = {} as MyType; }
{ const _: MyType = {} as MyType; }
{ const _: MyType = {} as MyType; }
{ const _: MyCircularInterface1 = {} as MyCircularInterface1; }
{ const _: ts.Node = {} as MyCircularInterface1; }
{ const _: ChildNode = {}; }
{ const _: HTMLElement = {}; }
{ const _: MyCircularType = {} as MyCircularInterface3; }
{ const _: MyCircularType = {} as MyCircularType; }
{ const _: Event = {}; }
{ const _: EventTarget = {}; }
{ const _: PathLike = {}; }
{ const _: PathLike = {} as PathLike; }
{ const _: HTMLElement = {} as HTMLElement; }
{ const _: HTMLElement = {} as ChildNode; }
{ const _: DocumentFragment = {} as DocumentFragment; }
{ const _: NodeListOf<HTMLButtonElement> = {} as NodeListOf<HTMLButtonElement>; }
{ const _: ParentNode = {} as Node; }
{ const _: HTMLSlotElement = {} as HTMLSlotElement; }
{ const _: Element = {} as Element; }
{ const _: EventListenerOrEventListenerObject = {} as EventListenerOrEventListenerObject; }
{ const _: AssignedNodesOptions = {} as AssignedNodesOptions; }

interface CircularA {
	b: CircularB;
}

interface CircularB {
	a: CircularA;
}

{ const _: CircularA | CircularB = {} as any as CircularB | CircularA; }
{ const _: CircularA = {} as any as CircularB | CircularA; }
{ const _: CircularB = {} as any as CircularB | CircularA; }
{ const _: CircularA = {} as any as CircularA; }
{ const _: CircularA = {} as any as CircularA; }
{ const _: CircularA | number = {} as any as CircularA | number; }
{ const _: CircularA = 123; }

// Generics

// Generic interfaces
interface GenericInterface1<T, U> {
	foo: T;
	bar: U;
}

{ const _: GenericInterface1<boolean, number> = {} as { foo: true, bar: 123 }; }
{ const _: GenericInterface1<string, number> = "hello"; }
{ const _: GenericInterface1<string, number> = {} as { foo: "hello", bar: true }; }

// Generic classes
class GenericClass1<T> {
	foo!: T;

	hello<U, R = string> (t: T): U | R {
		return {} as U;
	}
}

{
	const _: GenericClass1<string> = {
		foo: "hello", hello<U> (t: string) {
			return {} as U;
		}
	};
}
{ const _: GenericClass1<string> = new GenericClass1<number>(); }
{ const _: GenericClass1<string> = {} as { hello (t: string): number };}

// Inheritance
interface SampleInterface {
	readonly optional?: boolean;
	readonly required: number;
}

class SampleClassOne implements SampleInterface {
	readonly required = 1;
}

{ const _: SampleClassOne = new SampleClassOne(); }
{ const _: SampleInterface = new SampleClassOne(); }
{ const _: SampleClassOne = {} as SampleInterface; }
{ const _: SampleClassOne = {} as SampleInterface; }
{ const _: SampleInterface = new SampleClassOne(); }

// Generic functions
type foo<T> = (t: T) => T | undefined;
type foo2 = (t: string) => string | undefined;
type foo3<U> = foo<U | string> | foo<U>;

{ const _: foo2 = {} as () => 1; }
{ const _: foo<string> = {} as () => 1; }
{ const _: foo3<boolean> = {} as () => 1; }
{ const _: foo<string> = {} as () => 1; }
{ const _: foo3<boolean> = {} as () => 1; }
{ const _: foo<string> = {} as () => 1; }

// Generic types alias
type bar<T, U> = T | U | null
type typeAliasGeneric1<T> = string | number | T;
type typeAliasGeneric2<T> = typeAliasGeneric1<T>

{ const _: typeAliasGeneric2<boolean> = {} as typeAliasGeneric1<string>; }
{ const _: bar<string, number> = 291; }
{ const _: ReadonlyArray<string> = [] as string[]; }

// Promise
{ const _: Promise<number> = Promise.resolve(123); }
{ const _: Promise<string> = Promise.resolve(123); }
{ const _: Promise<string> = Promise.resolve("hello"); }
{ const _: Promise<void> = Promise.resolve("hello"); }
{ const _: Promise<{}> = Promise.resolve("hello"); }

// Functions
{ const _: Hello = 123; }
{
	const _: number = (a: number, b?: MyInterface, ...args: number[]) => {
		return 123;
	};
}
{ const _: any = (...spread: number[]) => true; }
{
	const _: any = (...spread: number[]) => () => {
	};
}
{
	const _: ((...spread: number[]) => void) = (input: string) => {
	};
}
{
	const _: ((...spread: number[]) => number) = (input: number) => {
		return 123;
	};
}
//{ const _: ((a: number, b: string) => number) = (aa: number) => { return 123; }; }
{
	const _: ((a: number, b: string) => number) = (aa: number, bb: string) => {
		return 123;
	};
}
//{ const _: ((a: number, b: string) => number) = (aa: number) => { return 123; }; }
{
	const _: ((a: number) => number) = (aa: number, bb: number) => {
		return 123;
	};
}
{
	const _: any = (cb: () => boolean) => {
		return cb();
	};
}
{
	const _: () => boolean = () => {
		return true;
	};
}
{ const _: <T>(value?: T | PromiseLike<T>) => void = {} as () => void; }
{ const _: <T>(value: T | PromiseLike<T>) => void = {} as (value: string) => void; }
{ const _: (value: number) => void = {} as (value: string) => void; }
{ const _: (value: number) => number = {} as (value: number) => string; }
{ const _: (value: number) => void = {} as (value: number) => any; }
{ const _: () => void = {} as () => any; }
{ const _: (a: string, b: string, c: string) => void = {} as () => any; }
{ const _: (value: string) => void = {} as (value?: string) => void; }
{ const _: (value?: string) => void = {} as (value?: string) => void; }
{ const _: (value?: string) => void = {} as (value: string) => void; }
{ const _: (value?: string) => void = {} as (value?: number) => void; }
{ const _: (value: string) => void = {} as () => void; }
{ const _: (a: string, b: string) => void = {} as () => number; }
{ const _: (a: string, b: string) => undefined = {} as () => number; }
{ const _: (a: string, b: string) => string = {} as () => number; }
{ const _: (a: string, b: string) => string = {} as () => void; }

// PromiseLike
{ const _: PromiseLike<string> = {} as string; }
{ const _: PromiseLike<string> = {} as Promise<string>; }

// ArrayLike
{ const _: ArrayLike<string> = {} as number; }
{ const _: ArrayLike<string> = ["hello"]; }

// Void
{ const _: void = {} as string; }
{ const _: void = {} as number; }
{ const _: void = undefined; }

type Hello = number;

// Interface
interface MyInterface {
	foo: string;
	hello: () => void;
}

interface MyInterfaceWithOptional {
	foo: string;
	bar?: number;
}

interface MyInterfaceWithAllOptional {
	foo?: string;
	bar?: number;
}

{ const _: MyInterface = { foo: "hello" } as MyInterface; }
{ const _: MyInterface = { foo: "hello" }; }
{ const _: MyInterface = {}; }
{ const _: MyInterface = {} as { foo: "hello", bar: "hello" }; }
{ const _: MyInterfaceWithOptional = { foo: "hello" }; }
{ const _: MyInterfaceWithOptional = {}; }
{ const _: MyInterfaceWithAllOptional = {}; }
{ const _: MyInterfaceWithAllOptional = {} as { bar: "hello" }; }
{ const _: MyInterfaceWithAllOptional = { foo: "hello" }; }
{ const _: MyInterfaceWithAllOptional = { foo: "hello", bar: 123 }; }
{ const _: { foo: string } = {} as { foo: "hello", bar: 123 }; }
{ const _: MyInterface | undefined = {} as MyInterface; }
{ myTestObj.testType = {} as MyTestInterface; }


interface MyInterface1 {
	foo: string;
}

interface MyInterface2 {
	bar: boolean;
}

interface MyInterface3 {
	baz: number;
}

{ const _: number | string | boolean | undefined = {} as number | string; }
{ const _: MyInterface1 | MyInterface2 | MyInterface3 | undefined = {} as MyInterface1 | MyInterface2; }


// Class
class MyClass {
	foo: string = "foo";
	bar?: "test";
}

{ const _: MyClass = new MyClass(); }

//{ const _: MyClass = {foo: "hello"} }

class MyClassWithMethods {
	myPublicProp = 123;
	private mySecretProp = 123;

	get hello () {
		return "hello";
	}

	set hello (val: string) {
	}

	set setter (val: string) {
	}

	get getter () {
		return "hello";
	}

	constructor (str: string)
	constructor (str: string, str2: string)
	constructor (str: string, str2?: string) {
	}

	foo () {
		return true;
	}

	bar () {
		return false;
	}
}

{ const _: MyClassWithMethods = new MyClassWithMethods("a", "b"); }


// Enums
enum MyEnum {
	RED = "RED",
	GREEN = "GREEN",
	BLUE = "BLUE"
}

export enum CodeLanguageKind {
	HTML = "html",
	JAVASCRIPT = "javascript",
	BLUE = "BLUE"
}


type MyEnumAlias = MyEnum;

{ const _: MyEnum = MyEnum.GREEN; }
{ const _: MyEnum = MyEnum.GREEN as MyEnum; }
{ const _: MyEnum = true; }
{ const _: MyEnum = 123; }
{ const _: MyEnum = "foo"; }
{ const _: MyEnum.BLUE = "foo"; }
{ const _: MyEnum.GREEN = MyEnum.GREEN; }
{ const _: MyEnumAlias = MyEnum.RED; }
{ const _: ("html" | "javascript") = CodeLanguageKind.HTML; }
{ const _: CodeLanguageKind = CodeLanguageKind.HTML as CodeLanguageKind; }
{ const _: MyEnum = CodeLanguageKind.HTML as CodeLanguageKind; }
//{ const _: ("html" | "javascript") = CodeLanguageKind.HTML as CodeLanguageKind; }
//{ const _: MyEnum = "GREEN"; }

// Arrays
{ const _: number[] = {} as ReadonlyArray<File | string>; }
//{ const _: number[] = {} as ReadonlyArray<number>; }
{ const _: number[] = {} as number[]; }
{ const _: ReadonlyArray<string> = {} as boolean[]; }
{ const _: ReadonlyArray<string> = {} as ReadonlyArray<boolean>; }
{ const _: ReadonlyArray<number | string> = {} as ReadonlyArray<number>; }

// Big int
{ const _: BigInt = 1n as BigInt; }
{ const _: BigInt = 111n; }
{ const _: BigInt = 222; }
{ const _: bigint = 333n; }
{ const _: bigint = -444n; }

// Bool
{ const _: boolean = true; }
{ const _: boolean = 123; }
{ const _: number = false; }
{ const _: boolean = "foo"; }
{ const _: boolean = [1, 2, 3] as number[]; }
{ const _: boolean = [1, "foo", 2] as [number, string, number]; }
{ const _: boolean = MyEnum.BLUE; }
{ const _: boolean = null as any; }
{ const _: boolean = null as unknown; }
{ const _: boolean = null; }
{ const _: boolean = undefined; }
{ const _: boolean = { a: "A", b: "B", c: "C" }; }

// Num
{ const _: number = true; }
{ const _: number = 123; }
{ const _: number = "foo"; }
{ const _: number = [1, 2, 3] as number[]; }
{ const _: number = [1, "foo", 2] as [number, string, number]; }
{ const _: number = MyEnum.BLUE; }
{ const _: number = null as any; }
{ const _: number = null as unknown; }
{ const _: number = null; }
{ const _: number = undefined; }
{ const _: number = { a: "A", b: "B", c: "C" }; }

// String
{ const _: string = true; }
{ const _: string = 123; }
{ const _: string = "foo"; }
{ const _: string = [1, 2, 3] as number[]; }
{ const _: string = [1, "foo", 2] as [number, string, number]; }
{ const _: string = MyEnum.BLUE; }
{ const _: string = null as any; }
{ const _: string = null as unknown; }
{ const _: string = null; }
{ const _: string = undefined; }
{ const _: string = { a: "A", b: "B", c: "C" }; }

// Null
{ const _: null = true; }
{ const _: null = 123; }
{ const _: null = "foo"; }
{ const _: null = [1, 2, 3] as number[]; }
{ const _: null = [1, "foo", 2] as [number, string, number]; }
{ const _: null = MyEnum.BLUE; }
{ const _: null = null as any; }
{ const _: null = null as unknown; }
{ const _: null = null; }
{ const _: null = undefined; }
{ const _: null = { a: "A", b: "B", c: "C" }; }

// Undefined
{ const _: undefined = true; }
{ const _: undefined = 123; }
{ const _: undefined = "foo"; }
{ const _: undefined = [1, 2, 3] as number[]; }
{ const _: undefined = [1, "foo", 2] as [number, string, number]; }
{ const _: undefined = MyEnum.BLUE; }
{ const _: undefined = null as any; }
{ const _: undefined = null as unknown; }
{ const _: undefined = null; }
{ const _: undefined = undefined; }
{ const _: undefined = { a: "A", b: "B", c: "C" }; }

// Intersection types
{ const _: string & number = "hello"; }

// Type alias intersection
class IntersectionClass {
	bar = true;

	hello () {
	}
}

interface IntersectionTypeA {
	bar: boolean;
}

type IntersectionType = IntersectionTypeA & { foo: string };

{ const _: IntersectionType = {} as IntersectionType; }
{ const _: IntersectionType = { foo: "", bar: true }; }
{ const _: { foo: string }[] & { bar: number }[] = {} as ["hello"]; }
{ const _: { foo: string }[] & { bar: number }[] = {} as { foo: string, bar: number }[]; }
{ const _: { foo: string }[] & { bar: number }[] = {} as [{ foo: string, bar: number }]; }
{ const _: { foo: string }[] & { bar: number }[] = {} as [{ foo: string, bar: number }, number]; }
{ const _: { foo: string }[] & { bar: number }[] = {} as [{ foo: string }] & { bar: number }; }
//{ const _: { foo: string }[] & { bar: number }[] = {} as [{ foo: string }] & { bar: number }[]; }
//{ const _: { foo: string }[] & ({ bar: number }[] | { bar: boolean }) = {} as [{ foo: string }] & { bar: number }[]; }
//{ const _: { foo: string }[] & { bar: number }[] | { bar: boolean } = {} as [{ foo: string }] & { bar: number }[]; }
//{ const _: [{ foo: string }, number] & [{ bar: boolean }, number] = {} as [{ foo: "" }, number] & [{ bar: true }, 123]; }
//{ const _: { foo: string }[] & { bar: number }[] | { bar: boolean } = {} as [{ foo: string }] & { bar: boolean }[]; }
//{ const _: { foo: string }[] & { bar: number }[] = {} as [{ foo: string }] & { bar: boolean }[]; }
{ const _: [string, number] & [string, number] = {} as { foo: "", bar: true }; }
{ const _: [string, number] & [string] = {} as ["hello", 123]; }
{ const _: [string, number] & [string] = {} as ["hello"]; }
{ const _: [string, number] & [string, number] = {} as ["hello", 123]; }
//{ const _: [string?] & [string] = {} as ["hello"]; }
//{ const _: [string?] & [string] = {} as []; }
{ const _: {} = {} as IntersectionType & IntersectionClass; }
{ const _: IntersectionType & IntersectionClass = {} as { foo: string, bar: boolean } & { hello (): void }; }
{ const _: IntersectionType & IntersectionClass = {} as { foo: string, bar: boolean }; }
{ const _: [{ foo: string }, number] & [{ bar: boolean }, number] = {} as [{ foo: "", bar: true }, 123]; }
{ const _: [{ foo: string }, number] & [{ bar: boolean }, number] = {} as [{ foo: "", bar: "" }, 123]; }
{ const _: [string, number] & [string, number] = {} as [string, number]; }
{ const _: [string, number] & [string, number] = {} as [string, string]; }

{ const _: IntersectionTypeA = {} as IntersectionTypeA; }
{ const _: IntersectionType = { bar: true }; }
{ const _: IntersectionType = { foo: "" }; }
{ const _: {} & { foo: string } = {} as { foo: string, hello: boolean }; }
{ const _: {} & { foo: string } = {} as { foo: string, hello: boolean }; }
{ const _: IntersectionClass & { foo: string } = {} as { bar: boolean, foo: string }; }
{ const _: { bar: string } & { foo: boolean } = {} as { bar: string, foo: boolean }; }
{ const _: { bar: string } & { foo: string } = {} as { foo: string, bar: boolean }; }
{ const _: boolean & string = "hello"; }
{ const _: boolean & boolean = true; }
{ const _: 1 & 2 = 1; }
{ const _: { foo: number } & { foo: boolean } = {} as { foo: number }; }
{ const _: {} & { foo: boolean } = {} as { hello: boolean }; }
{ const _: "foo" & "bar" = "bar"; }
{ const _: {} & "foo" & "bar" = "bar"; }
{ const _: "foo" & "bar" = {} as "foo" & "bar"; }
{ const _: "foo" & "foo" = "foo"; }


// Union types
{ const _: string | number = "hello"; }
{ const _: string | number = 123; }
{ const _: string | number = true; }
{ const _: string | number = 123 as (string | number); }
{ const _: string | number = "hello" as (string | boolean); }
{ const _: string | number = 123 as (number | null); }
{ const _: string | number = 123 as (null | number); }
{ const _: string | number = MyEnum.GREEN; }
{ const _: string = "hej" as (boolean | string); }
{ const _: string = 123 as (string | number); }
{ const _: "red" | "green" = "blue" as string; }

// Type alias union
type ButtonColor = "primary" | "accent" | "warn";
{ const _: ButtonColor = "primary"; }
{ const _: ButtonColor = "foo"; }
{ const _: ButtonColor = "123"; }
{ const _: ButtonColor = 2931 as ButtonColor | number; }
{ const _: ButtonColor | undefined = "" as ButtonColor; }
{ const _: ButtonColor = "" as ButtonColor | undefined; }

// Array
{ const _: string[] = 1; }
{ const _: string[] = ["a", "b", "c"]; }
{ const _: number[] = ["a", "b", "c"]; }
{ const _: number[] = ["a", 123, "c"]; }
{ const _: (number | string)[] = ["a", "c"]; }
{ const _: (number | string)[] = ["a", true, 123]; }
{ const _: (number | string)[] = ["a", 123]; }
{ const _: (number | string[])[] = [["a"], 123]; }
{ const _: string[] = ["a"] as (string | undefined)[]; }
{ const _: MyEnum[] = [MyEnum.BLUE]; }
{ const _: string[] = new Array<string>(); }
{ const _: Array<string> = [1, 2, 3]; }
{ const _: string[] = ["a"] as string[] | undefined; }
{ const _: number[][] = [1, 2, 3]; }
{ const _: number[][] = [[1], [2], [3]]; }
{ const _: Array<number> = [] as Array<undefined>; }
{ const _: Array<undefined> = [] as Array<number>; }

// Tuple
{ const _: [number] = 1; }
{ const _: [number] = undefined; }
{ const _: [number] = [1]; }
{ const _: [number, string, number] = [1, "hello", 2] as [number, string, number]; }
{ const _: [string] = {} as [1, "hello", 2]; }
{ const _: [number, number | string, number] = [1, "hello", 2] as [number, number | string, number]; }
{ const _: [number, number | string, [string, number]] = [1, 2, ["foo", 2]] as [number, number | string, [string, number]]; }
{ const _: { foo: string, bar: number }[] = {} as [{ foo: string, bar: number }]; }
{ const _: { foo: string, bar: number }[] = {} as [{ foo: string, bar: number }, { foo: string, bar: number }]; }
{ const _: { foo: string, bar: number }[] = {} as [{ foo: string, bar: number }, { foo: string, bar: string }]; }
{ const _: number[] = {} as [number, number]; }
{ const _: number[] = {} as [number, number, number, number, number]; }
{ const _: number[] = {} as []; }
{ const _: [{ foo: string, bar: number }] = {} as { foo: string, bar: number }[]; }


// Date
{ const _: Date = {}; }
{ const _: Date = {} as Date; }
{ const _: Date = new Date(); }
{ const _: number = new Date(); }
{ const _: Date = "hello"; }
{ const _: Date = 1239853; }

// Object
interface EmptyInterface {}

{ const _: {} = { foo: true }; }
{ const _: {} = null; }
{ const _: {} = undefined; }
{ const _: EmptyInterface = { foo: true }; }
{ const _: EmptyInterface = { foo: null }; }
{ const _: EmptyInterface = null; }
{ const _: EmptyInterface = {} as string | null; }
{ const _: EmptyInterface = undefined; }
{ const _: EmptyInterface = new MyClass(); }
{ const _: {} = {} as Date; }
{ const _: {} = "hello"; }
{ const _: {} = 1938483; }
{ const _: EmptyInterface = 1938483; }
{ const _: {} = {}; }
{ const _: {} = new MyClass(); }
{ const _: {} = MyEnum.BLUE; }
{ const _: { hello: string } = {} as { foo: "bar" }; }
{ const _: { hello: string } = {}; }
{ const _: { foo: string, hello: boolean } = {} as IntersectionTypeA; }
{ const _: { foo: string } = {} as { foo: string, hello: boolean }; }
{ const _: IntersectionTypeA = {} as { foo: string, hello: boolean }; }

// Never
{ const _: never = {} as never; }
{ const _: string = {} as never; }
{ const _: never = {} as string; }
{ const _: {hello: string} = {} as never; }
{ const _: {hello: string} = {} as string & number; }
{ const _: never = {} as string & number; }
{ const _: "foo" & "bar" = {} as never; }