import { Type, TypeChecker } from "typescript";
import { isSimpleType, SimpleType, SimpleTypeKind } from "../simple-type";
import { toSimpleType } from "../transform/to-simple-type";
import { or } from "../utils/list-util";
import { isTypeChecker } from "../utils/ts-util";
import { validateType } from "../utils/validate-type";
import { SimpleTypeKindComparisonOptions } from "./simple-type-comparison-options";

/**
 * Checks if a simple type kind is assignable to a type.
 * @param type The type to check
 * @param kind The simple type kind to check
 * @param kind The simple type kind to check
 * @param checker TypeCHecker if type is a typescript type
 * @param options Options
 */
export function isAssignableToSimpleTypeKind(type: SimpleType, kind: SimpleTypeKind | SimpleTypeKind[], options?: SimpleTypeKindComparisonOptions): boolean;
export function isAssignableToSimpleTypeKind(type: Type | SimpleType, kind: SimpleTypeKind | SimpleTypeKind[], checker: TypeChecker, options?: SimpleTypeKindComparisonOptions): boolean;
export function isAssignableToSimpleTypeKind(
	type: Type | SimpleType,
	kind: SimpleTypeKind | SimpleTypeKind[],
	optionsOrChecker?: TypeChecker | SimpleTypeKindComparisonOptions,
	options: SimpleTypeKindComparisonOptions = {}
): boolean {
	const checker = isTypeChecker(optionsOrChecker) ? optionsOrChecker : undefined;
	options = (isTypeChecker(optionsOrChecker) || optionsOrChecker == null ? options : optionsOrChecker) || {};

	if (!isSimpleType(type)) {
		return isAssignableToSimpleTypeKind(toSimpleType(type, checker!), kind, options);
	}

	return validateType(type, simpleType => {
		if (Array.isArray(kind) && or(kind, itemKind => simpleType.kind === itemKind)) {
			return true;
		}

		if (simpleType.kind === kind) {
			return true;
		}

		switch (simpleType.kind) {
			// Make sure that an object without members are treated as ANY
			case "OBJECT": {
				if (simpleType.members == null || simpleType.members.length === 0) {
					return isAssignableToSimpleTypeKind({ kind: "ANY" }, kind, options);
				}
				break;
			}

			case "ANY": {
				return options.matchAny || false;
			}

			case "ENUM_MEMBER": {
				return isAssignableToSimpleTypeKind(simpleType.type, kind, options);
			}
		}
	});
}
