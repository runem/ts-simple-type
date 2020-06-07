import { Type, TypeChecker } from "typescript";
import { isSimpleType, SimpleType, SimpleTypeMemberNamed } from "../simple-type";
import { toSimpleType } from "../transform/to-simple-type";
import { isAssignableToType } from "./is-assignable-to-type";

/**
 * Tests if a type is assignable to a value.
 * Tests "type = value" in strict mode.
 * @param type The type to test.
 * @param value The value to test.
 */
export function isAssignableToValue(type: SimpleType, value: unknown): boolean;
export function isAssignableToValue(type: Type, value: unknown, checker: TypeChecker): boolean;
export function isAssignableToValue(type: SimpleType | Type, value: unknown, checker: TypeChecker): boolean;
export function isAssignableToValue(type: SimpleType | Type, value: unknown, checker?: TypeChecker): boolean {
	if (isSimpleType(type)) {
		const typeB = convertValueToSimpleType(value, { visitValueSet: new Set(), widening: false });

		return isAssignableToType(type, typeB, { strict: true });
	}

	return isAssignableToValue(toSimpleType(type, checker as TypeChecker), value);
}

function convertValueToSimpleType(value: unknown, { visitValueSet, widening }: { visitValueSet: Set<unknown>; widening: boolean }): SimpleType {
	if (visitValueSet.has(value)) {
		return { kind: "ANY" };
	}

	if (value === undefined) {
		return {
			kind: "UNDEFINED"
		};
	} else if (value === null) {
		return {
			kind: "NULL"
		};
	} else if (typeof value === "string") {
		if (widening) {
			return { kind: "STRING" };
		}

		return {
			kind: "STRING_LITERAL",
			value
		};
	} else if (typeof value === "number") {
		if (widening) {
			return { kind: "NUMBER" };
		}

		return {
			kind: "NUMBER_LITERAL",
			value
		};
	} else if (typeof value === "boolean") {
		if (widening) {
			return { kind: "BOOLEAN" };
		}

		return {
			kind: "BOOLEAN_LITERAL",
			value
		};
	} else if (typeof value === "symbol") {
		if (widening) {
			return { kind: "ES_SYMBOL" };
		}

		return {
			kind: "ES_SYMBOL_UNIQUE",
			value: Math.random().toString()
		};
	} else if (Array.isArray(value)) {
		visitValueSet.add(value);

		const firstElement = value[0];
		if (firstElement != null) {
			return { kind: "ARRAY", type: convertValueToSimpleType(firstElement, { visitValueSet, widening: true }) };
		}
		return {
			kind: "ARRAY",
			type: { kind: "ANY" }
		};
	} else if (value instanceof Promise) {
		return {
			kind: "PROMISE",
			type: { kind: "ANY" }
		};
	} else if (value instanceof Date) {
		return {
			kind: "DATE"
		};
	} else if (typeof value === "object" && value != null) {
		visitValueSet.add(value);

		const members = Object.entries(value).map(
			([key, value]) =>
				({
					name: key,
					type: convertValueToSimpleType(value, { visitValueSet, widening })
				} as SimpleTypeMemberNamed)
		);

		return {
			kind: "OBJECT",
			members
		};
	}

	return { kind: "ANY" };
}
