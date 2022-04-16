import test from "ava";
import { isAssignableToValue, toSimpleType } from "../src";
import { Project } from "ts-morph";
import * as ts from "typescript";

function getType(source: string): [ts.Type, ts.TypeChecker] {
	const project = new Project();
	const typeChecker = project.getTypeChecker().compilerObject;

	project.createSourceFile("test.ts", source);
	const sourceFile = project.getSourceFile("test.ts")!;
	const typeAlias = sourceFile.getTypeAlias("Type");
	if (!typeAlias) throw new Error("type not found");
	return [typeAlias.getType().compilerType, typeChecker];
}

test("RegExp", t => {
	const [type, typeChecker] = getType("type Type = RegExp");
	t.truthy(isAssignableToValue(type, /test/, typeChecker));
	t.falsy(isAssignableToValue(type, {}, typeChecker));
});
