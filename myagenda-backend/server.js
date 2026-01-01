const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ===== Database Connection =====
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "myagenda",
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err.message);
  } else {
    console.log("Database connected");
  }
});

// ===== Test Route =====
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// ===== Register =====
app.post("/api/register", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  db.query("SELECT id FROM users WHERE email = ?", [cleanEmail], async (err, rows) => {
    if (err) {
      console.log("DB SELECT error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }

    if (rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    try {
      const hash = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, cleanEmail, hash],
        (err2) => {
          if (err2) {
            console.log("DB INSERT error:", err2.message);
            return res.status(500).json({ message: "Server error" });
          }

          return res.status(201).json({ message: "User registered successfully" });
        }
      );
    } catch (e) {
      console.log("Bcrypt error:", e.message);
      return res.status(500).json({ message: "Server error" });
    }
  });
});

// ===== Login =====
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  db.query("SELECT * FROM users WHERE email = ?", [cleanEmail], async (err, rows) => {
    if (err) {
      console.log("DB error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    try {
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      return res.json({
        message: "Login successful",
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (e) {
      console.log("Compare error:", e.message);
      return res.status(500).json({ message: "Server error" });
    }
  });
});

// ===== TODOS API =====
app.get("/api/todos", (req, res) => {
  db.query("SELECT * FROM todos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "error" });
    res.json(rows);
  });
});

app.post("/api/todos", (req, res) => {
  const { title } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({ message: "title is required" });
  }

  db.query(
    "INSERT INTO todos (user_id, title, is_completed) VALUES (1, ?, 0)",
    [String(title).trim()],
    (err, result) => {
      if (err) return res.status(500).json({ message: "error" });
      res.status(201).json({ id: result.insertId, title: String(title).trim(), is_completed: 0 });
    }
  );
});

app.put("/api/todos/:id", (req, res) => {
  const { is_completed } = req.body;

  db.query(
    "UPDATE todos SET is_completed=? WHERE id=?",
    [is_completed ? 1 : 0, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "error" });
      res.json({ ok: true });
    }
  );
});

app.delete("/api/todos/:id", (req, res) => {
  db.query(
    "DELETE FROM todos WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "error" });
      res.json({ ok: true });
    }
  );
});
// ===== NOTES API =====

// GET all notes
app.get("/api/notes", (req, res) => {
  db.query("SELECT * FROM notes ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "error" });
    res.json(rows);
  });
});

// POST new note
app.post("/api/notes", (req, res) => {
  const { title, content } = req.body;

  const cleanTitle = title ? String(title).trim() : "Note";
  const cleanContent = content ? String(content).trim() : "";

  if (!cleanContent) {
    return res.status(400).json({ message: "content is required" });
  }

  db.query(
    "INSERT INTO notes (user_id, title, content) VALUES (1, ?, ?)",
    [cleanTitle, cleanContent],
    (err, result) => {
      if (err) return res.status(500).json({ message: "error" });

      res.status(201).json({
        id: result.insertId,
        user_id: 1,
        title: cleanTitle,
        content: cleanContent,
      });
    }
  );
});

// DELETE note
app.delete("/api/notes/:id", (req, res) => {
  db.query("DELETE FROM notes WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "error" });
    res.json({ ok: true });
  });
});
// ===== EVENTS (CALENDAR) API =====

// GET all events
app.get("/api/events", (req, res) => {
  db.query("SELECT * FROM events ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "error" });
    res.json(rows);
  });
});

// POST new event
app.post("/api/events", (req, res) => {
  const { dateKey, time, title, description, endTime } = req.body;

  const cleanTitle = title ? String(title).trim() : "";
  const cleanDesc = description ? String(description).trim() : "";

  if (!dateKey || !time || !cleanTitle) {
    return res.status(400).json({ message: "dateKey, time, title are required" });
  }

  // مثال: dateKey = "2026-01-01", time = "14:30"
  const startDT = `${dateKey} ${time}:00`;

  // endTime اختياري
  const endDT = endTime ? `${dateKey} ${endTime}:00` : null;

  db.query(
    "INSERT INTO events (user_id, title, description, start_datetime, end_datetime) VALUES (1, ?, ?, ?, ?)",
    [cleanTitle, cleanDesc, startDT, endDT],
    (err, result) => {
      if (err) return res.status(500).json({ message: "error" });

      // رجّع شكل بسيط للفرونت
      res.status(201).json({
        id: result.insertId,
        dateKey,
        time,
        text: cleanTitle,
      });
    }
  );
});

// DELETE event
app.delete("/api/events/:id", (req, res) => {
  db.query("DELETE FROM events WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "error" });
    res.json({ ok: true });
  });
});


// ===== Server (لازم آخر شي) =====
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on http://127.0.0.1:5000");
});
