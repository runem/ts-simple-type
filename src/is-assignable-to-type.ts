import { Node, Program, Type, TypeChecker } from "typescript";
import { isAssignableToSimpleType } from "./is-assignable-to-simple-type";
import { isSimpleType, SimpleType } from "./simple-type";
import { SimpleTypeComparisonOptions } from "./simple-type-comparison-options";
import { toSimpleType } from "./to-simple-type";
import { isNode, isProgram, isTypeChecker } from "./ts-util";

const simpleTypeCache = new WeakMap<Type, SimpleType>();
const isAssignableTypeCache = new WeakMap<SimpleType, WeakMap<SimpleType, boolean>>();

/**
 * Tests if "typeA = typeB" in strict mode.
 * @param typeA - Type A
 * @param typeB - Type B
 * @param checkerOrOptions
 * @param options
 */
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(typeA: SimpleType | Type | Node, typeB: SimpleType, checker: TypeChecker | Program, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType | Type | Node, checker: TypeChecker | Program, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(typeA: Type | Node, typeB: Type | Node, checker: TypeChecker | Program, options?: SimpleTypeComparisonOptions): boolean;
export function isAssignableToType(
	typeA: Type | Node | SimpleType,
	typeB: Type | Node | SimpleType,
	checker: Program | TypeChecker | SimpleTypeComparisonOptions,
	options?: SimpleTypeComparisonOptions
): boolean;
export function isAssignableToType(
	typeA: Type | Node | SimpleType,
	typeB: Type | Node | SimpleType,
	checkerOrOptions?: TypeChecker | SimpleTypeComparisonOptions | Program,
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
	typeA = isNode(typeA) ? (checker as TypeChecker).getTypeAtLocation(typeA) : typeA;
	typeB = isNode(typeB) ? (checker as TypeChecker).getTypeAtLocation(typeB) : typeB;

	// Convert the TS types to SimpleTypes
	const simpleTypeA = isSimpleType(typeA) ? typeA : toSimpleType(typeA, checker as TypeChecker, simpleTypeCache);
	const simpleTypeB = isSimpleType(typeB) ? typeB : toSimpleType(typeB, checker as TypeChecker, simpleTypeCache);

	const typeAResultCache = (() => {
		if (isAssignableTypeCache.has(simpleTypeA)) {
			return isAssignableTypeCache.get(simpleTypeA) as WeakMap<SimpleType, boolean>;
		}

		const newResultCache = new WeakMap<SimpleType, boolean>();
		isAssignableTypeCache.set(simpleTypeA, newResultCache);
		return newResultCache;
	})();

	if (typeAResultCache.has(simpleTypeB)) {
		return typeAResultCache.get(simpleTypeB) as boolean;
	}

	/*console.log("Type A");
	 console.dir(simpleTypeA, { depth: 5 });
	 console.log("Type B");
	 console.dir(simpleTypeB, { depth: 5 });*/

	const result = isAssignableToSimpleType(simpleTypeA, simpleTypeB, options);

	typeAResultCache.set(simpleTypeB, result);

	return result;
}
