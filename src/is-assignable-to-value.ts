import { Type, TypeChecker } from "typescript";
import { isAssignableToType } from "./is-assignable-to-type";
import { isSimpleType, SimpleType, SimpleTypeKind } from "./simple-type";
import { toSimpleType } from "./to-simple-type";

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
			}, {strict: true});
		} else if (typeof value === "number") {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.NUMBER_LITERAL,
				value
			}, {strict: true});
		} else if (typeof value === "boolean") {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.BOOLEAN_LITERAL,
				value
			}, {strict: true});
		} else if (value instanceof Promise) {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.PROMISE,
				type: { kind: SimpleTypeKind.ANY }
			}, {strict: true});
		} else if (value instanceof Date) {
			return isAssignableToType(type, {
				kind: SimpleTypeKind.DATE
			}, {strict: true});
		}

		throw new Error(`Comparing type "${type.kind}" to value ${value}, type ${typeof value} not supported yet.`);
	}

	return isAssignableToValue(toSimpleType(type, checker!), value);
}
