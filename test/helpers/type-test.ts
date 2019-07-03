import { ALL_TYPES } from "../type-combinations.spec";

export interface ITypescriptType {
	setup: ((id: number) => string) | string;
	type: ((id: number) => string) | string;
}

export type TypescriptType = ITypescriptType | string;

export type TypeTest = [TypescriptType, TypescriptType];

let randomId = 100;

/**
 * Prepares type test code for a type
 * @param type
 */
function prepareTypeTestCode(type: TypescriptType): { setup?: string; type: string } {
	if (typeof type === "string") {
		return { type };
	}

	const id = randomId++;

	return {
		setup: typeof type.setup === "string" ? type.setup : type.setup(id),
		type: typeof type.type === "string" ? type.type : type.type(id)
	};
}

/**
 * Generates code to test a specific combination of 2 types
 * @param tA
 * @param tB
 * @param subTypes
 */
function generateTypeTestCode([tA, tB]: TypeTest, subTypes: TypescriptType[]): { setupCode: string[]; testCode: string[] } {
	const { type: typeA, setup: setupA } = prepareTypeTestCode(tA);
	const { type: typeB, setup: setupB } = prepareTypeTestCode(tB);

	const testCode = `{ const _: ${typeA} = {} as any as ${typeB}; }`;

	return {
		setupCode: [...((setupA && [setupA]) || []), ...((setupB && [setupB]) || [])],
		testCode: [testCode]
	};
}

/**
 * Generates code to test all combinations of the types
 * @param typesX
 * @param typesY
 */
export function generateCombinedTypeTestCode(typesX: TypescriptType[], typesY: TypescriptType[]): string {
	const setupCodeSet = new Set<string>();
	const testCodeSet = new Set<string>();

	for (const testTypeX of typesX) {
		for (const testTypeY of typesY) {
			const typeTestCombination = [testTypeX, testTypeY] as TypeTest;
			const { setupCode, testCode } = generateTypeTestCode(typeTestCombination, ALL_TYPES);
			setupCode.forEach(c => setupCodeSet.add(c));
			testCode.forEach(c => testCodeSet.add(c));
		}
	}

	return `${Array.from(setupCodeSet).join("\n")}${Array.from(testCodeSet).join("\n")}`;
}
