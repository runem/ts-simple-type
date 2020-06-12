import { DEFAULT_GENERIC_PARAMETER_TYPE } from "../constants";
import { SimpleType, SimpleTypeGenericArguments, SimpleTypeGenericParameter } from "../simple-type";
import { extendTypeParameterMap } from "./simple-type-util";

export function resolveType(simpleType: SimpleType, parameterMap: Map<string, SimpleType> = new Map()): Exclude<SimpleType, SimpleTypeGenericParameter | SimpleTypeGenericArguments> {
	switch (simpleType.kind) {
		case "GENERIC_PARAMETER": {
			const resolvedArgument = parameterMap?.get(simpleType.name);
			return resolveType(resolvedArgument || /*simpleType.default ||*/ DEFAULT_GENERIC_PARAMETER_TYPE, parameterMap);
		}
		case "GENERIC_ARGUMENTS": {
			const updatedGenericParameterMap = extendTypeParameterMap(simpleType, parameterMap);
			return resolveType(simpleType.target, updatedGenericParameterMap);
		}
		default:
			return simpleType;
	}
}
