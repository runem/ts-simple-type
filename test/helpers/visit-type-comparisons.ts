import { CompilerOptions, Diagnostic, getPreEmitDiagnostics, isBinaryExpression, isVariableDeclaration, Node, Program, SyntaxKind, Type, TypeChecker } from "typescript";
import { programWithVirtualFiles } from "./analyze-text";

/**
 * Visits all type comparisons by traversing the AST recursively
 * @param node
 * @param foundAssignment
 */
function visitComparisons(node: Node, foundAssignment: (options: { line: number; nodeA: Node; nodeB: Node }) => void): void {
	if (isVariableDeclaration(node) && node.initializer != null) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		foundAssignment({ line, nodeA: node, nodeB: node.initializer });
	} else if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.EqualsToken) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		foundAssignment({ line, nodeA: node.left, nodeB: node.right });
	}

	node.forEachChild(child => visitComparisons(child, foundAssignment));
}

/**
 * Returns if diagnostics tell that there is a valid assignment on a specific line
 * @param line
 * @param diagnostics
 */
function hasValidAssignmentOnLine(line: number, diagnostics: ReadonlyArray<Diagnostic>): boolean {
	return !diagnostics.some(diagnostic => diagnostic.file && diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!).line === line && [2322, 2741, 2740, 2739].includes(diagnostic.code));
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
export function visitComparisonsInTestCode(testCode: string, callback: (options: VisitComparisonInTestCodeOptions) => void, compilerOptions: CompilerOptions = {}) {
	const program = programWithVirtualFiles(testCode, { options: compilerOptions, includeLib: true });

	const [sourceFile] = program.getSourceFiles().filter(f => !f.fileName.includes("node_modules"));

	const emitResult = program.emit();
	const diagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	const checker = program.getTypeChecker();

	visitComparisons(sourceFile, ({ line, nodeA, nodeB }) => {
		const typeA = checker.getTypeAtLocation(nodeA);
		const typeB = checker.getTypeAtLocation(nodeB);

		const typeAString = checker.typeToString(typeA);
		const typeBString = checker.typeToString(typeB);

		const assignable = hasValidAssignmentOnLine(line, diagnostics);

		callback({ line, typeA, typeB, typeAString, typeBString, program, checker, assignable });
	});
}
