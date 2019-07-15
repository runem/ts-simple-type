import { testAssignments } from "./helpers/test-assignment";
import { TypescriptType } from "./helpers/type-test";

const RECURSIVE_TYPES: TypescriptType[] = [
	`Element`,
	`HTMLElement`,
	`Event`,
	`(typeof HTMLElement["prototype"]["addEventListener"])`,
	`DocumentFragment`,
	`NodeListOf<HTMLButtonElement>`,
	//`EventTarget`,
	//`ChildNode`,
	//`HTMLSlotElement`,
	//`EventListenerOrEventListenerObject`,
	//`AssignedNodesOptions`,
	`
		interface B { next: C; }
		interface C { next: D; }
		interface D { next: B; }
	`,
	{
		setup: `interface List<T> {  
            data: T;  
            next: List<T>;  
            owner: List<List<T>>;
        }`,
		type: `List<string>`
	}
];

testAssignments(RECURSIVE_TYPES, RECURSIVE_TYPES);
