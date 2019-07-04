export function or<T>(list: T[], match: (arg: T, i: number) => boolean): boolean {
	return list.find((a, i) => match(a, i)) != null;
}

export function and<T>(list: T[], match: (arg: T, i: number) => boolean): boolean {
	return list.find((a, i) => !match(a, i)) == null;
}

export function zip<T, U>(listA: T[], listB: U[]): [T, U][] | null {
	if (listA.length !== listB.length) return null;
	return listA.map((a, i) => [a, listB[i]] as [T, U]);
}

export function flat<T>(list: T[][]): T[] {
	return Array.prototype.concat.apply([], list);
}
