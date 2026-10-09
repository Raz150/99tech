// Negative n is treated symmetrically: sum_to_n(-5) === -(1 + 2 + 3 + 4 + 5) === -15.

// A: Gauss's formula, n(n+1)/2.
// Time O(1), space O(1). The best choice: no loop, no stack.
export function sum_to_n_a(n: number): number {
	const m = Math.abs(n);
	return Math.sign(n) * (m * (m + 1)) / 2;
}

// B: Simple loop.
// Time O(n), space O(1). Easy to read, but slows linearly as n grows.
export function sum_to_n_b(n: number): number {
	let sum = 0;
	for (let i = 1; i <= Math.abs(n); i++) sum += i;
	return Math.sign(n) * sum;
}

// C: Recursion.
// Time O(n), space O(n) for the call stack. Slowest of the three, and throws
// RangeError (stack overflow) around n ≈ 10,000 since JS has no tail-call optimisation.
export function sum_to_n_c(n: number): number {
	if (n === 0) return 0;
	if (n < 0) return -sum_to_n_c(-n);
	return n + sum_to_n_c(n - 1);
}
