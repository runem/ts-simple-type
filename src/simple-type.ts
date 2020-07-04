export type SimpleTypeKind =
	// Primitives types
	| "STRING_LITERAL"
	| "NUMBER_LITERAL"
	| "BOOLEAN_LITERAL"
	| "BIG_INT_LITERAL"
	| "ES_SYMBOL_UNIQUE"
	| "STRING"
	| "NUMBER"
	| "BOOLEAN"
	| "BIG_INT"
	| "ES_SYMBOL"
	| "NULL"
	| "UNDEFINED"
	| "VOID"
	// TS-specific types
	| "NEVER"
	| "ANY"
	| "UNKNOWN"
	| "ENUM"
	| "ENUM_MEMBER"
	| "NON_PRIMITIVE"
	// Structured types
	| "UNION"
	| "INTERSECTION"
	// Object types types
	| "INTERFACE"
	| "OBJECT"
	| "CLASS"
	// Callable
	| "FUNCTION"
	| "METHOD"
	// Generics
	| "GENERIC_ARGUMENTS"
	| "GENERIC_PARAMETER"
	| "ALIAS"
	// Lists
	| "TUPLE"
	| "ARRAY"
	// Special types
	| "DATE"
	| "PROMISE";

export type SimpleTypeModifierKind = "EXPORT" | "AMBIENT" | "PUBLIC" | "PRIVATE" | "PROTECTED" | "STATIC" | "READONLY" | "ABSTRACT" | "ASYNC" | "DEFAULT";

// ##############################
// Base
// ##############################
export interface SimpleTypeBase {
	readonly kind: SimpleTypeKind;
	readonly name?: string;
}

// ##############################
// Primitive Types
// ##############################
export interface SimpleTypeBigIntLiteral extends SimpleTypeBase {
	readonly kind: "BIG_INT_LITERAL";
	readonly value: bigint;
}

export interface SimpleTypeStringLiteral extends SimpleTypeBase {
	readonly kind: "STRING_LITERAL";
	readonly value: string;
}

export interface SimpleTypeNumberLiteral extends SimpleTypeBase {
	readonly kind: "NUMBER_LITERAL";
	readonly value: number;
}

export interface SimpleTypeBooleanLiteral extends SimpleTypeBase {
	readonly kind: "BOOLEAN_LITERAL";
	readonly value: boolean;
}

export interface SimpleTypeString extends SimpleTypeBase {
	readonly kind: "STRING";
}

export interface SimpleTypeNumber extends SimpleTypeBase {
	readonly kind: "NUMBER";
}

export interface SimpleTypeBoolean extends SimpleTypeBase {
	readonly kind: "BOOLEAN";
}

export interface SimpleTypeBigInt extends SimpleTypeBase {
	readonly kind: "BIG_INT";
}

export interface SimpleTypeESSymbol extends SimpleTypeBase {
	readonly kind: "ES_SYMBOL";
}

export interface SimpleTypeESSymbolUnique extends SimpleTypeBase {
	readonly kind: "ES_SYMBOL_UNIQUE";
	readonly value: string;
}

// ##############################
// TS-specific types
// ##############################

export interface SimpleTypeNull extends SimpleTypeBase {
	readonly kind: "NULL";
}

export interface SimpleTypeNever extends SimpleTypeBase {
	readonly kind: "NEVER";
}

export interface SimpleTypeUndefined extends SimpleTypeBase {
	readonly kind: "UNDEFINED";
}

export interface SimpleTypeAny extends SimpleTypeBase {
	readonly kind: "ANY";
}

export interface SimpleTypeUnknown extends SimpleTypeBase {
	readonly kind: "UNKNOWN";
}

export interface SimpleTypeVoid extends SimpleTypeBase {
	readonly kind: "VOID";
}

export interface SimpleTypeNonPrimitive extends SimpleTypeBase {
	readonly kind: "NON_PRIMITIVE";
}

export interface SimpleTypeEnumMember extends SimpleTypeBase {
	readonly kind: "ENUM_MEMBER";
	readonly fullName: string;
	readonly name: string;
	readonly type: SimpleTypePrimitive;
}

export interface SimpleTypeEnum extends SimpleTypeBase {
	readonly name: string;
	readonly kind: "ENUM";
	readonly types: SimpleTypeEnumMember[];
}

// ##############################
// Structure Types
// ##############################
export interface SimpleTypeUnion extends SimpleTypeBase {
	readonly kind: "UNION";
	readonly types: SimpleType[];
}

export interface SimpleTypeIntersection extends SimpleTypeBase {
	readonly kind: "INTERSECTION";
	readonly types: SimpleType[];
}

// ##############################
// Object Types
// ##############################

