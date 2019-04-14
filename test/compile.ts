import ts, { Diagnostic, CompilerOptions, SourceFile } from "typescript";

const defaultOptions: CompilerOptions = {
	noEmitOnError: true,
	noImplicitAny: true,
	target: ts.ScriptTarget.ES5,
	module: ts.ModuleKind.CommonJS,
	strict: true
};

export function compile(filePath: string, options: Partial<CompilerOptions> = {}): { sourceFile: SourceFile, diagnostics: ReadonlyArray<Diagnostic>, program: ts.Program } {
	const program = ts.createProgram([filePath], {...defaultOptions, ...options});
	const sourceFile = program.getSourceFile(filePath);
	if (sourceFile == null) throw new Error(`Couldn't find source file: ${filePath}`);

	const emitResult = program.emit();
	const diagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	return { sourceFile, diagnostics, program }
}