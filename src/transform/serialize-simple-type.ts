import { isSimpleType, SimpleType } from "../simple-type";

const TYPE_REF_PREFIX = "__REF__";

function isTypeRef(value: unknown): value is string {
	return typeof value === "string" && value.startsWith(TYPE_REF_PREFIX);
}

export type SerializedSimpleTypeWithRef<ST = SimpleType> = { [key in keyof ST]: ST[key] extends SimpleType ? string : SerializedSimpleTypeWithRef<ST[key]> };

export interface SerializedSimpleType {
	typeMap: Record<number, SerializedSimpleTypeWithRef>;
	type: number;
}

/**
 * Deserialize a serialized type into a SimpleType
 * @param serializedSimpleType
 */
export function deserializeSimpleType(serializedSimpleType: SerializedSimpleType): SimpleType {
	const { typeMap } = serializedSimpleType;

	// Make a map to lookup ids to get a shared SimpleType
	const deserializedTypeMap = new Map<number, SimpleType>();

	// Add an empty object for each type in the reference map.
	// These object will be filled out afterwards.
	// This is useful because it allows us to easily shared references.
	for (const typeId of Object.keys(typeMap)) {
		deserializedTypeMap.set(Number(typeId), {} as never);
	}

	// Loop through all types and deserialize them
	for (const [typeId, serializedType] of Object.entries(typeMap)) {
		const deserializedType = convertObject(serializedType, obj => {
			// Find and replace with a corresponding type in the typeMap when encountering a typeRef
			if (isTypeRef(obj)) {
				const typeId = Number(obj.replace(TYPE_REF_PREFIX, ""));
				return deserializedTypeMap.get(typeId)!;
			}
		});

		// Merge the content of "deserialized type" into the reference
		Object.assign(deserializedTypeMap.get(Number(typeId)), deserializedType);
	}

	// Return the main deserialized type
	return deserializedTypeMap.get(serializedSimpleType.type)!;
}

/**
 * Serialize a SimpleType
 * @param simpleType
 */
export function serializeSimpleType(simpleType: SimpleType): SerializedSimpleType {
	// Assign an "id" to each serialized type
	const typeMap: Record<number, SerializedSimpleTypeWithRef> = {};
	// Make it possible to lookup an id based on a SimpleType
	const typeMapReverse = new WeakMap<SimpleType, number>();
	// Keep track of current id
	let id = 0;

	const mainTypeId = serializeTypeInternal(simpleType, {
		assignIdToType: type => {
			if (typeMapReverse.has(type)) {
				return typeMapReverse.get(type)!;
			}

			const assignedId = id++;
			typeMapReverse.set(type, assignedId);
			return assignedId;
		},
		getIdFromType: type => {
			return typeMapReverse.get(type);
		},
		emitType: (id, simpleTypeWithRef) => {
			typeMap[id] = simpleTypeWithRef;
			return id++;
		}
	});

	return {
		type: mainTypeId,
		typeMap
	};
}

function serializeTypeInternal(
	simpleType: SimpleType,
	{
		emitType,
		getIdFromType,
		assignIdToType
	}: {
		emitType: (id: number, simpleTypeWithRef: SerializedSimpleTypeWithRef) => void;
		getIdFromType: (simpleType: SimpleType) => number | undefined;
		assignIdToType: (simpleType: SimpleType) => number;
	}
): number {
	// If this SimpleType already has been assigned an ID, we don't need to serialize it again
	const existingId = getIdFromType(simpleType);
	if (existingId != null) {
		return existingId;
	}

	const id = assignIdToType(simpleType);

	const serializedType = convertObject<SimpleType, SerializedSimpleTypeWithRef>({ ...simpleType }, obj => {
		// Replace with id whenever encountering a SimpleType
		if (isSimpleType(obj)) {
			// Convert the SimpleType recursively
			const id = serializeTypeInternal(obj, { emitType, getIdFromType, assignIdToType });
			return `${TYPE_REF_PREFIX}${id}`;
		}
	});

	// Emit this serialized type to the type map
	emitType(id, serializedType);

	return id;
}

function convertObject<T, U>(input: T, convert: (obj: unknown) => unknown): U {
	let outer = true;
	function convertObjectInner(obj: unknown): unknown {
		if (Array.isArray(obj)) {
			return obj.map(o => convertObjectInner(o));
		}

		if (!outer) {
			const convertedObj = convert(obj);
			if (convertedObj != null) {
				return convertedObj;
			}
		}

		outer = false;

		if (typeof obj === "object" && obj != null) {
			const newObj: { [key: string]: unknown } = {};
			for (const [key, value] of Object.entries(obj)) {
				newObj[key] = convertObjectInner(value);
			}
			return newObj;
		}

		return obj;
	}

	return convertObjectInner(input) as U;
}
