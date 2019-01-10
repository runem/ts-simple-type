export interface MyTestInterface {
	foo: string;
	bar: number;
}

export interface MyInterface {
	next: MyType;
}

export type MyType = MyInterface | null;