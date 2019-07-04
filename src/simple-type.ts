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
	kind: SimpleTypeKind;
	name?: string;
}

export interface SimpleTypeMember {
	optional: boolean;
	type: SimpleType;
}

export interface SimpleTypeMemberNamed extends SimpleTypeMember {
	name: string;
}

export interface SimpleTypeClassMember extends SimpleTypeMemberNamed {
	modifiers: SimpleTypeModifierKind[];
}

export interface SimpleTypeAlias extends SimpleTypeBase {
	kind: SimpleTypeKind.ALIAS;
	name: string;
	target: SimpleType;
	typeParameters?: SimpleTypeGenericParameter[];
}

export interface SimpleTypeDate extends SimpleTypeBase {
	kind: SimpleTypeKind.DATE;
}

export interface SimpleTypeClass extends SimpleTypeBase {
	kind: SimpleTypeKind.CLASS;
	ctor?: SimpleTypeFunction;
	typeParameters?: SimpleTypeGenericParameter[];
	properties: SimpleTypeClassMember[];
	methods: SimpleTypeClassMember[];
}

export interface SimpleTypeFunctionArgument {
	name: string;
	type: SimpleType;
	optional: boolean;
	spread: boolean;
	initializer: boolean;
}

export interface SimpleTypeFunction extends SimpleTypeBase {
	kind: SimpleTypeKind.FUNCTION;
	argTypes?: SimpleTypeFunctionArgument[];
	typeParameters?: SimpleTypeGenericParameter[];
	returnType?: SimpleType;
}

export interface SimpleTypeMethod extends SimpleTypeBase {
	kind: SimpleTypeKind.METHOD;
	argTypes: SimpleTypeFunctionArgument[];
	typeParameters?: SimpleTypeGenericParameter[];
	returnType: SimpleType;
}

export interface SimpleTypeInterface extends SimpleTypeBase {
	kind: SimpleTypeKind.INTERFACE;
	members?: SimpleTypeMemberNamed[];
}

export interface SimpleTypeGenericArguments extends SimpleTypeBase {
	kind: SimpleTypeKind.GENERIC_ARGUMENTS;
	name?: undefined;
	target: SimpleType;
	typeArguments: SimpleType[];
}

export interface SimpleTypeGenericParameter extends SimpleTypeBase {
	name: string;
	kind: SimpleTypeKind.GENERIC_PARAMETER;
	default?: SimpleType;
}

export interface SimpleTypeObject extends SimpleTypeBase {
	kind: SimpleTypeKind.OBJECT;
	members?: SimpleTypeMemberNamed[];
}

export interface SimpleTypeTuple extends SimpleTypeBase {
	kind: SimpleTypeKind.TUPLE;
	members: SimpleTypeMember[];
	hasRestElement?: boolean;
	lengthType?: SimpleType;
}

export interface SimpleTypeArray extends SimpleTypeBase {
	kind: SimpleTypeKind.ARRAY;
	type: SimpleType;
}

export interface SimpleTypePromise extends SimpleTypeBase {
	kind: SimpleTypeKind.PROMISE;
	type: SimpleType;
}

export interface SimpleTypeEnumMember extends SimpleTypeBase {
	kind: SimpleTypeKind.ENUM_MEMBER;
	fullName: string;
	name: string;
	type: SimpleTypePrimitive;
}

export interface SimpleTypeEnum extends SimpleTypeBase {
	name: string;
	kind: SimpleTypeKind.ENUM;
	types: SimpleTypeEnumMember[];
}

export interface SimpleTypeUnion extends SimpleTypeBase {
	kind: SimpleTypeKind.UNION;
	types: SimpleType[];
}

export interface SimpleTypeIntersection extends SimpleTypeBase {
	kind: SimpleTypeKind.INTERSECTION;
	types: SimpleType[];
}

export interface SimpleTypeBigIntLiteral extends SimpleTypeBase {
	kind: SimpleTypeKind.BIG_INT_LITERAL;
	value: bigint;
}

export interface SimpleTypeStringLiteral extends SimpleTypeBase {
	kind: SimpleTypeKind.STRING_LITERAL;
	value: string;
}

export interface SimpleTypeNumberLiteral extends SimpleTypeBase {
	kind: SimpleTypeKind.NUMBER_LITERAL;
	value: number;
}

export interface SimpleTypeBooleanLiteral extends SimpleTypeBase {
	kind: SimpleTypeKind.BOOLEAN_LITERAL;
	value: boolean;
}

export interface SimpleTypeString extends SimpleTypeBase {
	kind: SimpleTypeKind.STRING;
}

export interface SimpleTypeNumber extends SimpleTypeBase {
	kind: SimpleTypeKind.NUMBER;
}

export interface SimpleTypeBoolean extends SimpleTypeBase {
	kind: SimpleTypeKind.BOOLEAN;
}

export interface SimpleTypeBigInt extends SimpleTypeBase {
	kind: SimpleTypeKind.BIG_INT;
}

export interface SimpleTypeNull extends SimpleTypeBase {
	kind: SimpleTypeKind.NULL;
}

export interface SimpleTypeNever extends SimpleTypeBase {
	kind: SimpleTypeKind.NEVER;
}

export interface SimpleTypeUndefined extends SimpleTypeBase {
	kind: SimpleTypeKind.UNDEFINED;
}

export interface SimpleTypeAny extends SimpleTypeBase {
	kind: SimpleTypeKind.ANY;
}

export interface SimpleTypeUnknown extends SimpleTypeBase {
	kind: SimpleTypeKind.UNKNOWN;
}

export interface SimpleTypeVoid extends SimpleTypeBase {
	kind: SimpleTypeKind.VOID;
}

export interface SimpleTypeCircularRef extends SimpleTypeBase {
	kind: SimpleTypeKind.CIRCULAR_TYPE_REF;
	ref: SimpleType;
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
	return typeof type === "object" && "kind" in type && Object.keys(SimpleTypeKind).find((key: string) => SimpleTypeKind[key as any] === type.kind) != null;
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
	SimpleTypeKind.UNDEFINED
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

export const IMPLICIT_GENERIC = [SimpleTypeKind.ARRAY, SimpleTypeKind.TUPLE, SimpleTypeKind.PROMISE];

export function isImplicitGenericType(type: SimpleType): type is SimpleTypeArray | SimpleTypeTuple | SimpleTypePromise {
	return IMPLICIT_GENERIC.includes(type.kind);
}
