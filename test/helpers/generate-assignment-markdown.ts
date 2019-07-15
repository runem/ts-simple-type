import { writeFileSync } from "fs";
import { join } from "path";
import { generateCombinedTypeTestCode } from "./generate-combined-type-test-code";
import { markdownTable } from "./markdown-util";
import { TypescriptType } from "./type-test";
import { visitComparisonsInTestCode } from "./visit-type-comparisons";
import { CompilerOptions } from "typescript";
import { PRIMITIVE_TYPES, SPECIAL_TYPES } from "../type-combinations.spec";

/**
 * Generates a markdown table that shows assignability between types.
 * @param types
 * @param compilerOptions
 */
export function generateAssignmentTableMarkdown(types: TypescriptType[], compilerOptions: CompilerOptions = {}) {
	const typeResults = new Map<string, Map<string, boolean>>();

	// Save all assignments to the nested map
	const testCode = generateCombinedTypeTestCode(types, types);
	visitComparisonsInTestCode(testCode, compilerOptions, ({ assignable, typeAString, typeBString }) => {
		const typeResult = typeResults.get(typeAString) || new Map();
		typeResult.set(typeBString, assignable);
		typeResults.set(typeAString, typeResult);
	});

	// Generate header row using the keys of "typeResult" (this is typeB).
	// We can do this because all types are inserted into the map in the same order
	const headerRow: string[] = ["typeB ➡️\ntypeA ⬇️", ...Array.from(typeResults.keys())];

	// Generate all table rows using the nested maps
	const rows: string[][] = Array.from(typeResults.entries()).map(([title, typeResult]) => [title, ...Array.from(typeResult.values()).map(assignable => (assignable ? "✅" : "❌"))]);
	const tableRows = [headerRow, ...rows];

	return markdownTable(tableRows);
}

/**
 * Generates markdown showing assignability between types in different modes.
 * @param types
 * @param path
 */
export function generateAssignmentMarkdown(types: TypescriptType[], path: string = "./assignments.md") {
	const strictTableMarkdown = generateAssignmentTableMarkdown(types, { strict: true });
	const nonStrictTableMarkdown = generateAssignmentTableMarkdown(types, { strict: false });

	return `# Assignments 
This table illustrates which types can be assigned to each other.

Each cell shows if the assignment \`typeA = typeB\` is valid.

	## Assignments with strict options:
	${strictTableMarkdown}
	
	## Assignments with non-strict options:
	${nonStrictTableMarkdown}
	`;
}

/**
 * Writes assignment comparison markdown to the file system.
 * @param types
 * @param path
 */
export function writeAssignmentMarkdown(path: string = "./assignments.md") {
	const markdown = generateAssignmentMarkdown([...PRIMITIVE_TYPES, ...SPECIAL_TYPES, "{}", "void"]);
	const absolutePath = join(process.cwd(), path);
	console.log(`Writing comparison table to ${absolutePath}`);
	writeFileSync(absolutePath, markdown);
}
