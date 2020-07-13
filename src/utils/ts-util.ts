import * as tsModule from "typescript";
import {
	BigIntLiteralType,
	Declaration,
	GenericType,
	LiteralType,
	Node,
	ObjectType,
	Program,
	Symbol,
	TupleTypeReference,
	Type,
	TypeChecker,
	TypeFlags,
	TypeReference,
	UniqueESSymbolType
} from "typescript";
import { SimpleTypeModifierKind } from "../simple-type";
import { and, or } from "./list-util";

export function isTypeChecker(obj: unknown): obj is TypeChecker {
	return obj != null && typeof obj === "object" && "getSymbolAtLocation" in obj!;
}

export function isProgram(obj: unknown): obj is Program {
	return obj != null && typeof obj === "object" && "getTypeChecker" in obj! && "getCompilerOptions" in obj!;
}

export function isNode(obj: unknown): obj is Node {
	return obj != null && typeof obj === "object" && "kind" in obj! && "flags" in obj! && "pos" in obj! && "end" in obj!;
}

function typeHasFlag(type: Type, flag: TypeFlags | TypeFlags[], op: "and" | "or" = "and"): boolean {
	return hasFlag(type.flags, flag, op);
}

function hasFlag(flags: number, flag: number | number[], op: "and" | "or" = "and"): boolean {
	if (Array.isArray(flag)) {
		return (op === "and" ? and : or)(flag, f => hasFlag(flags, f));
	}

	return (flags & flag) !== 0;
}

export function isBoolean(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.BooleanLike) || type.symbol?.name === "Boolean";
}

export function isBooleanLiteral(type: Type, ts: typeof tsModule): type is LiteralType {
	return typeHasFlag(type, ts.TypeFlags.BooleanLiteral);
}

export function isBigIntLiteral(type: Type, ts: typeof tsModule): type is BigIntLiteralType {
	return typeHasFlag(type, ts.TypeFlags.BigIntLiteral);
}

export function isUniqueESSymbol(type: Type, ts: typeof tsModule): type is UniqueESSymbolType {
	return typeHasFlag(type, ts.TypeFlags.UniqueESSymbol);
}

export function isESSymbolLike(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.ESSymbolLike) || type.symbol?.name === "Symbol";
}

export function isLiteral(type: Type, ts: typeof tsModule): type is LiteralType {
	return type.isLiteral() || isBooleanLiteral(type, ts) || isBigIntLiteral(type, ts) || isUniqueESSymbol(type, ts);
}

export function isString(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.StringLike) || type.symbol?.name === "String";
}

export function isNumber(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.NumberLike) || type.symbol?.name === "Number";
}

export function isAny(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.Any);
}

export function isEnum(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.EnumLike);
}

export function isBigInt(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.BigIntLike) || type.symbol?.name === "BigInt";
}

export function isObject(type: Type, ts: typeof tsModule): type is ObjectType {
	return typeHasFlag(type, ts.TypeFlags.Object) || type.symbol?.name === "Object";
}

export function isNonPrimitive(type: Type, ts: typeof tsModule): type is ObjectType {
	return typeHasFlag(type, ts.TypeFlags.NonPrimitive) || type.symbol?.name === "object";
}

export function isThisType(type: Type, ts: typeof tsModule): type is ObjectType {
	const kind = type.getSymbol()?.valueDeclaration?.kind;
	if (kind == null) {
		return false;
	}

	return hasFlag(kind, ts.SyntaxKind.ThisKeyword);
}

export function isUnknown(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.Unknown);
}

export function isNull(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.Null);
}

export function isUndefined(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.Undefined);
}

export function isVoid(type: Type, ts: typeof tsModule) {
	return typeHasFlag(type, ts.TypeFlags.VoidLike);
}

export function isNever(type: Type, ts: typeof tsModule): boolean {
	return typeHasFlag(type, ts.TypeFlags.Never);
}

export function isObjectTypeReference(type: ObjectType, ts: typeof tsModule): type is TypeReference {
	return hasFlag(type.objectFlags, ts.ObjectFlags.Reference);
}

export function isSymbol(obj: object): obj is Symbol {
	return "flags" in obj && "name" in obj && "getDeclarations" in obj;
}

