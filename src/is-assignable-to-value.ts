import { Type, TypeChecker } from "typescript";
import { SimpleType, isSimpleType, SimpleTypeKind } from "./simple-type";
import { toSimpleType } from "./to-simple-type";
import { isAssignableToType } from "./is-assignable-to-type";

/**
 * Tests if a type is assignable to a value.
 * Tests "type = value" in strict mode.
 * @param type The type to test.
 * @param value The value to test.
 */
export function isAssignableToValue(type: SimpleType, value: any): boolean;
export function isAssignableToValue(type: Type, value: any, checker: TypeChecker): boolean;
export function isAssignableToValue(type: SimpleType | Type, value: any, checker: TypeChecker): boolean;
export function isAssignableToValue(type: SimpleType | Type, value: any, checker?: TypeChecker): boolean {
	if (isSimpleType(type)) {
		if (typeof value === "string") {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.STRING_LITERAL,
				value
			});
		} else if (typeof value === "number") {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.NUMBER_LITERAL,
				value
			});
		} else if (typeof value === "boolean") {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.BOOLEAN_LITERAL,
				value
			});
		}

		throw new Error(`Comparing type "${type.kind}" to value ${value}, type ${typeof value} not supported yet.`);
	}

	return isAssignableToValue(toSimpleType(type, checker!), value);
}
