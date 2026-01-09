const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

require("dotenv").config();


app.use(cors());
app.use(express.json());

// ===== Database Connection =====
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
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

// ===== TODO API =====
app.get("/api/todo", (req, res) => {
  db.query("SELECT * FROM todos ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ message: "error" });
    res.json(rows);
  });
});

app.post("/api/todo", (req, res) => {
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

app.put("/api/todo/:id", (req, res) => {
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

app.delete("/api/todo/:id", (req, res) => {
  db.query(
    "DELETE FROM todos WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "error" });
      res.json({ ok: true });
    }
  );
});


// ===== TOGGLE TODO =====
app.patch("/api/todo/:id/toggle", (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE todos SET is_completed = NOT is_completed WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "error" });
      }
      res.json({ ok: true });
    }
  );
});

// ===== Server (لازم آخر شي) =====
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
