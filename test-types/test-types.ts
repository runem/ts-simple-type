import { myTestObj } from "./test-types-3";
import { MyTestInterface } from "./test-types-2";
import * as ts from "typescript";
import {PathLike} from "fs";

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

type MyCircularType = MyCircularInterface3 | string;

{ const _: MyCircularInterface1 = {} as MyCircularInterface1; }
{ const _: ts.Node = {} as MyCircularInterface1; }
{ const _: ChildNode = {}; }
{ const _: HTMLElement = {}; }
{ const _: MyCircularType = {} as MyCircularInterface3; }
{ const _: MyCircularType = {} as MyCircularType; }
{ const _: Event = {}; }
{ const _: EventTarget = {}; }
{ const _: PathLike = {}; }

//{ const _: Promise<number> = Promise.resolve(123) }
// Functions
{ const _: Hello = 123; }
{ const _: number = (a: number, b?: MyInterface, ...args: number[]) => { return 123; } }
{ const _: any = (...spread: number[]) => true; }
{ const _: any = (...spread: number[]) => () => { }; }
{ const _: ((...spread: number[]) => void) = (input: string) => { }; }
{ const _: ((...spread: number[]) => number) = (input: number) => { return 123; }; }
//{ const _: ((a: number, b: string) => number) = (aa: number) => { return 123; }; }
{ const _: ((a: number, b: string) => number) = (aa: number, bb: string) => { return 123; }; }
//{ const _: ((a: number, b: string) => number) = (aa: number) => { return 123; }; }
{ const _: ((a: number) => number) = (aa: number, bb: number) => { return 123; }; }
{ const _: any = (cb: () => boolean) => { return cb(); }; }
{ const _: () => boolean = () => { return true; }; }

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
{ const _: MyInterface = { foo: "hello", bar: "hello" }; }
{ const _: MyInterfaceWithOptional = { foo: "hello" }; }
{ const _: MyInterfaceWithOptional = {}; }
{ const _: MyInterfaceWithAllOptional = {}; }
{ const _: MyInterfaceWithAllOptional = { bar: "hello" }; }
{ const _: MyInterfaceWithAllOptional = { foo: "hello" }; }
{ const _: MyInterfaceWithAllOptional = { foo: "hello", bar: 123 }; }
{ const _: { foo: string } = { foo: "hello", bar: 123 }; }
{ const _: MyInterface | undefined = {} as MyInterface; }
{ myTestObj.testType = {} as MyTestInterface; }


// Class
class MyClass {
	foo: string = "foo";
	bar?: "test";
}
{ const _: MyClass = new MyClass(); }

//{ const _: MyClass = {foo: "hello"} }

class MyClassWithMethods {
	private mySecretProp = 123;
	myPublicProp = 123;

	set hello(val: string) { }
	get hello() { return "hello"; }

	set setter(val: string) { }
	get getter() { return "hello"; }

	constructor(str: string)
	constructor(str: string, str2: string)
	constructor(str: string, str2?: string) { }

	foo() { return true; }
	bar() { return false; }
}

{ const _: MyClassWithMethods = new MyClassWithMethods(); }


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
{ const _: MyEnumAlias = MyEnum.RED; }
{ const _: ("html" | "javascript") = CodeLanguageKind.HTML; }
{ const _: CodeLanguageKind = CodeLanguageKind.HTML as CodeLanguageKind; }
{ const _: MyEnum = CodeLanguageKind.HTML as CodeLanguageKind; }
//{ const _: ("html" | "javascript") = CodeLanguageKind.HTML as CodeLanguageKind; }
//{ const _: MyEnum = "GREEN"; }

// Big int
{ const _: BigInt = 1n as BigInt; }
{ const _: BigInt = 111n; }
{ const _: BigInt = 222; }
{ const _: bigint = 333n; }
{ const _: bigint = -444n; }

// Bool
{ const _: boolean = true; }
{ const _: boolean = 123; }
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

// Union
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

// Typed union
type ButtonColor = "primary" | "accent" | "warn";
{ const _: ButtonColor = "primary"; }
{ const _: ButtonColor = "foo"; }
{ const _: ButtonColor = "123"; }
{ const _: ButtonColor = 2931 as ButtonColor | number; }

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
//{ const _: string[] = ["a"] as string[] | undefined; }
//{ const _: number[][] = [1, 2, 3]; }
//{ const _: number[][] = [[1], [2], [3]]; }

// Tuple
//{ const _: [number] = 1; }
//{ const _: [number] = undefined; }
{ const _: [number] = [1]; }
{ const _: [number, string, number] = [1, "hello", 2] as [number, string, number]; }
{ const _: [number, number | string, number] = [1, "hello", 2] as [number, number | string, number]; }
{ const _: [number, number | string, [string, number]] = [1, 2, ["foo", 2]] as [number, number | string, [string, number]]; }


// Circular types
/*{ const _: A | B = {} as any as B | A; }
{ const _: A = {} as any as B | A; }
{ const _: B = {} as any as B | A; }
{ const _: A = {} as any as A; }
{ const _: A = {} as any as A; }
{ const _: A | number = {} as any as A | number; }
{ const _: A = 123; }

interface A {
	b: B;
}

interface B {
	a: A;
}*/