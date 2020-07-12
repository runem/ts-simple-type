import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { CompilerOptions, createProgram, createSourceFile, getDefaultLibFileName, ModuleKind, Program, ScriptKind, ScriptTarget, SourceFile, sys } from "typescript";

export interface ITestFile {
	fileName: string;
	text: string;
	entry?: boolean;
}

export type TestFile = ITestFile | string;

/**
 * Creates a program using input code
 * @param {ITestFile[]|TestFile} inputFiles
 * @param options
 */
export function programWithVirtualFiles(inputFiles: TestFile[] | TestFile, { options, includeLib }: { options?: CompilerOptions; includeLib?: boolean } = {}): Program {
	const cwd = process.cwd();

	const files: ITestFile[] = (Array.isArray(inputFiles) ? inputFiles : [inputFiles])
		.map(file =>
			typeof file === "string"
				? {
						text: file,
						fileName: `auto-generated-${Math.floor(Math.random() * 100000)}.ts`,
						entry: true
				  }
				: file
		)
		.map(file => ({ ...file, fileName: join(cwd, file.fileName) }));

	const entryFile = files.find(file => file.entry === true) || files[0];
	if (entryFile == null) {
		throw new ReferenceError(`No entry could be found`);
	}

	const compilerOptions: CompilerOptions = {
		module: ModuleKind.ESNext,
		target: ScriptTarget.ESNext,
		allowJs: true,
		sourceMap: false,
		noEmitOnError: true,
		noImplicitAny: true,
		strict: true,
		...options
	};

	return createProgram({
		rootNames: files.map(file => file.fileName),
		options: compilerOptions,
		host: {
			writeFile: () => {},
			readFile: (fileName: string): string | undefined => {
				const matchedFile = files.find(currentFile => currentFile.fileName === fileName);
				if (matchedFile != null) {
					return matchedFile.text;
				}

				if (includeLib) {
					fileName = fileName.match(/[/\\]/) ? fileName : join(dirname(require.resolve("typescript")), fileName);
				}

				if (existsSync(fileName)) {
					return readFileSync(fileName, "utf8").toString();
				}

				return undefined;
			},
			fileExists: (fileName: string): boolean => {
				return files.some(currentFile => currentFile.fileName === fileName);
			},
			getSourceFile(fileName: string, languageVersion: ScriptTarget): SourceFile | undefined {
				const sourceText = this.readFile(fileName);
				if (sourceText == null) return undefined;

				return createSourceFile(fileName, sourceText, languageVersion, true, ScriptKind.TS);
			},

			getCurrentDirectory() {
				return ".";
			},

			getDirectories(directoryName: string) {
				return sys.getDirectories(directoryName);
			},

			getDefaultLibFileName(options: CompilerOptions): string {
				return getDefaultLibFileName(options);
			},

			getCanonicalFileName(fileName: string): string {
				return this.useCaseSensitiveFileNames() ? fileName : fileName.toLowerCase();
			},

			getNewLine(): string {
				return sys.newLine;
			},

			useCaseSensitiveFileNames() {
				return sys.useCaseSensitiveFileNames;
			}
		}
	});
}
