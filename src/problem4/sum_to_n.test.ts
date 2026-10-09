import { test } from "node:test";
import assert from "node:assert/strict";
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from "./sum_to_n.ts";

const cases: [number, number][] = [[5, 15], [1, 1], [0, 0], [-5, -15], [100, 5050]];

for (const fn of [sum_to_n_a, sum_to_n_b, sum_to_n_c]) {
	test(fn.name, () => {
		for (const [n, expected] of cases) assert.equal(fn(n), expected, `${fn.name}(${n})`);
	});
}