export interface SimpleTypeMember {
	readonly optional: boolean;
	readonly type: SimpleType;
	readonly modifiers?: SimpleTypeModifierKind[];
}

export interface SimpleTypeMemberNamed extends SimpleTypeMember {
	readonly name: string;
}

export interface SimpleTypeObjectTypeBase extends SimpleTypeBase {
	readonly members?: SimpleTypeMemberNamed[];
	readonly ctor?: SimpleTypeFunction;
	readonly call?: SimpleTypeFunction;
	readonly typeParameters?: SimpleTypeGenericParameter[];
	readonly indexType?: {
		["STRING"]?: SimpleType;
		["NUMBER"]?: SimpleType;
	};
}

export interface SimpleTypeInterface extends SimpleTypeObjectTypeBase {
	readonly kind: "INTERFACE";
}

export interface SimpleTypeClass extends SimpleTypeObjectTypeBase {
	readonly kind: "CLASS";
}

export interface SimpleTypeObject extends SimpleTypeObjectTypeBase {
	readonly kind: "OBJECT";
}

// ##############################
// Callable
// ##############################

export interface SimpleTypeFunctionParameter {
	readonly name: string;
	readonly type: SimpleType;
	readonly optional: boolean;
	readonly rest: boolean;
	readonly initializer: boolean;
}

export interface SimpleTypeFunction extends SimpleTypeBase {
	readonly kind: "FUNCTION";
	readonly parameters?: SimpleTypeFunctionParameter[];
	readonly typeParameters?: SimpleTypeGenericParameter[];
	readonly returnType?: SimpleType;
}

export interface SimpleTypeMethod extends SimpleTypeBase {
	readonly kind: "METHOD";
	readonly parameters: SimpleTypeFunctionParameter[];
	readonly typeParameters?: SimpleTypeGenericParameter[];
	readonly returnType: SimpleType;
}

// ##############################
// Generics
// ##############################

export interface SimpleTypeGenericArguments extends SimpleTypeBase {
	readonly kind: "GENERIC_ARGUMENTS";
	readonly name?: undefined;
	readonly target: SimpleType;
	readonly typeArguments: SimpleType[];
}

export interface SimpleTypeGenericParameter extends SimpleTypeBase {
	readonly name: string;
	readonly kind: "GENERIC_PARAMETER";
	readonly default?: SimpleType;
}

export interface SimpleTypeAlias extends SimpleTypeBase {
	readonly kind: "ALIAS";
	readonly name: string;
	readonly target: SimpleType;
	readonly typeParameters?: SimpleTypeGenericParameter[];
}

// ##############################
// Lists
// ##############################

export interface SimpleTypeTuple extends SimpleTypeBase {
	readonly kind: "TUPLE";
	readonly members: SimpleTypeMember[];
	readonly rest?: boolean;
}

export interface SimpleTypeArray extends SimpleTypeBase {
	readonly kind: "ARRAY";
	readonly type: SimpleType;
}

// ##############################
// Special Types
// ##############################

export interface SimpleTypeDate extends SimpleTypeBase {
	readonly kind: "DATE";
}

export interface SimpleTypePromise extends SimpleTypeBase {
	readonly kind: "PROMISE";
	readonly type: SimpleType;
}

export type SimpleType =
	| SimpleTypeBigIntLiteral
	| SimpleTypeEnumMember
	| SimpleTypeEnum
	| SimpleTypeClass
	| SimpleTypeFunction
	| SimpleTypeObject
	| SimpleTypeInterface
	| SimpleTypeTuple
	| SimpleTypeArray
	| SimpleTypeUnion
	| SimpleTypeIntersection
	| SimpleTypeStringLiteral
	| SimpleTypeNumberLiteral
	| SimpleTypeBooleanLiteral
	| SimpleTypeESSymbolUnique
	| SimpleTypeString
	| SimpleTypeNumber
	| SimpleTypeBoolean
	| SimpleTypeBigInt
	| SimpleTypeESSymbol
	| SimpleTypeNull
	| SimpleTypeUndefined
	| SimpleTypeNever
	| SimpleTypeAny
	| SimpleTypeMethod
	| SimpleTypeVoid
	| SimpleTypeNonPrimitive
	| SimpleTypePromise
	| SimpleTypeUnknown
	| SimpleTypeAlias
	| SimpleTypeDate
	| SimpleTypeGenericArguments
	| SimpleTypeGenericParameter;

