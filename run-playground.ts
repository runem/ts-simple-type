import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { basename, relative, resolve } from "path";
import { CompilerOptions, convertCompilerOptionsFromJson, createProgram, findConfigFile, Program, readConfigFile, SourceFile, TypeChecker } from "typescript";
import { isAssignableToSimpleType } from "./src/is-assignable/is-assignable-to-simple-type";
import { deserializeSimpleType, serializeSimpleType } from "./src/transform/serialize-simple-type";
import { isSimpleType, SimpleType } from "./src/simple-type";
import { toSimpleType } from "./src/transform/to-simple-type";
import { visitNodeComparisons } from "./test/helpers/visit-type-comparisons";

const PLAYGROUND_DIRECTORY = resolve("playground");
const PLAYGROUND_PATH_SF = resolve(PLAYGROUND_DIRECTORY, "playground.ts");
const PLAYGROUND_PATH_CONFIG = resolve(PLAYGROUND_DIRECTORY, "tsconfig.json");

async function run() {
	ensurePlayground();

	const forceStrict = process.env.STRICT == null ? undefined : process.env.STRICT !== "false";
	const options = forceStrict != null ? { strict: forceStrict } : resolveTsConfigCompilerOptions(PLAYGROUND_DIRECTORY);

	const forceFile = process.env.FILE == null ? undefined : resolve(PLAYGROUND_DIRECTORY, process.env.FILE);
	const program = createProgram([forceFile || PLAYGROUND_PATH_SF], options || {});

	const sourceFile = Array.from(program.getSourceFiles()).find(f => f.fileName.includes(forceFile || "playground"));
	if (sourceFile == null) {
		throw new Error("Can't find playground.ts");
	}

	visitComparisons(sourceFile, program);
}

// @ts-ignore
function ensurePlayground(): void {
	if (!existsSync(PLAYGROUND_DIRECTORY)) {
		console.log(`Directory '${relative(process.cwd(), PLAYGROUND_DIRECTORY)}' doesn't exists. Creating directory...`);
		mkdirSync(PLAYGROUND_DIRECTORY);
	}

	if (!existsSync(PLAYGROUND_PATH_CONFIG)) {
		console.log(`File '${relative(process.cwd(), PLAYGROUND_PATH_CONFIG)}' doesn't exists. Creating file...`);
		const config = `{
	"files": [
		"playground.ts"
	],
	"compilerOptions": {
		"strict": true,
		//"strictFunctionTypes": true,
		//"strictNullChecks": true,
		"target": "esnext",
		"module": "commonjs",
		"lib": [
			"esnext",
			"dom"
		],
		"outDir": "./dist"
	}
}`;

		writeFileSync(PLAYGROUND_PATH_CONFIG, config);
	}

	if (!existsSync(PLAYGROUND_PATH_SF)) {
		console.log(`File ${relative(process.cwd(), PLAYGROUND_PATH_CONFIG)} doesn't exists. Creating example file...`);
		const exampleCode = `interface A {
	a: string;
}

interface B {
	b: string;
}

// All assignments in this file are checked when running the playground.
// This file is in gitignore so no changes you make here are saved.
// Please use the following pattern when testing types in the playground.
{ const _: A = {} as B; }

	`;

		writeFileSync(PLAYGROUND_PATH_SF, exampleCode);
	}
}

