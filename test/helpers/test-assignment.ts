import test from "ava";
import { CompilerOptions } from "typescript";
import { inspect } from "util";
import { isAssignableToType } from "../../src/is-assignable-to-type";
import { toSimpleType } from "../../src/to-simple-type";
import { generateCombinedTypeTestCode } from "./generate-combined-type-test-code";
import { TypescriptType } from "./type-test";
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
	const testTitleSet = new Set<string>();

	const onlyLines = process.env.LINE == null ? undefined : process.env.LINE.split(",").map(Number);

	const testCode = generateCombinedTypeTestCode(typesX, typesY);
	visitComparisonsInTestCode(testCode, compilerOptions, ({ assignable: expectedResult, checker, program, typeA, typeB, typeAString, typeBString, line }) => {
		if (onlyLines != null && !onlyLines.includes(line)) {
			return;
		}

		const testTitle = `Assignment test [${line}]: "${typeAString} === ${typeBString}", Options: {${Object.entries(compilerOptions)
			.map(([k, v]) => `${k}: ${v}`)
			.join(", ")}}`;
		if (testTitleSet.has(testTitle)) return;
		testTitleSet.add(testTitle);

		test(testTitle, t => {
			const simpleTypeA = toSimpleType(typeA, checker);
			const simpleTypeB = toSimpleType(typeB, checker);

			const actualResult = isAssignableToType(simpleTypeA, simpleTypeB, program);

			if (actualResult === expectedResult && process.env.DEBUG === "true") {
				console.log("");
				console.log("\x1b[4m%s\x1b[0m", testTitle);
				console.log(`Expected: ${expectedResult}, Actual: ${actualResult}`);
				console.log("");
				console.log("\x1b[1m%s\x1b[0m", "Simple Type A");
				console.log(inspect(simpleTypeA, false, 10, true));
				console.log("");
				console.log("\x1b[1m%s\x1b[0m", "Simple Type B");
				console.log(inspect(simpleTypeB, false, 10, true));
			}

			if (actualResult !== expectedResult) {
				t.log("Simple Type A", inspect(simpleTypeA, false, 5, true));
				t.log("Simple Type B", inspect(simpleTypeB, false, 5, true));

				return t.fail(
					`${actualResult ? "Can" : "Can't"} assign '${typeBString}' (${simpleTypeB.kind}) to '${typeAString}' (${simpleTypeA.kind}) but ${
						expectedResult ? "it should be possible!" : "it shouldn't be possible!"
					}`
				);
			} else {
				t.pass();
			}
		});
	});
}
