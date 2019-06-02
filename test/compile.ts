import { createProgram, Diagnostic, CompilerOptions, getPreEmitDiagnostics, Program, ModuleKind, ScriptTarget, SourceFile } from "typescript";

const defaultOptions: CompilerOptions = {
	noEmitOnError: true,
	noImplicitAny: true,
	target: ScriptTarget.ES5,
	module: ModuleKind.CommonJS,
	strict: true
};

export function compile(filePath: string, options: Partial<CompilerOptions> = {}): { sourceFile: SourceFile; diagnostics: ReadonlyArray<Diagnostic>; program: Program } {
	const program = createProgram([filePath], { ...defaultOptions, ...options });
	const sourceFile = program.getSourceFile(filePath);
	if (sourceFile == null) throw new Error(`Couldn't find source file: ${filePath}`);

	const emitResult = program.emit();
	const diagnostics = getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	return { sourceFile, diagnostics, program };
}