// Collect all values on place. This is a map so Typescript will complain if we forget any kind.
const SIMPLE_TYPE_MAP: Record<SimpleTypeKind, "primitive" | "primitive_literal" | undefined> = {
	NUMBER_LITERAL: "primitive_literal",
	STRING_LITERAL: "primitive_literal",
	BIG_INT_LITERAL: "primitive_literal",
	BOOLEAN_LITERAL: "primitive_literal",
	ES_SYMBOL_UNIQUE: "primitive_literal",
	BIG_INT: "primitive",
	BOOLEAN: "primitive",
	NULL: "primitive",
	UNDEFINED: "primitive",
	VOID: "primitive",
	ES_SYMBOL: "primitive",
	NUMBER: "primitive",
	STRING: "primitive",
	NON_PRIMITIVE: undefined,
	ENUM_MEMBER: undefined,
	ALIAS: undefined,
	ANY: undefined,
	ARRAY: undefined,
	CLASS: undefined,
	DATE: undefined,
	ENUM: undefined,
	FUNCTION: undefined,
	GENERIC_ARGUMENTS: undefined,
	GENERIC_PARAMETER: undefined,
	INTERFACE: undefined,
	INTERSECTION: undefined,
	METHOD: undefined,
	NEVER: undefined,
	OBJECT: undefined,
	PROMISE: undefined,
	TUPLE: undefined,
	UNION: undefined,
	UNKNOWN: undefined
};

// Primitive, literal
export type SimpleTypeLiteral = SimpleTypeBigIntLiteral | SimpleTypeBooleanLiteral | SimpleTypeStringLiteral | SimpleTypeNumberLiteral | SimpleTypeESSymbolUnique;
export const LITERAL_TYPE_KINDS: SimpleTypeKind[] = (Object.keys(SIMPLE_TYPE_MAP) as SimpleTypeKind[]).filter(kind => SIMPLE_TYPE_MAP[kind] === "primitive_literal");
export function isSimpleTypeLiteral(type: SimpleType): type is SimpleTypeLiteral {
	return LITERAL_TYPE_KINDS.includes(type.kind);
}

// Primitive
export type SimpleTypePrimitive = SimpleTypeLiteral | SimpleTypeString | SimpleTypeNumber | SimpleTypeBoolean | SimpleTypeBigInt | SimpleTypeNull | SimpleTypeUndefined | SimpleTypeESSymbol;
export const PRIMITIVE_TYPE_KINDS: SimpleTypeKind[] = [...LITERAL_TYPE_KINDS, ...(Object.keys(SIMPLE_TYPE_MAP) as SimpleTypeKind[]).filter(kind => SIMPLE_TYPE_MAP[kind] === "primitive")];
export function isSimpleTypePrimitive(type: SimpleType): type is SimpleTypePrimitive {
	return PRIMITIVE_TYPE_KINDS.includes(type.kind);
}

// All kinds
export const SIMPLE_TYPE_KINDS = Object.keys(SIMPLE_TYPE_MAP) as SimpleTypeKind[];
export function isSimpleType(type: unknown): type is SimpleType {
	return typeof type === "object" && type != null && "kind" in type && Object.values(SIMPLE_TYPE_KINDS).find((key: SimpleTypeKind) => key === (type as { kind: SimpleTypeKind }).kind) != null;
}

export type SimpleTypeKindMap = {
	STRING_LITERAL: SimpleTypeStringLiteral;
	NUMBER_LITERAL: SimpleTypeNumberLiteral;
	BOOLEAN_LITERAL: SimpleTypeBooleanLiteral;
	BIG_INT_LITERAL: SimpleTypeBigIntLiteral;
	ES_SYMBOL_UNIQUE: SimpleTypeESSymbolUnique;
	STRING: SimpleTypeString;
	NUMBER: SimpleTypeNumber;
	BOOLEAN: SimpleTypeBoolean;
	BIG_INT: SimpleTypeBigInt;
	ES_SYMBOL: SimpleTypeESSymbol;
	NULL: SimpleTypeNull;
	UNDEFINED: SimpleTypeUndefined;
	VOID: SimpleTypeVoid;
	NEVER: SimpleTypeNever;
	ANY: SimpleTypeAny;
	UNKNOWN: SimpleTypeUnknown;
	ENUM: SimpleTypeEnum;
	ENUM_MEMBER: SimpleTypeEnumMember;
	NON_PRIMITIVE: SimpleTypeNonPrimitive;
	UNION: SimpleTypeUnion;
	INTERSECTION: SimpleTypeIntersection;
	INTERFACE: SimpleTypeInterface;
	OBJECT: SimpleTypeObject;
	CLASS: SimpleTypeClass;
	FUNCTION: SimpleTypeFunction;
	METHOD: SimpleTypeMethod;
	GENERIC_ARGUMENTS: SimpleTypeGenericArguments;
	GENERIC_PARAMETER: SimpleTypeGenericParameter;
	ALIAS: SimpleTypeAlias;
	TUPLE: SimpleTypeTuple;
	ARRAY: SimpleTypeArray;
	DATE: SimpleTypeDate;
	PROMISE: SimpleTypePromise;
};
