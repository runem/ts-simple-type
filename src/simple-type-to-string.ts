import { SimpleType, SimpleTypeKind } from "./simple-type";

/**
 * Converts a simple type to a string.
 * @param type Simple Type
 */
export function simpleTypeToString(type: SimpleType): string {
	switch (type.kind) {
		case SimpleTypeKind.CIRCULAR_TYPE_REF:
			return type.ref.name || "[Circular]";
		case SimpleTypeKind.BOOLEAN_LITERAL:
			return String(type.value);
		case SimpleTypeKind.NUMBER_LITERAL:
			return String(type.value);
		case SimpleTypeKind.STRING_LITERAL:
			return `"${type.value}"`;
		case SimpleTypeKind.BIG_INT_LITERAL:
			return `${type.value}n`;
		case SimpleTypeKind.STRING:
			return "string";
		case SimpleTypeKind.BOOLEAN:
			return "boolean";
		case SimpleTypeKind.NUMBER:
			return "number";
		case SimpleTypeKind.BIG_INT:
			return "bigint";
		case SimpleTypeKind.UNDEFINED:
			return "undefined";
		case SimpleTypeKind.NULL:
			return "null";
		case SimpleTypeKind.ANY:
			return "any";
		case SimpleTypeKind.UNKNOWN:
			return "unknown";
		case SimpleTypeKind.VOID:
			return "void";
		case SimpleTypeKind.FUNCTION:
			const argText = type.argTypes
				.map(arg => {
					return `${arg.spread ? "..." : ""}${arg.name}${arg.optional ? "?" : ""}: ${simpleTypeToString(arg.type)}`;
				})
				.join(", ");
			return `(${argText})${type.returnType != null ? ` => ${simpleTypeToString(type.returnType)}` : ""}`;
		case SimpleTypeKind.ARRAY:
			const hasMultipleTypes = [SimpleTypeKind.UNION, SimpleTypeKind.INTERSECTION].includes(type.type.kind);
			let memberType = simpleTypeToString(type.type);
			if (hasMultipleTypes && type.type.name == null) memberType = `(${memberType})`;
			return `${memberType}[]`;
		case SimpleTypeKind.UNION:
			if (type.name != null) return type.name;
			return type.types.map(simpleTypeToString).join(" | ");
		case SimpleTypeKind.ENUM:
			return type.name;
		case SimpleTypeKind.ENUM_MEMBER:
			return type.fullName;
		case SimpleTypeKind.INTERSECTION:
			if (type.name != null) return type.name;
			return type.types.map(simpleTypeToString).join(" & ");
		case SimpleTypeKind.INTERFACE:
			if (type.members.length === 0) return "{}";
			if (type.name != null) return type.name;
		case SimpleTypeKind.OBJECT:
			if (type.members.length === 0) return "{}";
			return `{ ${type.members.map(member => `${member.name}: ${simpleTypeToString(member.type)}`).join("; ")}${type.members.length > 0 ? ";" : ""} }`;
		case SimpleTypeKind.TUPLE:
			return `[${type.members.map(member => `${simpleTypeToString(member.type)}${member.optional ? "?" : ""}`).join(", ")}]`;
		default:
			return type.name || "";
	}
}
