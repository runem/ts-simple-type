import * as tsModule from "typescript";

let selectedTSModule = tsModule;

export function setTypescriptModule(ts: typeof tsModule) {
	selectedTSModule = ts;
}

export function getTypescriptModule(): typeof tsModule {
	return selectedTSModule;
}
