import { SimpleType } from "../simple-type";

export interface SimpleTypeBaseOptions {}

export interface SimpleTypeComparisonOptions extends SimpleTypeBaseOptions {
	strict?: boolean;
	strictNullChecks?: boolean;
	strictFunctionTypes?: boolean;
	noStrictGenericChecks?: boolean;
	isAssignable?: (typeA: SimpleType, typeB: SimpleType, options: SimpleTypeComparisonOptions) => boolean | undefined | void;
	debug?: boolean;
	debugLog?: (text: string) => void;
	cache?: WeakMap<SimpleType, WeakMap<SimpleType, boolean>>;
	maxDepth?: number;
	maxOps?: number;
}

export interface SimpleTypeKindComparisonOptions extends SimpleTypeBaseOptions {
	matchAny?: boolean;
}
