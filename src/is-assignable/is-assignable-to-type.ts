import { Node, Program, Type, TypeChecker } from "typescript";
import { isSimpleType, SimpleType } from "../simple-type";
import { toSimpleType } from "../transform/to-simple-type";
import { isNode, isProgram, isTypeChecker } from "../utils/ts-util";
import { isAssignableToSimpleType } from "./is-assignable-to-simple-type";
import { SimpleTypeComparisonOptions } from "./simple-type-comparison-options";

interface TypeCheckerWithInternals extends TypeChecker {
	isTypeAssignableTo(source: Type, target: Type): boolean;
}

/**
 * Tests if "typeA = typeB" in strict mode.
 * @param typeA - Type A
 * @param typeB - Type B
 * @param checkerOrOptions
 * @param options
 */
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(typeA: SimpleType | Type | Node, typeB: SimpleType | Type | Node, checker: TypeChecker | Program, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(typeA: Type | Node, typeB: Type | Node, checker: TypeChecker | Program, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(typeA: Type | Node | SimpleType, typeB: Type | Node | SimpleType, checker: Program | TypeChecker, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(
	typeA: Type | Node | SimpleType,
	typeB: Type | Node | SimpleType,
	checkerOrOptions?: TypeChecker | Program | SimpleTypeComparisonOptions,
	options?: SimpleTypeComparisonOptions
): boolean {
	if (typeA === typeB) return true;

	// Get the correct TypeChecker
	const checker = isTypeChecker(checkerOrOptions) ? checkerOrOptions : isProgram(checkerOrOptions) ? checkerOrOptions.getTypeChecker() : undefined;

	// Get the correct options. Potentially merge user given options with program options.
	options = {
		...(checkerOrOptions == null ? {} : isProgram(checkerOrOptions) ? checkerOrOptions.getCompilerOptions() : isTypeChecker(checkerOrOptions) ? {} : checkerOrOptions),
		...(options || {})
	};

	// Check if the types are nodes (in which case we need to get the type of the node)
	typeA = isNode(typeA) ? checker!.getTypeAtLocation(typeA) : typeA;
	typeB = isNode(typeB) ? checker!.getTypeAtLocation(typeB) : typeB;

	// Use native "isTypeAssignableTo" if both types are native TS-types and "isTypeAssignableTo" is exposed on TypeChecker
	if (!isSimpleType(typeA) && !isSimpleType(typeB) && checker != null && (checker as TypeCheckerWithInternals).isTypeAssignableTo != null) {
		return (checker as TypeCheckerWithInternals).isTypeAssignableTo(typeB, typeA);
	}

	// Convert the TS types to SimpleTypes
	const simpleTypeA = isSimpleType(typeA) ? typeA : toSimpleType(typeA, checker!);
	const simpleTypeB = isSimpleType(typeB) ? typeB : toSimpleType(typeB, checker!);

	return isAssignableToSimpleType(simpleTypeA, simpleTypeB, options);
}
