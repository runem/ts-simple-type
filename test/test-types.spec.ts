import test from "ava";
import { resolve } from "path";
import ts, { Node, SyntaxKind, Type, TypeChecker, VariableDeclaration } from "typescript";
import { isAssignableToType } from "../src/is-assignable-to-type";
import { simpleTypeToString } from "../src/simple-type-to-string";
import { toSimpleType } from "../src/to-simple-type";
import { compile } from "./compile";
import "./compile";

// Example usage: "LINE=2,5 npm test"
const arg = process.argv.slice(2)[0];
const RELEVANT_LINES = (() => {
	if (arg != null && arg !== "undefined") {
		return arg.split(",").map(n => Number(n));
	} else {
		return undefined;
	}
})();

interface VisitContext {
	checker: TypeChecker;
	foundTest (line: number, typeA: Type, typeB: Type, node: Node): void;
}

function visit (node: ts.Node, ctx: VisitContext) {
	const { checker } = ctx;

	if (ts.isVariableDeclaration(node) && node.initializer != null) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		const typeA = checker.getTypeAtLocation(node);
		const typeB = checker.getTypeAtLocation(node.initializer);

		ctx.foundTest(line, typeA, typeB, node);
	} else if (ts.isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.EqualsToken) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		const typeA = checker.getTypeAtLocation(node.left);
		const typeB = checker.getTypeAtLocation(node.right);

		ctx.foundTest(line, typeA, typeB, node);
	}

	node.forEachChild(child => visit(child, ctx));
}

const filePath = resolve(process.cwd(), "./test-types/test-types.ts");
const { diagnostics, program, sourceFile } = compile(filePath);
const checker = program.getTypeChecker();

const shouldBeAssignable = (line: number) => {
	for (const diagnostic of diagnostics) {
		if (diagnostic.file && [2322, 2741, 2740, 2739].includes(diagnostic.code)) {
			const { line: diagnosticLine } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
			if (line === diagnosticLine) {
				return false;
			}
		}
	}

	return true;
};

visit(sourceFile, {
	checker: program.getTypeChecker(),
	foundTest: (line: number, typeA: Type, typeB: Type, node: VariableDeclaration) => {
		if (RELEVANT_LINES != null && !RELEVANT_LINES.includes(line + 1)) return;
		try {
			executeToStringTest(line, typeA, typeB, { node, checker });
			executeTypeCheckerTest(line, typeA, typeB, { node, checker, shouldBeAssignable: shouldBeAssignable(line) });
		} catch (e) {
			console.log(e);
		}
	}
});

function executeToStringTest (line: number, typeA: Type, typeB: Type, { checker }: { checker: TypeChecker; node: VariableDeclaration }) {
	const typeAStr = checker.typeToString(typeA);

	test(`${line + 1}: simpleTypeToString('${typeAStr}')`, t => {
		const simpleTypeA = toSimpleType(typeA, checker);
		const simpleTypeAStr = simpleTypeToString(simpleTypeA);

		if (simpleTypeAStr !== typeAStr) {
			t.log(simpleTypeA);
			//console.dir(simpleTypeA, {depth: 10});
			return t.fail(`toString should give ${typeAStr}. Not ${simpleTypeAStr}`);
		}

		t.pass();
	});

	const typeBStr = checker.typeToString(typeB);
	if (typeAStr === typeBStr) return;

	test(`${line + 1}: simpleTypeToString('${typeBStr}')`, t => {
		const simpleTypeB = toSimpleType(typeB, checker);
		const simpleTypeBStr = simpleTypeToString(simpleTypeB);

		if (simpleTypeBStr !== typeBStr) {
			t.log(simpleTypeB);
			//console.dir(simpleTypeB, {depth: 10});
			return t.fail(`toString should give ${typeBStr}. Not ${simpleTypeBStr}`);
		}

		t.pass();
	});
}

function executeTypeCheckerTest (line: number, typeA: Type, typeB: Type, { checker, shouldBeAssignable }: { checker: TypeChecker; node: VariableDeclaration; shouldBeAssignable: boolean }) {
	const typeAStr = checker.typeToString(typeA);
	const typeBStr = checker.typeToString(typeB);

	test(`${line + 1}: '${typeAStr}' = '${typeBStr}'`, t => {
		const isAssignable = isAssignableToType(typeA, typeB, checker);

		if (shouldBeAssignable !== isAssignable) {
			const simpleTypeA = toSimpleType(typeA, checker);
			const simpleTypeB = toSimpleType(typeB, checker);
			console.dir(simpleTypeA, {depth: 10});
			console.dir(simpleTypeB, {depth: 10});
			return t.fail(
				`${isAssignable ? "Can" : "Can't"} assign '${typeBStr}' (${simpleTypeB.kind}) to '${typeAStr}' (${simpleTypeA.kind}) but ${
					shouldBeAssignable ? "it should be allowed!" : "it shouldn't be allowed!"
					}`
			);
		}

		t.pass();
	});
}
