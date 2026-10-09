# A Crude Server

ExpressJS + TypeScript CRUD API, persisted in SQLite via Node's built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html) (no native build step). TypeScript runs directly through Node's type stripping, so there is no compile step either.

**Requires Node.js 23.6+** (developed on Node 24).

```sh
npm install
npm start    # http://localhost:3000
npm test     # type-check + end-to-end CRUD test against an in-memory DB
```

## Configuration

| Env var   | Default   | Meaning                                    |
|-----------|-----------|--------------------------------------------|
| `PORT`    | `3000`    | HTTP port                                  |
| `DB_PATH` | `data.db` | SQLite file (created on first run). `:memory:` for a throwaway DB |

## API

A resource is `{ id, name, description, created_at, updated_at }`.

| Method   | Path             | Body                       | Success |
|----------|------------------|----------------------------|---------|
| `POST`   | `/resources`     | `{ name, description? }`   | `201` + resource |
| `GET`    | `/resources`     | —                          | `200` + array |
| `GET`    | `/resources/:id` | —                          | `200` + resource |
| `PATCH`  | `/resources/:id` | `{ name?, description? }`  | `200` + resource |
| `DELETE` | `/resources/:id` | —                          | `204` |

List filters: `?name=` (case-insensitive substring), `?limit=` (default 20, max 100), `?offset=`.

Errors: `400 { error }` for invalid bodies, `404 { error }` for unknown ids.

```sh
curl -X POST localhost:3000/resources -H 'content-type: application/json' -d '{"name":"Apple","description":"red"}'
curl 'localhost:3000/resources?name=app&limit=10'
curl localhost:3000/resources/1
curl -X PATCH localhost:3000/resources/1 -H 'content-type: application/json' -d '{"description":"green"}'
curl -X DELETE localhost:3000/resources/1
```
