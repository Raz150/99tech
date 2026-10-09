import express from "express";
import { DatabaseSync } from "node:sqlite";

type Body = { name?: unknown; description?: unknown };

export function createApp(dbPath: string) {
	const db = new DatabaseSync(dbPath);
	db.exec(`CREATE TABLE IF NOT EXISTS resources (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		description TEXT NOT NULL DEFAULT '',
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		updated_at TEXT NOT NULL DEFAULT (datetime('now'))
	)`);

	const app = express();
	app.use(express.json());

	// Returns an error message, or null if the body is valid. `partial` allows omitting fields (PATCH).
	const invalid = (b: Body, partial: boolean) => {
		if (!b || typeof b !== "object") return "body must be a JSON object";
		if (!(partial && b.name === undefined) && (typeof b.name !== "string" || !b.name.trim())) return "name must be a non-empty string";
		if (b.description !== undefined && typeof b.description !== "string") return "description must be a string";
		return null;
	};
	const find = (id: string) => db.prepare("SELECT * FROM resources WHERE id = ?").get(id);

	app.post("/resources", (req, res) => {
		const err = invalid(req.body, false);
		if (err) return void res.status(400).json({ error: err });
		const { name, description = "" } = req.body as { name: string; description?: string };
		const { lastInsertRowid } = db.prepare("INSERT INTO resources (name, description) VALUES (?, ?)").run(name.trim(), description);
		res.status(201).json(find(String(lastInsertRowid)));
	});

	// Filters: ?name= (substring, case-insensitive), ?limit= (default 20, max 100), ?offset=
	app.get("/resources", (req, res) => {
		const name = typeof req.query.name === "string" ? req.query.name : "";
		const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
		const offset = Math.max(Number(req.query.offset) || 0, 0);
		const rows = db
			.prepare("SELECT * FROM resources WHERE name LIKE ? ORDER BY id LIMIT ? OFFSET ?")
			.all(`%${name}%`, limit, offset);
		res.json(rows);
	});

	app.get("/resources/:id", (req, res) => {
		const row = find(req.params.id);
		row ? res.json(row) : res.status(404).json({ error: "not found" });
	});

	app.patch("/resources/:id", (req, res) => {
		const err = invalid(req.body, true);
		if (err) return void res.status(400).json({ error: err });
		const { name, description } = req.body as { name?: string; description?: string };
		const { changes } = db
			.prepare("UPDATE resources SET name = COALESCE(?, name), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?")
			.run(name?.trim() ?? null, description ?? null, req.params.id);
		changes ? res.json(find(req.params.id)) : res.status(404).json({ error: "not found" });
	});

	app.delete("/resources/:id", (req, res) => {
		const { changes } = db.prepare("DELETE FROM resources WHERE id = ?").run(req.params.id);
		changes ? res.status(204).end() : res.status(404).json({ error: "not found" });
	});

	return app;
}