function visitComparisons(sourceFile: SourceFile, program: Program) {
	const options = program.getCompilerOptions();
	const checker = program.getTypeChecker();

	const { strict, strictNullChecks, strictFunctionTypes } = options;
	console.log(`Compiler options:`, { strict, strictNullChecks, strictFunctionTypes });

	const onlyLine = process.env.LINE != null ? Number(process.env.LINE) : undefined;
	if (onlyLine != null) {
		console.log(`Only check line ${onlyLine}`);
	}

	const debug = process.env.DEBUG != null && process.env.DEBUG !== "false";
	const eager = process.env.EAGER != null && process.env.EAGER !== "false";
	if (eager) {
		console.log(`Eager types`);
	}

	visitNodeComparisons(sourceFile, ({ line, nodeA, nodeB }) => {
		line = line + 1;

		// Skip lines
		if (onlyLine != null && line !== onlyLine) {
			return;
		}

		const typeA = checker.getTypeAtLocation(nodeA);
		const typeB = checker.getTypeAtLocation(nodeB);

		const typeAString = checker.typeToString(typeA);
		const typeBString = checker.typeToString(typeB);

		const expected = (checker as any).isTypeAssignableTo(typeB, typeA);

		console.log(`\n------------- Checking line ${line} (${typeAString} === ${typeBString}) --------------`);

		// Get typeA
		console.time("type-a-to-simple-type");
		const simpleTypeA = isSimpleType(typeA) ? typeA : toSimpleType(typeA, checker, { eager });
		console.timeEnd("type-a-to-simple-type");

		// Get typeB
		console.time("type-b-to-simple-type");
		const simpleTypeB = isSimpleType(typeB) ? typeB : toSimpleType(typeB, checker, { eager });
		console.timeEnd("type-b-to-simple-type");

		// Run type checking
		if (!debug) console.time("type-checking-lazy");
		const actual = (() => {
			try {
				return isAssignableToSimpleType(simpleTypeA, simpleTypeB, { ...options, debug });
			} catch (e) {
				console.log(`isAssignableToSimpleType failed`);
				console.error(e);
				return null;
			}
		})();
		if (!debug) console.timeEnd("type-checking-lazy");

		printType(simpleTypeA, checker, "TypeA");
		printType(simpleTypeB, checker, "TypeB");

		// Log result
		console.log(`\n##### Result #####`);
		//console.log({ typeAString, typeBString });
		console.log({ actual, expected });

		if (actual !== expected) {
			throw new Error(
				[
					expected ? "Expected types to be assignable, but tsSimpleType returned 'false'" : "Expected types not to be assignable, but tsSimpleType returned 'true'",
					`Compiler options: ${JSON.stringify({ strict, strictNullChecks, strictFunctionTypes })}`,
					`Line: ${line}`,
					`Eager: ${eager}`,
					`Assignment: (${typeAString} === ${typeBString})`,
					onlyLine == null ? `> LINE=${line} DEBUG=true npm run playground` : ""
				].join("\n")
			);
		}
	});
}

function printType(simpleType: SimpleType, checker: TypeChecker, title: string) {
	console.log(`\n//////////// Printing ${title} //////////////`);

	// Print the type
	const serialized = serializeSimpleType(simpleType);
	const typeCount = Object.keys(serialized.typeMap).length;

	if (typeCount > 50) {
		console.log(`${title} is too big to console.log. It contains ${typeCount} unique types.`);
	} else {
		// Deserialize to unpack lazy types
		const deserialized = deserializeSimpleType(serialized);
		//console.log(`##### ${title} flat #####`);
		//console.dir(serialized, { depth: 4 });
		//console.log(`\n##### ${title} nested #####`);
		console.dir(deserialized, { depth: 6 });
	}
}

run().catch(console.error);

/**
 * Resolves "tsconfig.json" file and returns its CompilerOptions
 */
export function resolveTsConfigCompilerOptions(directory: string = process.cwd()): CompilerOptions | undefined {
	// Find the nearest tsconfig.json file if possible
	const tsConfigFilePath = findConfigFile(directory, existsSync, "tsconfig.json");

	if (tsConfigFilePath != null) {
		// Read the tsconfig.json file
		const parsedConfig = readConfigFile(tsConfigFilePath, path => readFileSync(path, "utf8"));

		if (parsedConfig != null && parsedConfig.config != null) {
			// Parse the tsconfig.json file
			const parsedJson = convertCompilerOptionsFromJson(parsedConfig.config.compilerOptions, basename(tsConfigFilePath), "tsconfig.json");
			return parsedJson?.options;
		}
	}

	return undefined;
}
