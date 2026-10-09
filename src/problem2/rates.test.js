import assert from "node:assert/strict";
import { latestPrices, convert } from "./rates.js";

const p = latestPrices([
  { currency: "A", date: "2023-01-01T00:00:00Z", price: 1 },
  { currency: "A", date: "2023-01-02T00:00:00Z", price: 2 },
  { currency: "B", date: "2023-01-01T00:00:00Z", price: 0 },
  { currency: "C", date: "2023-01-01T00:00:00Z", price: 4 },
]);
assert.deepEqual([...p], [["A", 2], ["C", 4]]);
assert.equal(convert(10, 2, 4), 5);
assert.equal(convert(0, 2, 4), 0);
console.log("ok");
