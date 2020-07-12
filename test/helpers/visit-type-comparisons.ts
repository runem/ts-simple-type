import { CompilerOptions, isBinaryExpression, isVariableDeclaration, Node, Program, SyntaxKind, Type, TypeChecker } from "typescript";
import { programWithVirtualFiles } from "./analyze-text";
import { generateCombinedTypeTestCode } from "./generate-combined-type-test-code";
import { TypescriptType } from "./type-test";

/**
 * Visits all type comparisons by traversing the AST recursively
 * @param node
 * @param foundAssignment
 */
export function visitNodeComparisons(node: Node, foundAssignment: (options: { line: number; nodeA: Node; nodeB: Node }) => void): void {
	if (isVariableDeclaration(node) && node.initializer != null) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		foundAssignment({ line, nodeA: node, nodeB: node.initializer });
	} else if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.EqualsToken) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		foundAssignment({ line, nodeA: node.left, nodeB: node.right });
	}

	node.forEachChild(child => visitNodeComparisons(child, foundAssignment));
}

export interface VisitComparisonInTestCodeOptions {
	line: number;
	typeA: Type;
	typeB: Type;
	nodeA: Node;
	nodeB: Node;
	program: Program;
	typeAString: string;
	typeBString: string;
	checker: TypeChecker;
	assignable: boolean;
}

/**
 * Visits all type comparisons and emits them through the callback
 * @param testCode
 * @param callback
 * @param compilerOptions
 */
export function visitComparisonsInTestCode(testCode: string, compilerOptions: CompilerOptions, callback: (options: VisitComparisonInTestCodeOptions) => void) {
	const program = programWithVirtualFiles({ fileName: "test-code.ts", text: testCode }, { options: compilerOptions, includeLib: true });

	const [sourceFile] = program.getSourceFiles().filter(f => f.fileName.includes("test-code"));

	const checker = program.getTypeChecker();

	visitNodeComparisons(sourceFile, ({ line, nodeA, nodeB }) => {
		const typeA = checker.getTypeAtLocation(nodeA);
		const typeB = checker.getTypeAtLocation(nodeB);

		const typeAString = checker.typeToString(typeA);
		const typeBString = checker.typeToString(typeB);

		const assignable = (checker as any).isTypeAssignableTo(typeB, typeA);

		callback({ line, typeA, typeB, typeAString, typeBString, program, checker, assignable, nodeA, nodeB });
	});
}

export function visitTypeComparisons(typesX: TypescriptType[], typesY: TypescriptType[], compilerOptions: CompilerOptions, callback: (options: VisitComparisonInTestCodeOptions) => void): void {
	const testCode = generateCombinedTypeTestCode(typesX, typesY);
	visitComparisonsInTestCode(testCode, compilerOptions, callback);
}
