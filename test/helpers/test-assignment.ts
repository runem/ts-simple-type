import test from "ava";
import { existsSync, writeFileSync } from "fs";
import { CompilerOptions, isBlock, Node } from "typescript";
import { inspect } from "util";
import { isAssignableToType } from "../../src/is-assignable/is-assignable-to-type";
import { toSimpleType } from "../../src/transform/to-simple-type";
import { generateCombinedTypeTestCode } from "./generate-combined-type-test-code";
import { TypescriptType } from "./type-test";
import { visitComparisonsInTestCode } from "./visit-type-comparisons";

/**
 * Tests all type combinations with different options
 * @param typesX
 * @param typesY
 */
export function testAssignments(typesX: TypescriptType[], typesY: TypescriptType[]) {
	let reproCodeStrict = "";
	if (process.env.STRICT == null || process.env.STRICT === "true") {
		testCombinedTypeAssignment(typesX, typesY, { strict: true }, repro => (reproCodeStrict += `${repro}\n\n`));
	}

	let reproCodeNonStrict = "";
	if (process.env.STRICT == null || process.env.STRICT === "false") {
		testCombinedTypeAssignment(typesX, typesY, { strict: false }, repro => (reproCodeNonStrict += `${repro}\n\n`));
	}

	// Run this after all tests have finished
	test.after.always(() => {
		// Write repro to playground
		if (existsSync("./playground")) {
			if (reproCodeStrict.length > 0) {
				writeFileSync("./playground/repro-strict.ts", `// Command: DEBUG= STRICT= FILE=repro-strict.ts npm run playground\n\n${reproCodeStrict}`);
			}
			if (reproCodeNonStrict.length > 0) {
				writeFileSync("./playground/repro-non-strict.ts", `// Command: DEBUG= STRICT=false FILE=repro-non-strict.ts npm run playground\n\n${reproCodeNonStrict}`);
			}
		}
	});
}

/**
 * Tests all type combinations
 * @param typesX
 * @param typesY
 * @param compilerOptions
 * @param reportError
 */
export function testCombinedTypeAssignment(typesX: TypescriptType[], typesY: TypescriptType[], compilerOptions: CompilerOptions = {}, reportError: (reproCode: string) => void = () => {}) {
	const testTitleSet = new Set<string>();

	const onlyLines = process.env.LINE == null ? undefined : process.env.LINE.split(",").map(Number);

	const testCode = generateCombinedTypeTestCode(typesX, typesY);
	visitComparisonsInTestCode(testCode, compilerOptions, ({ assignable: expectedResult, nodeA, checker, program, typeA, typeB, typeAString, typeBString, line }) => {
		if (onlyLines != null && !onlyLines.includes(line)) {
			return;
		}

		const testTitle = `Assignment test [${line}]: "${typeAString} === ${typeBString}", Options: {${Object.entries(compilerOptions)
			.map(([k, v]) => `${k}: ${v}`)
			.join(", ")}}`;
		if (testTitleSet.has(testTitle)) return;
		testTitleSet.add(testTitle);

		test(testTitle, t => {
			const simpleTypeALazy = toSimpleType(typeA, checker, { eager: false });
			const simpleTypeBLazy = toSimpleType(typeB, checker, { eager: false });
			const simpleTypeAEager = toSimpleType(typeA, checker, { eager: true });
			const simpleTypeBEager = toSimpleType(typeB, checker, { eager: true });

			const actualResultLazy = isAssignableToType(simpleTypeALazy, simpleTypeBLazy, program);
			const actualResultEager = isAssignableToType(simpleTypeAEager, simpleTypeBEager, program);

			if (actualResultEager !== actualResultLazy) {
				t.log("Simple Type A", inspect(simpleTypeAEager, false, 5, true));
				t.log("Simple Type B", inspect(simpleTypeBEager, false, 5, true));

				return t.fail(
					`Mismatch between what isAssignableToType(...) returns for lazy type vs eager type. Eager: ${actualResultEager}. Lazy: ${actualResultLazy}. Expected result: ${expectedResult}`
				);
			}

			const actualResult = actualResultLazy;
			const simpleTypeA = simpleTypeAEager;
			const simpleTypeB = simpleTypeBEager;

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

				const failText = `${actualResult ? "Can" : "Can't"} assign '${typeBString}' (${simpleTypeB.kind}) to '${typeAString}' (${simpleTypeA.kind}) but ${
					expectedResult ? "it should be possible!" : "it shouldn't be possible!"
				}`;

				// Report repro code for the playground
				const blockNode = findBlockNode(nodeA);
				if (blockNode != null) {
					// Generate debug log
					let log = "";
					isAssignableToType(simpleTypeALazy, simpleTypeBLazy, program, { debug: true, debugLog: text => (log += `${text}\n`) });

					reportError(`${log.length > 0 ? `/*\n${log}*/\n\n` : ""}// ${failText}\n${blockNode.getText()}`);
				}

				return t.fail(failText);
			} else {
				t.pass();
			}
		});
	});
}

function findBlockNode(node: Node): Node | undefined {
	if (isBlock(node)) {
		return node;
	}

	if (node.parent == null) {
		return undefined;
	}

	return findBlockNode(node.parent);
}
