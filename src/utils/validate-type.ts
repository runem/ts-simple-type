import { DEFAULT_GENERIC_PARAMETER_TYPE } from "../constants";
import { SimpleType } from "../simple-type";
import { and, or } from "./list-util";
import { extendTypeParameterMap } from "./simple-type-util";

export function validateType(type: SimpleType, callback: (simpleType: SimpleType) => boolean | undefined | void): boolean {
	return validateTypeInternal(type, callback, new Map());
}

function validateTypeInternal(type: SimpleType, callback: (simpleType: SimpleType) => boolean | undefined | void, parameterMap: Map<string, SimpleType>): boolean {
	const res = callback(type);

	if (res != null) {
		return res;
	}

	switch (type.kind) {
		case "ENUM":
		case "UNION": {
			return or(type.types, childType => validateTypeInternal(childType, callback, parameterMap));
		}

		case "ALIAS": {
			return validateTypeInternal(type.target, callback, parameterMap);
		}

		case "INTERSECTION": {
			return and(type.types, childType => validateTypeInternal(childType, callback, parameterMap));
		}

		case "GENERIC_PARAMETER": {
			const resolvedArgument = parameterMap?.get(type.name);
			return validateTypeInternal(resolvedArgument || DEFAULT_GENERIC_PARAMETER_TYPE, callback, parameterMap);
		}

		case "GENERIC_ARGUMENTS": {
			const updatedGenericParameterMap = extendTypeParameterMap(type, parameterMap);
			return validateTypeInternal(type.target, callback, updatedGenericParameterMap);
		}
	}

	return false;
}
