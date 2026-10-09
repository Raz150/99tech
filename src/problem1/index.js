// Negative n mirrors positive: sum_to_n(-3) === -1 + -2 + -3 === -6. sum_to_n(0) === 0.

// O(1): Gauss formula.
var sum_to_n_a = function(n) {
    var m = Math.abs(n);
    return Math.sign(n) * (m * (m + 1) / 2);
};

// O(n) time, O(1) space: plain loop.
var sum_to_n_b = function(n) {
    var sum = 0;
    for (var i = 1; i <= Math.abs(n); i++) sum += i;
    return Math.sign(n) * sum;
};

// O(n) time, O(log n) stack: divide and conquer, so large n won't overflow the stack like naive recursion.
var sum_to_n_c = function(n) {
    var range = function(lo, hi) {
        if (lo > hi) return 0;
        if (lo === hi) return lo;
        var mid = Math.floor((lo + hi) / 2);
        return range(lo, mid) + range(mid + 1, hi);
    };
    return Math.sign(n) * range(1, Math.abs(n));
};

module.exports = { sum_to_n_a, sum_to_n_b, sum_to_n_c };

if (require.main === module) {
    var assert = require("assert");
    [[5, 15], [1, 1], [0, 0], [-3, -6], [100, 5050]].forEach(function([n, want]) {
        [sum_to_n_a, sum_to_n_b, sum_to_n_c].forEach(function(f) {
            assert.strictEqual(f(n), want, f.name + "(" + n + ")");
        });
    });
    console.log("ok");
}
