import test from "ava";
import { CompilerOptions } from "typescript";
import { inspect } from "util";
import { isAssignableToType } from "../../src/is-assignable-to-type";
import { toSimpleType } from "../../src/to-simple-type";
import { generateCombinedTypeTestCode, TypescriptType } from "./type-test";
import { visitComparisonsInTestCode } from "./visit-type-comparisons";

/**
 * Tests all type combinations with different options
 * @param typesX
 * @param typesY
 */
export function testAssignments(typesX: TypescriptType[], typesY: TypescriptType[]) {
	if (process.env.STRICT == null || process.env.STRICT === "true") {
		testCombinedTypeAssignment(typesX, typesY, { strict: true });
	}

	if (process.env.STRICT == null || process.env.STRICT === "false") {
		testCombinedTypeAssignment(typesX, typesY, { strict: false });
	}
}

/**
 * Tests all type combinations
 * @param typesX
 * @param typesY
 * @param compilerOptions
 */
export function testCombinedTypeAssignment(typesX: TypescriptType[], typesY: TypescriptType[], compilerOptions: CompilerOptions = {}) {
	const testCode = generateCombinedTypeTestCode(typesX, typesY);

	const testTitleSet = new Set<string>();

	const onlyLines = process.env.LINE == null ? undefined : process.env.LINE.split(",").map(Number);

	visitComparisonsInTestCode(
		testCode,
		({ assignable: expectedResult, checker, program, typeA, typeB, typeAString, typeBString, line }) => {
			if (onlyLines != null && !onlyLines.includes(line)) {
				return;
			}

			const testTitle = `Assignment test [${line}]: "${typeAString} === ${typeBString}", Options: {${Object.entries(compilerOptions)
				.map(([k, v]) => `${k}: ${v}`)
				.join(", ")}}`;
			if (testTitleSet.has(testTitle)) return;
			testTitleSet.add(testTitle);

			test(testTitle, t => {
				const actualResult = isAssignableToType(typeA, typeB, program);

				if (actualResult !== expectedResult) {
					const simpleTypeA = toSimpleType(typeA, checker);
					const simpleTypeB = toSimpleType(typeB, checker);

					t.log("Simple Type A", inspect(simpleTypeA, false, null, true));
					t.log("Simple Type B", inspect(simpleTypeB, false, null, true));

					return t.fail(
						`${actualResult ? "Can" : "Can't"} assign '${typeBString}' (${simpleTypeB.kind}) to '${typeAString}' (${simpleTypeA.kind}) but ${
							expectedResult ? "it should be possible!" : "it shouldn't be possible!"
						}`
					);
				} else {
					t.pass();
				}
			});
		},
		compilerOptions
	);
}
