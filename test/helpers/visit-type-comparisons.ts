import { CompilerOptions, Diagnostic, getPreEmitDiagnostics, isBinaryExpression, isVariableDeclaration, Node, Program, SyntaxKind, Type, TypeChecker } from "typescript";
import { programWithVirtualFiles } from "./analyze-text";
import { generateCombinedTypeTestCode } from "./generate-combined-type-test-code";
import { TypescriptType } from "./type-test";

const INVALID_DIAGNOSTIC_CODES = [
	2322, // typeB is not assignable to typeA (general)
	2559, // typeB has no properties in common with typeA
	2560, // typeB has no properties in common with typeA (did you mean to call it?)
	2739, // typeB is missing the following properties from typeA
	2740, // typeB is missing the following properties, and more from typeA
	2741 // property is missing in typeB but required in typeA
];

/**
 * Visits all type comparisons by traversing the AST recursively
 * @param node
 * @param foundAssignment
 */
function visitNodeComparisons(node: Node, foundAssignment: (options: { line: number; nodeA: Node; nodeB: Node }) => void): void {
	if (isVariableDeclaration(node) && node.initializer != null) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		foundAssignment({ line, nodeA: node, nodeB: node.initializer });
	} else if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.EqualsToken) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		foundAssignment({ line, nodeA: node.left, nodeB: node.right });
	}

	node.forEachChild(child => visitNodeComparisons(child, foundAssignment));
}

/**
 * Returns if diagnostics tell that there is a valid assignment on a specific line
 * @param line
 * @param diagnostics
 */
function hasValidAssignmentOnLine(line: number, diagnostics: ReadonlyArray<Diagnostic>): boolean {
	return !diagnostics.some(diagnostic => diagnostic.file && diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!).line === line && INVALID_DIAGNOSTIC_CODES.includes(diagnostic.code));
}

export type VisitComparisonInTestCodeOptions = {
	line: number;
	typeA: Type;
	typeB: Type;
	program: Program;
	typeAString: string;
	typeBString: string;
	checker: TypeChecker;
	assignable: boolean;
};

/**
 * Visits all type comparisons and emits them through the callback
 * @param testCode
 * @param callback
 * @param compilerOptions
 */
export function visitComparisonsInTestCode(testCode: string, compilerOptions: CompilerOptions, callback: (options: VisitComparisonInTestCodeOptions) => void) {
	const program = programWithVirtualFiles(testCode, { options: compilerOptions, includeLib: true });

	const [sourceFile] = program.getSourceFiles().filter(f => !f.fileName.includes("node_modules"));

	const emitResult = program.emit();
	const diagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	const checker = program.getTypeChecker();

	visitNodeComparisons(sourceFile, ({ line, nodeA, nodeB }) => {
		const typeA = checker.getTypeAtLocation(nodeA);
		const typeB = checker.getTypeAtLocation(nodeB);

		const typeAString = checker.typeToString(typeA);
		const typeBString = checker.typeToString(typeB);

		const assignable = hasValidAssignmentOnLine(line, diagnostics);

		callback({ line, typeA, typeB, typeAString, typeBString, program, checker, assignable });
	});
}

export function visitTypeComparisons(typesX: TypescriptType[], typesY: TypescriptType[], compilerOptions: CompilerOptions, callback: (options: VisitComparisonInTestCodeOptions) => void): void {
	const testCode = generateCombinedTypeTestCode(typesX, typesY);
	visitComparisonsInTestCode(testCode, compilerOptions, callback);
}
