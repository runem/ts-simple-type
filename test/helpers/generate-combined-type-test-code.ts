import { TypescriptType, TypeTest } from "./type-test";

let randomId = 100;

/**
 * Prepares type test code for a type
 * @param type
 */
function prepareTypeTestCode(type: TypescriptType): { setup?: string; type: string | string[] } {
	if (typeof type === "string") {
		return { type };
	}

	const id = randomId++;

	const setupCode = typeof type.setup === "string" ? type.setup : type.setup(id);
	const typeCode = typeof type.type === "function" ? type.type(id) : type.type;

	return {
		setup: setupCode,
		type: typeCode
	};
}

/**
 * Generates code to test a specific combination of 2 types
 * @param tA
 * @param tB
 */
function generateTypeTestCode([tA, tB]: TypeTest): string[] {
	const { type: typeA, setup: setupA } = prepareTypeTestCode(tA);
	const { type: typeB, setup: setupB } = prepareTypeTestCode(tB);

	const testCode: string[] = [];
	for (const tA of Array.isArray(typeA) ? typeA : [typeA]) {
		for (const tB of Array.isArray(typeB) ? typeB : [typeB]) {
			testCode.push(
				[`{`, ...(setupA != null ? [`  ${setupA.replace(/\n/g, "\n  ")}`] : []), ...(setupB != null ? [`  ${setupB.replace(/\n/g, "\n  ")}`] : []), `  const _: ${tA} = {} as ${tB}`, `}`].join(
					"\n"
				)
			);
		}
	}

	return testCode;
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
			const testCode = generateTypeTestCode(typeTestCombination);
			testCode.forEach(c => testCodeSet.add(c));
		}
	}

	return `${Array.from(setupCodeSet).join("\n")}${Array.from(testCodeSet).join("\n")}`;
}
