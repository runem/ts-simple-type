import { Type, TypeChecker, Node } from "typescript";
import { toSimpleType } from "./to-simple-type";
import { isAssignableToSimpleType } from "./is-assignable-to-simple-type";
import { SimpleType, isSimpleType } from "./simple-type";
import { isNode } from "./ts-util";

const simpleTypeCache = new WeakMap<Type, SimpleType>();
const isAssignableTypeCache = new WeakMap<SimpleType, WeakMap<SimpleType, boolean>>();

/**
 * Test if typeB is assignable to type B.
 * Tests if "typeA = typeB" in strict mode.
 * @param typeA Type A
 * @param typeB Type B
 * @param checker TypeChecker
 */
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType): boolean;
export function isAssignableToType(typeA: SimpleType | Type | Node, typeB: SimpleType, checker: TypeChecker): boolean;
export function isAssignableToType(typeA: SimpleType, typeB: SimpleType | Type | Node, checker: TypeChecker): boolean;
export function isAssignableToType(typeA: Type | Node, typeB: Type | Node, checker: TypeChecker): boolean;
export function isAssignableToType(typeA: Type | Node | SimpleType, typeB: Type | Node | SimpleType, checker: TypeChecker): boolean;
export function isAssignableToType(typeA: Type | Node | SimpleType, typeB: Type | Node | SimpleType, checker?: TypeChecker): boolean {
	if (isNode(typeA)) {
		return isAssignableToType(checker!.getTypeAtLocation(typeA), typeB, checker!);
	}

	if (isNode(typeB)) {
		return isAssignableToType(typeA, checker!.getTypeAtLocation(typeB), checker!);
	}


	if (typeA === typeB) return true;

	const simpleTypeA = isSimpleType(typeA) ? typeA : simpleTypeCache.has(typeA) ? simpleTypeCache.get(typeA)! : toSimpleType(typeA, checker!, simpleTypeCache);
	const simpleTypeB = isSimpleType(typeB) ? typeB : simpleTypeCache.has(typeB) ? simpleTypeCache.get(typeB)! : toSimpleType(typeB, checker!, simpleTypeCache);

	if (!isSimpleType(typeA)) {
		simpleTypeCache.set(typeA, simpleTypeA);
	}

	if (!isSimpleType(typeB)) {
		simpleTypeCache.set(typeB, simpleTypeB);
	}

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
	console.dir(simpleTypeA, { depth: 10 });
	console.log("Type B");
	console.dir(simpleTypeB, { depth: 10 });*/

	const result = isAssignableToSimpleType(simpleTypeA, simpleTypeB);

	typeAResultCache.set(simpleTypeB, result);

	return result;
}
