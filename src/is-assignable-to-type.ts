import { Node, Type, TypeChecker } from "typescript";
import { isAssignableToSimpleType, SimpleTypeComparisonConfig } from "./is-assignable-to-simple-type";
import { isSimpleType, SimpleType } from "./simple-type";
import { toSimpleType } from "./to-simple-type";
import { isNode, isTypeChecker } from "./ts-util";

const simpleTypeCache = new WeakMap<Type, SimpleType>();
const isAssignableTypeCache = new WeakMap<SimpleType, WeakMap<SimpleType, boolean>>();

/**
 * Tests if "typeA = typeB" in strict mode.
 * @param typeA Type A
 * @param typeB Type B
 * @param config
 */
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType, config?: SimpleTypeComparisonConfig): boolean;
export function isAssignableToType(typeA: SimpleType | Type | Node, typeB: SimpleType, checker: TypeChecker, config?: SimpleTypeComparisonConfig): boolean;
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType | Type | Node, checker: TypeChecker, config?: SimpleTypeComparisonConfig): boolean;
export function isAssignableToType(typeA: Type | Node, typeB: Type | Node, checker: TypeChecker, config?: SimpleTypeComparisonConfig): boolean;
export function isAssignableToType(typeA: Type | Node | SimpleType, typeB: Type | Node | SimpleType, checker: TypeChecker | SimpleTypeComparisonConfig, config?: SimpleTypeComparisonConfig): boolean;
export function isAssignableToType(
	typeA: Type | Node | SimpleType,
	typeB: Type | Node | SimpleType,
	checkerOrConfig?: TypeChecker | SimpleTypeComparisonConfig,
	config?: SimpleTypeComparisonConfig
): boolean {
	const checker = isTypeChecker(checkerOrConfig) ? checkerOrConfig : undefined;
	config = config || (isTypeChecker(checkerOrConfig) ? undefined : checkerOrConfig);

	if (isNode(typeA)) {
		return isAssignableToType(checker!.getTypeAtLocation(typeA), typeB, checker!);
	}

	if (isNode(typeB)) {
		return isAssignableToType(typeA, checker!.getTypeAtLocation(typeB), checker!);
	}

	const simpleTypeA = isSimpleType(typeA) ? typeA : toSimpleType(typeA, checker!, simpleTypeCache);
	const simpleTypeB = isSimpleType(typeB) ? typeB : toSimpleType(typeB, checker!, simpleTypeCache);

	const typeAResultCache = (() => {
		if (isAssignableTypeCache.has(simpleTypeA)) {
			return isAssignableTypeCache.get(simpleTypeA)!;
		}

		const newResultCache = new WeakMap<SimpleType, boolean>();
		isAssignableTypeCache.set(simpleTypeA, newResultCache);
		return newResultCache;
	})();

	if (typeAResultCache.has(simpleTypeB)) {
		return typeAResultCache.get(simpleTypeB)!;
	}

	/*console.log("Type A");
	 console.dir(simpleTypeA, { depth: 5 });
	 console.log("Type B");
	 console.dir(simpleTypeB, { depth: 5 });*/

	const result = isAssignableToSimpleType(simpleTypeA, simpleTypeB, config);

	typeAResultCache.set(simpleTypeB, result);

	return result;
}
