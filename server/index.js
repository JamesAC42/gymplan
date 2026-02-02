import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3009;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "data", "db.json");
const clientDist = path.join(__dirname, "..", "dist");
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || "/gym");
const API_BASE = `${BASE_PATH}/api`;

function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    return next();
  });
}

async function ensureDb() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, JSON.stringify({ logs: {} }, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(dataPath, "utf-8");
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
}

app.get(`${API_BASE}/health`, (req, res) => {
  res.json({ ok: true });
});

app.get(`${API_BASE}/logs`, async (req, res) => {
  const db = await readDb();
  res.json({ logs: db.logs || {} });
});

app.get(`${API_BASE}/logs/:date`, async (req, res) => {
  const db = await readDb();
  res.json({ entry: db.logs?.[req.params.date] || null });
});

app.put(`${API_BASE}/logs/:date`, async (req, res) => {
  const db = await readDb();
  const date = req.params.date;
  const entry = { ...req.body, date };
  db.logs = db.logs || {};
  db.logs[date] = entry;
  await writeDb(db);
  res.json({ ok: true, entry });
});

app.get(`${API_BASE}/weights`, async (req, res) => {
  const db = await readDb();
  const weights = Object.entries(db.logs || {})
    .map(([date, entry]) => ({ date, weight: entry.weight ?? null }))
    .filter((entry) => entry.weight !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
  res.json({ weights });
});

if (process.env.NODE_ENV === "production") {
  const staticPath = BASE_PATH || "/";
  app.use(staticPath, express.static(clientDist));
  app.get(BASE_PATH ? `${BASE_PATH}/*` : "*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
