import { SimpleType } from "./simple-type";

export interface SimpleTypeComparisonOptions {
	strict?: boolean;
	strictNullChecks?: boolean;
	strictFunctionTypes?: boolean;
	noStrictGenericChecks?: boolean;
	isAssignable?: (typeA: SimpleType, typeB: SimpleType, options: SimpleTypeComparisonOptions) => boolean | undefined | void;
}
