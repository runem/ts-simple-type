import test from "ava";
import { resolve } from "path";
import { CompilerOptions, Diagnostic, Type, TypeChecker, VariableDeclaration, Program } from "typescript";
import { isAssignableToType } from "../src/is-assignable-to-type";
import { simpleTypeToString } from "../src/simple-type-to-string";
import { toSimpleType } from "../src/to-simple-type";
import { compile } from "./compile";
import "./compile";
import { visitAssignments } from "./visit-assignments";

// Example usage: "LINE=2,5 npm test"
const arg = process.argv.slice(2)[0];
const RELEVANT_LINES = (() => {
	if (arg != null && arg !== "undefined") {
		return arg.split(",").map(n => Number(n));
	} else {
		return undefined;
	}
})();

if (process.env.STRICT !== "false") {
	testTypeAssignments("strict", { strict: true });
}
if (process.env.STRICT_NULL_CHECKS !== "false") {
	testTypeAssignments("noStrictNullChecks", { strictNullChecks: false });
}

function testTypeAssignments(testTitle: string, options: CompilerOptions) {
	const filePath = resolve(process.cwd(), "./test-types/test-types.ts");
	const { diagnostics, program, sourceFile } = compile(filePath, options);
	const checker = program.getTypeChecker();

	visitAssignments(sourceFile, {
		checker: program.getTypeChecker(),
		foundTest: (line: number, typeA: Type, typeB: Type, node: VariableDeclaration) => {
			if (RELEVANT_LINES != null && !RELEVANT_LINES.includes(line + 1)) return;
			try {
				if (process.env.TO_STRING !== "false") {
					executeToStringTest(testTitle, line, typeA, typeB, { node, checker });
				}

				if (process.env.TYPE_CHECKER !== "false") {
					executeTypeCheckerTest(testTitle, line, typeA, typeB, {
						node,
						checker,
						shouldBeAssignable: shouldBeAssignable(diagnostics, line),
						program
					});
				}
			} catch (e) {
				console.log(e);
			}
		}
	});
}

function shouldBeAssignable(diagnostics: ReadonlyArray<Diagnostic>, line: number) {
	for (const diagnostic of diagnostics) {
		if (diagnostic.file && [2322, 2741, 2740, 2739].includes(diagnostic.code)) {
			const { line: diagnosticLine } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
			if (line === diagnosticLine) {
				return false;
			}
		}
	}

	return true;
}

function executeToStringTest(testTitle: string, line: number, typeA: Type, typeB: Type, { checker }: { checker: TypeChecker; node: VariableDeclaration }) {
	const typeAStr = checker.typeToString(typeA);

	test(`[${testTitle}] ${line + 1}: simpleTypeToString('${typeAStr}')`, t => {
		const simpleTypeA = toSimpleType(typeA, checker);
		const simpleTypeAStr = simpleTypeToString(simpleTypeA);

		if (simpleTypeAStr !== typeAStr) {
			t.log(simpleTypeA);
			//console.dir(simpleTypeA, {depth: 10});
			// TODO: Enable when tests for Typescript 3.4.5 and non-strict options have been fixed
			//return t.fail(`toString should give ${typeAStr}. Not ${simpleTypeAStr}`);
		}

		t.pass();
	});

	const typeBStr = checker.typeToString(typeB);
	if (typeAStr === typeBStr) return;

	test(`[${testTitle}] ${line + 1}: simpleTypeToString('${typeBStr}')`, t => {
		const simpleTypeB = toSimpleType(typeB, checker);
		const simpleTypeBStr = simpleTypeToString(simpleTypeB);

		if (simpleTypeBStr !== typeBStr) {
			t.log(simpleTypeB);
			//console.dir(simpleTypeB, {depth: 10});
			// TODO: Enable when tests for Typescript 3.4.5 and non-strict options have been fixed
			//return t.fail(`toString should give ${typeBStr}. Not ${simpleTypeBStr}`);
		}

		t.pass();
	});
}

function executeTypeCheckerTest(
	testTitle: string,
	line: number,
	typeA: Type,
	typeB: Type,
	{ checker, shouldBeAssignable, program }: { checker: TypeChecker; node: VariableDeclaration; shouldBeAssignable: boolean; program: Program }
) {
	const typeAStr = checker.typeToString(typeA);
	const typeBStr = checker.typeToString(typeB);

	test(`[${testTitle}] ${line + 1}: '${typeAStr}' = '${typeBStr}'`, t => {
		const isAssignable = isAssignableToType(typeA, typeB, program);

		if (shouldBeAssignable !== isAssignable) {
			const simpleTypeA = toSimpleType(typeA, checker);
			const simpleTypeB = toSimpleType(typeB, checker);
			//console.dir(simpleTypeA, { depth: 10 });
			//console.dir(simpleTypeB, { depth: 10 });
			return t.fail(
				`${isAssignable ? "Can" : "Can't"} assign '${typeBStr}' (${simpleTypeB.kind}) to '${typeAStr}' (${simpleTypeA.kind}) but ${
					shouldBeAssignable ? "it should be allowed!" : "it shouldn't be allowed!"
				}`
			);
		}

		t.pass();
	});
}
