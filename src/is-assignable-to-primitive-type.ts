import { Type, TypeChecker } from "typescript";
import { SimpleType, PRIMITIVE_TYPE_KINDS, isSimpleType } from "./simple-type";
import { isAssignableToSimpleTypeKind } from "./is-assignable-to-simple-type-kind";

/**
 * Tests a type is assignable to a primitive type.
 * @param type The type to test.
 * @param checker TypeChecker if type is a typescript type.
 */
export function isAssignableToPrimitiveType(type: SimpleType): boolean;
export function isAssignableToPrimitiveType(type: Type, checker: TypeChecker): boolean;
export function isAssignableToPrimitiveType(type: Type | SimpleType, checker: TypeChecker): boolean;
export function isAssignableToPrimitiveType(type: Type | SimpleType, checker?: TypeChecker): boolean {
	if (isSimpleType(type)) {
		return isAssignableToSimpleTypeKind(type, PRIMITIVE_TYPE_KINDS, { op: "or", matchAny: true });
	}

	return isAssignableToSimpleTypeKind(type, PRIMITIVE_TYPE_KINDS, checker!, { op: "or", matchAny: true });
}
