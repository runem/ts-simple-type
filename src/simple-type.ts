export enum SimpleTypeKind {
	STRING_LITERAL = "STRING_LITERAL",
	NUMBER_LITERAL = "NUMBER_LITERAL",
	BOOLEAN_LITERAL = "BOOLEAN_LITERAL",
	BIG_INT_LITERAL = "BIG_INT_LITERAL",
	STRING = "STRING",
	NUMBER = "NUMBER",
	BOOLEAN = "BOOLEAN",
	BIG_INT = "BIG_INT",
	NULL = "NULL",
	UNDEFINED = "UNDEFINED",
	NEVER = "NEVER",
	ANY = "ANY",
	UNKNOWN = "UNKNOWN",
	VOID = "VOID",
	UNION = "UNION",
	ENUM = "ENUM",
	ENUM_MEMBER = "ENUM_MEMBER",
	INTERSECTION = "INTERSECTION",
	TUPLE = "TUPLE",
	INTERFACE = "INTERFACE",
	OBJECT = "OBJECT",
	FUNCTION = "FUNCTION",
	METHOD = "METHOD",
	CLASS = "CLASS",
	CIRCULAR_TYPE_REF = "CIRCULAR_TYPE_REF",
	GENERIC_ARGUMENTS = "GENERIC_ARGUMENTS",
	GENERIC_PARAMETER = "GENERIC_PARAMETER",
	ALIAS = "ALIAS",
	DATE = "DATE",
	ARRAY = "ARRAY",
	PROMISE = "PROMISE"
}

export enum SimpleTypeModifierKind {
	EXPORT = "EXPORT",
	AMBIENT = "AMBIENT",
	PUBLIC = "PUBLIC",
	PRIVATE = "PRIVATE",
	PROTECTED = "PROTECTED",
	STATIC = "STATIC",
	READONLY = "READONLY",
	ABSTRACT = "ABSTRACT",
	ASYNC = "ASYNC",
	DEFAULT = "DEFAULT"
}

export interface SimpleTypeBase {
	readonly kind: SimpleTypeKind;
	readonly name?: string;
}

export interface SimpleTypeMember {
	readonly optional: boolean;
	readonly type: SimpleType;
}

export interface SimpleTypeMemberNamed extends SimpleTypeMember {
	readonly name: string;
}

export interface SimpleTypeClassMember extends SimpleTypeMemberNamed {
	readonly modifiers: SimpleTypeModifierKind[];
}

export interface SimpleTypeAlias extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.ALIAS;
	readonly name: string;
	readonly target: SimpleType;
	readonly typeParameters?: SimpleTypeGenericParameter[];
}

export interface SimpleTypeDate extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.DATE;
}

export interface SimpleTypeClass extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.CLASS;
	readonly ctor?: SimpleTypeFunction;
	readonly typeParameters?: SimpleTypeGenericParameter[];
	readonly properties: SimpleTypeClassMember[];
	readonly methods: SimpleTypeClassMember[];
}

export interface SimpleTypeFunctionArgument {
	readonly name: string;
	readonly type: SimpleType;
	readonly optional: boolean;
	readonly spread: boolean;
	readonly initializer: boolean;
}

export interface SimpleTypeFunction extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.FUNCTION;
	readonly argTypes?: SimpleTypeFunctionArgument[];
	readonly typeParameters?: SimpleTypeGenericParameter[];
	readonly returnType?: SimpleType;
}

export interface SimpleTypeMethod extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.METHOD;
	readonly argTypes: SimpleTypeFunctionArgument[];
	readonly typeParameters?: SimpleTypeGenericParameter[];
	readonly returnType: SimpleType;
}

export interface SimpleTypeInterface extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.INTERFACE;
	readonly members?: SimpleTypeMemberNamed[];
}

export interface SimpleTypeGenericArguments extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.GENERIC_ARGUMENTS;
	readonly name?: undefined;
	readonly target: SimpleType;
	readonly typeArguments: SimpleType[];
}

export interface SimpleTypeGenericParameter extends SimpleTypeBase {
	readonly name: string;
	readonly kind: SimpleTypeKind.GENERIC_PARAMETER;
	readonly default?: SimpleType;
}

export interface SimpleTypeObject extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.OBJECT;
	readonly members?: SimpleTypeMemberNamed[];
}

export interface SimpleTypeTuple extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.TUPLE;
	readonly members: SimpleTypeMember[];
	readonly hasRestElement?: boolean;
}

export interface SimpleTypeArray extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.ARRAY;
	readonly type: SimpleType;
}

export interface SimpleTypePromise extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.PROMISE;
	readonly type: SimpleType;
}

export interface SimpleTypeEnumMember extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.ENUM_MEMBER;
	readonly fullName: string;
	readonly name: string;
	readonly type: SimpleTypePrimitive;
}

export interface SimpleTypeEnum extends SimpleTypeBase {
	readonly name: string;
	readonly kind: SimpleTypeKind.ENUM;
	readonly types: SimpleTypeEnumMember[];
}

export interface SimpleTypeUnion extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.UNION;
	readonly types: SimpleType[];
}

export interface SimpleTypeIntersection extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.INTERSECTION;
	readonly types: SimpleType[];
}

