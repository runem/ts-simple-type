import { Type } from "typescript";
import { SimpleType, SimpleTypeNever, SimpleTypeUnknown } from "./simple-type";

export const DEFAULT_TYPE_CACHE = new WeakMap<Type, SimpleType>();

export const DEFAULT_RESULT_CACHE = new Map<string, WeakMap<SimpleType, WeakMap<SimpleType, boolean>>>();

export const DEFAULT_GENERIC_PARAMETER_TYPE: SimpleTypeUnknown = { kind: "UNKNOWN" };

export const NEVER_TYPE: SimpleTypeNever = { kind: "NEVER" };
