import { isBinaryExpression, isVariableDeclaration, Node, SyntaxKind, Type, TypeChecker } from "typescript";

export interface VisitAssignmentsContext {
	checker: TypeChecker;
	/**
	 * Emits when a type comparison has been found
	 * @param line
	 * @param typeA
	 * @param typeB
	 * @param node
	 */
	foundTest (line: number, typeA: Type, typeB: Type, node: Node): void;
}

export function visitAssignments (node: Node, ctx: VisitAssignmentsContext) {
	const { checker } = ctx;

	if (isVariableDeclaration(node) && node.initializer != null) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		const typeA = checker.getTypeAtLocation(node);
		const typeB = checker.getTypeAtLocation(node.initializer);

		ctx.foundTest(line, typeA, typeB, node);
	} else if (isBinaryExpression(node) && node.operatorToken.kind === SyntaxKind.EqualsToken) {
		const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
		const typeA = checker.getTypeAtLocation(node.left);
		const typeB = checker.getTypeAtLocation(node.right);

		ctx.foundTest(line, typeA, typeB, node);
	}

	node.forEachChild(child => visitAssignments(child, ctx));
}