export interface SimpleTypeBigIntLiteral extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.BIG_INT_LITERAL;
	readonly value: bigint;
}

export interface SimpleTypeStringLiteral extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.STRING_LITERAL;
	readonly value: string;
}

export interface SimpleTypeNumberLiteral extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.NUMBER_LITERAL;
	readonly value: number;
}

export interface SimpleTypeBooleanLiteral extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.BOOLEAN_LITERAL;
	readonly value: boolean;
}

export interface SimpleTypeString extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.STRING;
}

export interface SimpleTypeNumber extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.NUMBER;
}

export interface SimpleTypeBoolean extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.BOOLEAN;
}

export interface SimpleTypeBigInt extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.BIG_INT;
}

export interface SimpleTypeNull extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.NULL;
}

export interface SimpleTypeNever extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.NEVER;
}

export interface SimpleTypeUndefined extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.UNDEFINED;
}

export interface SimpleTypeAny extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.ANY;
}

export interface SimpleTypeUnknown extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.UNKNOWN;
}

export interface SimpleTypeVoid extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.VOID;
}

export interface SimpleTypeCircularRef extends SimpleTypeBase {
	readonly kind: SimpleTypeKind.CIRCULAR_TYPE_REF;
	readonly ref: SimpleType;
}

export type SimpleType =
	| SimpleTypeBigIntLiteral
	| SimpleTypeEnumMember
	| SimpleTypeEnum
	| SimpleTypeCircularRef
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
	| SimpleTypeString
	| SimpleTypeNumber
	| SimpleTypeBoolean
	| SimpleTypeBigInt
	| SimpleTypeNull
	| SimpleTypeUndefined
	| SimpleTypeNever
	| SimpleTypeAny
	| SimpleTypeMethod
	| SimpleTypeVoid
	| SimpleTypePromise
	| SimpleTypeUnknown
	| SimpleTypeAlias
	| SimpleTypeDate
	| SimpleTypeGenericArguments
	| SimpleTypeGenericParameter;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function isSimpleType(type: any): type is SimpleType {
	return typeof type === "object" && "kind" in type && Object.values(SimpleTypeKind).find((key: SimpleTypeKind) => key === type.kind) != null;
}

export type SimpleTypeLiteral = SimpleTypeBigIntLiteral | SimpleTypeBooleanLiteral | SimpleTypeStringLiteral | SimpleTypeNumberLiteral;

export const LITERAL_TYPE_KINDS = [SimpleTypeKind.STRING_LITERAL, SimpleTypeKind.NUMBER_LITERAL, SimpleTypeKind.BOOLEAN_LITERAL, SimpleTypeKind.BIG_INT_LITERAL];

export function isSimpleTypeLiteral(type: SimpleType): type is SimpleTypeLiteral {
	return LITERAL_TYPE_KINDS.includes(type.kind);
}

export type SimpleTypePrimitive = SimpleTypeLiteral | SimpleTypeString | SimpleTypeNumber | SimpleTypeBoolean | SimpleTypeBigInt | SimpleTypeNull | SimpleTypeUndefined;

export const PRIMITIVE_TYPE_KINDS = [
	...LITERAL_TYPE_KINDS,
	SimpleTypeKind.STRING,
	SimpleTypeKind.NUMBER,
	SimpleTypeKind.BOOLEAN,
	SimpleTypeKind.BIG_INT,
	SimpleTypeKind.NULL,
	SimpleTypeKind.UNDEFINED,
	SimpleTypeKind.VOID
];

export function isSimpleTypePrimitive(type: SimpleType): type is SimpleTypePrimitive {
	return PRIMITIVE_TYPE_KINDS.includes(type.kind);
}

export const PRIMITIVE_TYPE_TO_LITERAL_MAP = ({
	[SimpleTypeKind.STRING]: SimpleTypeKind.STRING_LITERAL,
	[SimpleTypeKind.NUMBER]: SimpleTypeKind.NUMBER_LITERAL,
	[SimpleTypeKind.BOOLEAN]: SimpleTypeKind.BOOLEAN_LITERAL,
	[SimpleTypeKind.BIG_INT]: SimpleTypeKind.BIG_INT_LITERAL
} as unknown) as Record<SimpleTypeKind, SimpleTypeKind | undefined>;

export const LITERAL_TYPE_TO_PRIMITIVE_TYPE_MAP = ({
	[SimpleTypeKind.STRING_LITERAL]: SimpleTypeKind.STRING,
	[SimpleTypeKind.NUMBER_LITERAL]: SimpleTypeKind.NUMBER,
	[SimpleTypeKind.BOOLEAN_LITERAL]: SimpleTypeKind.BOOLEAN,
	[SimpleTypeKind.BIG_INT_LITERAL]: SimpleTypeKind.BIG_INT
} as unknown) as Record<SimpleTypeKind, SimpleTypeKind | undefined>;

export const IMPLICIT_GENERIC = [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE, SimpleTypeKind.PROMISE];

export function isImplicitGenericType(type: SimpleType): type is SimpleTypeArray | SimpleTypeTuple | SimpleTypePromise {
	return IMPLICIT_GENERIC.includes(type.kind);
}
