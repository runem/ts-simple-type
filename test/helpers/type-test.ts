export interface ITypescriptType {
	setup: ((id: number) => string) | string;
	type: ((id: number) => string) | string;
}

export type TypescriptType = ITypescriptType | string;

export type TypeTest = [TypescriptType, TypescriptType];
