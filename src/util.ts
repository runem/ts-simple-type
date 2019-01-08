export function or<T>(list: T[], match: (arg: T) => boolean): boolean {
	return list.find(a => match(a)) != null;
}

export function and<T>(list: T[], match: (arg: T) => boolean): boolean {
	return list.find(a => !match(a)) == null;
}

export function zip<T, U>(listA: T[], listB: U[]): [T, U][] | null {
	if (listA.length !== listB.length) return null;
	return listA.map((a, i) => [a, listB[i]] as [T, U]);
}
