import { Type, TypeChecker } from "typescript";
import { isSimpleType, SimpleType, SimpleTypeKind } from "../simple-type";
import { toSimpleType } from "../transform/to-simple-type";
import { and, or } from "../utils/list-util";
import { isTypeChecker } from "../utils/ts-util";

export interface SimpleTypeKindComparisonOptions {
	op?: "and" | "or";
	matchAny?: boolean;
}

/**
 * Checks if a simple type kind is assignable to a type.
 * @param type The type to check
 * @param kind The simple type kind to check
 * @param kind The simple type kind to check
 * @param checker TypeCHecker if type is a typescript type
 * @param options Options
 */
export function isAssignableToSimpleTypeKind(type: SimpleType, kind: SimpleTypeKind | SimpleTypeKind[], options?: SimpleTypeKindComparisonOptions): boolean;
export function isAssignableToSimpleTypeKind(type: Type, kind: SimpleTypeKind | SimpleTypeKind[], checker: TypeChecker, options?: SimpleTypeKindComparisonOptions): boolean;
export function isAssignableToSimpleTypeKind(type: Type | SimpleType, kind: SimpleTypeKind | SimpleTypeKind[], checker: TypeChecker, options?: SimpleTypeKindComparisonOptions): boolean;
export function isAssignableToSimpleTypeKind(
	type: Type | SimpleType,
	kind: SimpleTypeKind | SimpleTypeKind[],
	optionsOrChecker?: TypeChecker | SimpleTypeKindComparisonOptions,
	options: SimpleTypeKindComparisonOptions = {}
): boolean {
	if (!isSimpleType(type)) {
		return isAssignableToSimpleTypeKind(toSimpleType(type, optionsOrChecker as TypeChecker), kind, options);
	}

	options = (isTypeChecker(optionsOrChecker) ? options : optionsOrChecker) || {};

	switch (type.kind) {
		// Make sure that an object without members are treated as ANY
		case "OBJECT": {
			if (type.members == null || type.members.length === 0) {
				return isAssignableToSimpleTypeKind({ kind: "ANY" }, kind, options);
			}
			break;
		}

		case "ANY": {
			if (options.matchAny) {
				return true;
			}
			break;
		}

		case "LAZY": {
			return isAssignableToSimpleTypeKind(type.type(), kind, options);
		}

		case "ENUM":
		case "UNION": {
			return or(type.types, childType => isAssignableToSimpleTypeKind(childType, kind, options));
		}

		case "INTERSECTION": {
			return and(type.types, childType => isAssignableToSimpleTypeKind(childType, kind, options));
		}

		case "ENUM_MEMBER": {
			return isAssignableToSimpleTypeKind(type.type, kind, options);
		}

		case "ALIAS": {
			return isAssignableToSimpleTypeKind(type.target, kind, options);
		}

		case "GENERIC_PARAMETER": {
			return isAssignableToSimpleTypeKind(type.default || { kind: "ANY" }, kind, options);
		}
	}

	if (Array.isArray(kind)) {
		return (options.op === "or" ? or : and)(kind, itemKind => type.kind === itemKind);
	}

	return type.kind === kind;
}
