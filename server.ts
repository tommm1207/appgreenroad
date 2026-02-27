import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// Initialize SQLite Database
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(path.join(dbDir, "database.sqlite"));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    headers TEXT,
    data TEXT
  );
  
  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    employees TEXT,
    records TEXT
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes

  // --- Modules API ---
  app.get("/api/modules/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("SELECT * FROM modules WHERE id = ?");
    const row = stmt.get(id) as any;
    
    if (row) {
      res.json({
        headers: JSON.parse(row.headers || "[]"),
        data: JSON.parse(row.data || "[]")
      });
    } else {
      res.json({ headers: [], data: [] });
    }
  });

  app.post("/api/modules/:id", (req, res) => {
    const { id } = req.params;
    const { headers, data } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO modules (id, headers, data) 
      VALUES (?, ?, ?) 
      ON CONFLICT(id) DO UPDATE SET 
        headers = excluded.headers, 
        data = excluded.data
    `);
    
    stmt.run(id, JSON.stringify(headers), JSON.stringify(data));
    res.json({ success: true });
  });

  // --- Attendance API ---
  app.get("/api/attendance", (req, res) => {
    const stmt = db.prepare("SELECT * FROM attendance WHERE id = 'main'");
    const row = stmt.get() as any;
    
    if (row) {
      res.json({
        employees: JSON.parse(row.employees || "[]"),
        records: JSON.parse(row.records || "{}")
      });
    } else {
      res.json({ employees: [], records: {} });
    }
  });

  app.post("/api/attendance", (req, res) => {
    const { employees, records } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO attendance (id, employees, records) 
      VALUES ('main', ?, ?) 
      ON CONFLICT(id) DO UPDATE SET 
        employees = excluded.employees, 
        records = excluded.records
    `);
    
    stmt.run(JSON.stringify(employees), JSON.stringify(records));
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
