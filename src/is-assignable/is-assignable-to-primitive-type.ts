import { Type, TypeChecker } from "typescript";
import { PRIMITIVE_TYPE_KINDS, SimpleType } from "../simple-type";
import { isTypeChecker } from "../utils/ts-util";
import { isAssignableToSimpleTypeKind } from "./is-assignable-to-simple-type-kind";

/**
 * Tests a type is assignable to a primitive type.
 * @param type The type to test.
 * @param options
 */
export function isAssignableToPrimitiveType(type: SimpleType): boolean;
export function isAssignableToPrimitiveType(type: Type | SimpleType, checker: TypeChecker): boolean;
export function isAssignableToPrimitiveType(type: Type | SimpleType, checkerOrOptions?: TypeChecker): boolean {
	const checker = isTypeChecker(checkerOrOptions) ? checkerOrOptions : undefined;
	return isAssignableToSimpleTypeKind(type, PRIMITIVE_TYPE_KINDS, checker!, { matchAny: true });
}
