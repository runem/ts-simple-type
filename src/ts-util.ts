import { BigIntLiteralType, Declaration, GenericType, LiteralType, Node, ObjectType, Symbol, TupleType, Type, TypeChecker, TypeFlags, TypeReference, UniqueESSymbolType } from "typescript";
import { SimpleTypeModifierKind } from "./simple-type";
import { tsModule } from "./ts-module";
import { and, or } from "./util";

export function isTypeChecker(obj: any): obj is TypeChecker {
	return obj != null && typeof obj === "object" && "getSymbolAtLocation" in obj;
}

export function isNode(obj: any): obj is Node {
	return obj != null && typeof obj === "object" && "kind" in obj && "flags" in obj && "pos" in obj && "end" in obj;
}

function hasFlag(type: Type, flag: TypeFlags | TypeFlags[], op: "and" | "or" = "and"): boolean {
	if (Array.isArray(flag)) {
		return (op === "and" ? and : or)(flag, f => hasFlag(type, f));
	}

	return (type.flags & flag) !== 0;
}

export function matchTypeLeafs(type: Type, match: (type: Type) => boolean): boolean {
	if (type.isUnion()) {
		return or(type.types, t => matchTypeLeafs(t, match));
	} else if (type.isIntersection()) {
		return and(type.types, t => matchTypeLeafs(t, match));
	}

	return match(type);
}

export function isStringLiteralValue(type: Type, value: string) {
	return type.isStringLiteral() && type.value === value;
}

export function isNumberLiteralValue(type: Type, value: number) {
	return type.isNumberLiteral() && type.value === value;
}

export function isPrimitive(type: Type) {
	return isBoolean(type) || isString(type) || isNumber(type) || isBigInt(type);
}

export function isBoolean(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.BooleanLike);
}

export function isBooleanLiteral(type: Type): type is LiteralType {
	return hasFlag(type, tsModule.ts.TypeFlags.BooleanLiteral);
}

export function isBigIntLiteral(type: Type): type is BigIntLiteralType {
	return hasFlag(type, tsModule.ts.TypeFlags.BigIntLiteral);
}

export function isUniqueESSymbol(type: Type): type is UniqueESSymbolType {
	return hasFlag(type, tsModule.ts.TypeFlags.UniqueESSymbol);
}

export function isESSymbolLike(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.ESSymbolLike);
}

export function isLiteral(type: Type): type is LiteralType {
	return type.isLiteral() || isBooleanLiteral(type) || isBigIntLiteral(type);
}

export function isString(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.StringLike);
}

export function isNumber(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.NumberLike);
}

export function isAny(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.Any);
}

export function isEnum(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.EnumLike);
}

export function isBigInt(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.BigIntLike);
}

export function isObject(type: Type): type is ObjectType {
	return hasFlag(type, tsModule.ts.TypeFlags.Object);
}

export function isUnknown(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.Unknown);
}

export function isNull(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.Null);
}

export function isUndefined(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.Undefined);
}

export function isVoid(type: Type) {
	return hasFlag(type, tsModule.ts.TypeFlags.VoidLike);
}

export function isNever(type: Type): boolean {
	return hasFlag(type, tsModule.ts.TypeFlags.Never);
}

export function isObjectTypeReference(type: ObjectType): type is TypeReference {
	return (type.objectFlags & tsModule.ts.ObjectFlags.Reference) !== 0;
}

export function isMethod(type: Type): type is TypeReference {
	if (!isObject(type)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	const decl = getDeclaration(symbol);
	if (decl == null) return false;
	return tsModule.ts.isMethodDeclaration(decl);
}

export function getDeclaration(symbol: Symbol): Declaration | undefined {
	// Note: Somehow "symbol.declarations" can be undefined under some circumstances
	if (symbol.declarations == null) return undefined;
	return symbol.declarations.length > 0 ? symbol.declarations[0] : symbol.valueDeclaration;
}

export function isArray(type: Type): type is TypeReference {
	if (!isObject(type)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return getTypeArguments(type).length === 1 && ["ArrayLike", "ReadonlyArray", "Array"].includes(symbol.getName());
	//return symbol.getName() === "Array"; // && getTypeArguments(type).length === 1;
}

export function isPromise(type: Type): type is TypeReference {
	if (!isObject(type)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return getTypeArguments(type).length === 1 && ["PromiseLike", "Promise"].includes(symbol.getName());
}

export function isDate(type: Type): type is ObjectType {
	if (!isObject(type)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return symbol.getName() === "Date";
}

export function isTuple(type: Type): type is TupleType {
	const target = getTargetType(type);
	if (target == null) return false;
	return (target.objectFlags & tsModule.ts.ObjectFlags.Tuple) !== 0;
}

export function isFunction(type: Type): type is ObjectType {
	if (!isObject(type)) return false;
	const symbol = type.getSymbol();
	if (symbol == null) return false;
	return (symbol.flags & tsModule.ts.SymbolFlags.Function) !== 0 || (symbol.members != null && symbol.members.has("__call" as any));
}

export function getTypeArguments(type: ObjectType): Type[] {
	if (isObject(type)) {
		if (isObjectTypeReference(type)) {
			return Array.from(type.typeArguments || []);
		}
	}

	return [];
}

export function getTargetType(type: Type): GenericType | undefined {
	if (isObject(type) && isObjectTypeReference(type)) {
		return type.target;
	}
}

export function getModifiersFromDeclaration(declaration: Declaration): SimpleTypeModifierKind[] {
	const tsModifiers = tsModule.ts.getCombinedModifierFlags(declaration);
	const modifiers: SimpleTypeModifierKind[] = [];

	const map: Record<number, SimpleTypeModifierKind> = {
		[tsModule.ts.ModifierFlags.Export]: SimpleTypeModifierKind.EXPORT,
		[tsModule.ts.ModifierFlags.Ambient]: SimpleTypeModifierKind.AMBIENT,
		[tsModule.ts.ModifierFlags.Public]: SimpleTypeModifierKind.PUBLIC,
		[tsModule.ts.ModifierFlags.Private]: SimpleTypeModifierKind.PRIVATE,
		[tsModule.ts.ModifierFlags.Protected]: SimpleTypeModifierKind.PROTECTED,
		[tsModule.ts.ModifierFlags.Static]: SimpleTypeModifierKind.STATIC,
		[tsModule.ts.ModifierFlags.Readonly]: SimpleTypeModifierKind.READONLY,
		[tsModule.ts.ModifierFlags.Abstract]: SimpleTypeModifierKind.ABSTRACT,
		[tsModule.ts.ModifierFlags.Async]: SimpleTypeModifierKind.ASYNC,
		[tsModule.ts.ModifierFlags.Default]: SimpleTypeModifierKind.DEFAULT
	};

	Object.entries(map).forEach(([tsModifier, modifierKind]) => {
		if ((tsModifiers & Number(tsModifier)) !== 0) {
			modifiers.push(modifierKind);
		}
	});

	return modifiers;
}