export function isType(obj: object): obj is Type {
	return "flags" in obj && "getSymbol" in obj;
}

export function isMethod(type: Type, ts: typeof tsModule): type is TypeReference {
	if (!isObject(type, ts)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;

	return hasFlag(symbol.flags, ts.SymbolFlags.Method);
}

export function getDeclaration(symbol: Symbol, ts: typeof tsModule): Declaration | undefined {
	const declarations = symbol.getDeclarations();
	if (declarations == null || declarations.length === 0) return symbol.valueDeclaration;
	return declarations[0];
}

export function isArray(type: Type, checker: TypeChecker, ts: typeof tsModule): type is TypeReference {
	if (!isObject(type, ts)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return getTypeArguments(type, checker, ts).length === 1 && ["ArrayLike", "ReadonlyArray", "ConcatArray", "Array"].includes(symbol.getName());
}

export function isPromise(type: Type, checker: TypeChecker, ts: typeof tsModule): type is TypeReference {
	if (!isObject(type, ts)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return getTypeArguments(type, checker, ts).length === 1 && ["PromiseLike", "Promise"].includes(symbol.getName());
}

export function isDate(type: Type, ts: typeof tsModule): type is ObjectType {
	if (!isObject(type, ts)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return symbol.getName() === "Date";
}

export function isTupleTypeReference(type: Type, ts: typeof tsModule): type is TupleTypeReference {
	const target = getTargetType(type, ts);
	if (target == null) return false;
	return (target.objectFlags & ts.ObjectFlags.Tuple) !== 0;
}

export function isFunction(type: Type, ts: typeof tsModule): type is ObjectType {
	if (!isObject(type, ts)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return (symbol.flags & ts.SymbolFlags.Function) !== 0 || symbol.escapedName === "Function" || (symbol.members != null && symbol.members.has("__call" as never));
}

export function getTypeArguments(type: ObjectType, checker: TypeChecker, ts: typeof tsModule): Type[] {
	if (isObject(type, ts)) {
		if (isObjectTypeReference(type, ts)) {
			if ("getTypeArguments" in checker) {
				return Array.from(checker.getTypeArguments(type) || []);
			} else {
				return Array.from(type.typeArguments || []);
			}
		}
	}

	return [];
}

export function getTargetType(type: Type, ts: typeof tsModule): GenericType | undefined {
	if (isObject(type, ts) && isObjectTypeReference(type, ts)) {
		return type.target;
	}
}

export function getModifiersFromDeclaration(declaration: Declaration, ts: typeof tsModule): SimpleTypeModifierKind[] {
	const tsModifiers = ts.getCombinedModifierFlags(declaration);
	const modifiers: SimpleTypeModifierKind[] = [];

	const map: Record<number, SimpleTypeModifierKind> = {
		[ts.ModifierFlags.Export]: "EXPORT",
		[ts.ModifierFlags.Ambient]: "AMBIENT",
		[ts.ModifierFlags.Public]: "PUBLIC",
		[ts.ModifierFlags.Private]: "PRIVATE",
		[ts.ModifierFlags.Protected]: "PROTECTED",
		[ts.ModifierFlags.Static]: "STATIC",
		[ts.ModifierFlags.Readonly]: "READONLY",
		[ts.ModifierFlags.Abstract]: "ABSTRACT",
		[ts.ModifierFlags.Async]: "ASYNC",
		[ts.ModifierFlags.Default]: "DEFAULT"
	};

	Object.entries(map).forEach(([tsModifier, modifierKind]) => {
		if ((tsModifiers & Number(tsModifier)) !== 0) {
			modifiers.push(modifierKind);
		}
	});

	return modifiers;
}

export function isImplicitGeneric(type: Type, checker: TypeChecker, ts: typeof tsModule): boolean {
	return isArray(type, checker, ts) || isTupleTypeReference(type, ts) || isPromise(type, checker, ts);
}

export function isMethodSignature(type: Type, ts: typeof tsModule): boolean {
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	if (!isObject(type, ts)) return false;
	if (type.getCallSignatures().length === 0) return false;

	const decl = getDeclaration(symbol, ts);
	if (decl == null) return false;
	return decl.kind === ts.SyntaxKind.MethodSignature;
}
