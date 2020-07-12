import test from "ava";
import * as ts from "typescript";
import { Program } from "typescript";
import { deserializeSimpleType, serializeSimpleType, SimpleType } from "../src";
import { isAssignableToSimpleType } from "../src/is-assignable/is-assignable-to-simple-type";
import { toSimpleType } from "../src/transform/to-simple-type";
import { programWithVirtualFiles } from "./helpers/analyze-text";

test("Large, recursive types that match on structure but not reference should not continue forever", t => {
	const program = programWithVirtualFiles("", { includeLib: true });

	const typeA = getLibTypeWithName("MouseEvent", program)!;

	// Serialize+deserialize the type in order to change the reference
	const typeB = deserializeSimpleType(serializeSimpleType(getLibTypeWithName("MouseEvent", program)!));

	const result = isAssignableToSimpleType(typeA, typeB);

	t.truthy(result);
});

export function getLibTypeWithName(name: string, program: Program): SimpleType | undefined {
	for (const libFileName of ["lib.dom.d.ts"]) {
		const sourceFile = program.getSourceFile(libFileName);
		if (sourceFile == null) {
			continue;
		}

		for (const statement of sourceFile.statements) {
			if (ts.isInterfaceDeclaration(statement) && statement.name?.text === name) {
				return toSimpleType(statement, program.getTypeChecker());
			}
		}
	}

	return undefined;
}
