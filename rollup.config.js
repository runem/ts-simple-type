import ts from "@wessberg/rollup-plugin-ts";

const pkg = require("./package.json");
const input = "src/index.ts";
const watch = {
	include: "src/**"
};

export default [
	{
		input,
		output: [
			{
				file: pkg.main,
				format: "cjs"
			}
		],
		plugins: [
			ts({
				tsconfig: "./tsconfig.prod.json"
			})
		],
		watch
	}
];
