import { createApp } from "./app.ts";

const port = Number(process.env.PORT) || 3000;
const dbPath = process.env.DB_PATH || "data.db";
createApp(dbPath).listen(port, () => console.log(`Listening on http://localhost:${port} (db: ${dbPath})`));
