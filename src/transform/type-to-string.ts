import { Type, TypeChecker } from "typescript";
import { isSimpleType, SimpleType } from "../simple-type";
import { simpleTypeToString } from "./simple-type-to-string";

/**
 * Returns a string representation of a given type.
 * @param simpleType
 */
export function typeToString(simpleType: SimpleType): string;
export function typeToString(type: SimpleType | Type, checker: TypeChecker): string;
export function typeToString(type: SimpleType | Type, checker?: TypeChecker): string {
	if (isSimpleType(type)) {
		return simpleTypeToString(type);
	}

	// Use the typescript checker to return a string for a type
	return checker!.typeToString(type);
}
