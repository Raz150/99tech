import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { createApp } from "./app.ts";

test("CRUD flow", async () => {
	const server = createApp(":memory:").listen(0);
	const base = `http://localhost:${(server.address() as AddressInfo).port}/resources`;
	const call = (path: string, method = "GET", body?: object) =>
		fetch(base + path, { method, headers: { "content-type": "application/json" }, body: body && JSON.stringify(body) });
	try {
		assert.equal((await call("", "POST", { name: "" })).status, 400);
		assert.equal((await call("", "POST", { name: "x", description: 5 })).status, 400);

		const created = await (await call("", "POST", { name: "Apple", description: "red" })).json();
		assert.equal(created.name, "Apple");
		await call("", "POST", { name: "Banana" });

		assert.deepEqual((await (await call("?name=app")).json()).map((r: any) => r.name), ["Apple"]);
		assert.equal((await (await call("?limit=1")).json()).length, 1);
		assert.equal((await (await call(`/${created.id}`)).json()).description, "red");

		const updated = await (await call(`/${created.id}`, "PATCH", { description: "green" })).json();
		assert.equal(updated.name, "Apple");
		assert.equal(updated.description, "green");
		assert.equal((await call(`/${created.id}`, "PATCH", { name: " " })).status, 400);

		assert.equal((await call(`/${created.id}`, "DELETE")).status, 204);
		assert.equal((await call(`/${created.id}`)).status, 404);
		assert.equal((await call(`/${created.id}`, "PATCH", { name: "y" })).status, 404);
		assert.equal((await call(`/${created.id}`, "DELETE")).status, 404);
	} finally {
		server.close();
	}
});
