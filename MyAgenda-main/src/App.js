import React, { useState, useEffect } from "react";
import texts from "./i18n/texts";

import Navbar from "./components/layout/Navbar";
import Sidebar from "./components/layout/Sidebar";
import Footer from "./components/layout/Footer";

import SignIn from "./components/auth/SignIn";
import SignUp from "./components/auth/SignUp";

import HomePage from "./pages/HomePage";
import TodoPage from "./pages/TodoPage";
import NotesPage from "./pages/NotesPage";
import CalendarPage from "./pages/CalendarPage";
import AboutPage from "./pages/AboutPage";

const API = "http://127.0.0.1:5000";

function App() {
  const [language, setLanguage] = useState("ar");
  const [theme, setTheme] = useState("light");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [authView, setAuthView] = useState("login");
  const [view, setView] = useState("home");

  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);

  const [now, setNow] = useState(Date.now());

  const t = texts[language];

  /* ===== Time ===== */
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  /* ===== THEME ===== */
  useEffect(() => {
    if (theme === "dark") document.body.classList.add("dark-mode");
    else document.body.classList.remove("dark-mode");
  }, [theme]);

  /* ===== LOAD DATA AFTER LOGIN ===== */
  useEffect(() => {
    if (!isLoggedIn) return;

    // TODOS
    fetch(`${API}/api/todos`)
      .then(res => res.json())
      .then(data => {
        setTodos(
          data.map(t => ({
            id: t.id,
            text: t.title,
            completed: !!t.is_completed,
            priority: "medium",
            deadline: null,
          }))
        );
      });

    // NOTES
    fetch(`${API}/api/notes`)
      .then(res => res.json())
      .then(data => {
        setNotes(
          data.map(n => ({
            id: n.id,
            text: n.content,
          }))
        );
      });

    // EVENTS
    fetch(`${API}/api/events`)
      .then(res => res.json())
      .then(data => {
        setEvents(
          data.map(e => ({
            id: e.id,
            dateKey: e.start_datetime.split("T")[0],
            time: e.start_datetime.split("T")[1]?.slice(0, 5),
            text: e.title,
          }))
        );
      });
  }, [isLoggedIn]);

  /* ===== TODO FUNCTIONS ===== */
  const addTodo = (text) => {
    fetch(`${API}/api/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: text }),
    })
      .then(res => res.json())
      .then(todo => {
        setTodos(prev => [
          { id: todo.id, text: todo.title, completed: false },
          ...prev,
        ]);
      });
  };

  const toggleTodo = (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    fetch(`${API}/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !todo.completed }),
    }).then(() => {
      setTodos(prev =>
        prev.map(t =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    });
  };

  const deleteTodo = (id) => {
    fetch(`${API}/api/todos/${id}`, { method: "DELETE" })
      .then(() => setTodos(prev => prev.filter(t => t.id !== id)));
  };

  /* ===== NOTES FUNCTIONS ===== */
  const addNote = (text) => {
    fetch(`${API}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    })
      .then(res => res.json())
      .then(note => {
        setNotes(prev => [{ id: note.id, text }, ...prev]);
      });
  };

  const deleteNote = (id) => {
    fetch(`${API}/api/notes/${id}`, { method: "DELETE" })
      .then(() => setNotes(prev => prev.filter(n => n.id !== id)));
  };

  /* ===== EVENTS ===== */
  const addEvent = (dateKey, time, text) => {
    fetch(`${API}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateKey, time, title: text }),
    })
      .then(res => res.json())
      .then(ev => {
        setEvents(prev => [...prev, ev]);
      });
  };

  const deleteEvent = (id) => {
    fetch(`${API}/api/events/${id}`, { method: "DELETE" })
      .then(() => setEvents(prev => prev.filter(e => e.id !== id)));
  };

  /* ===== AUTH ===== */
  const handleLogin = (user) => {
    setUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setTodos([]);
    setNotes([]);
    setEvents([]);
    setView("home");
  };

  /* ===== BEFORE LOGIN ===== */
  if (!isLoggedIn) {
    return (
      <div className="app-container">
        {authView === "login" ? (
          <>
            <SignIn t={t} onLogin={handleLogin} />
            <button className="signin-button" onClick={() => setAuthView("register")}>
              Create Account
            </button>
          </>
        ) : (
          <SignUp t={t} onBack={() => setAuthView("login")} />
        )}
      </div>
    );
  }

  /* ===== AFTER LOGIN ===== */
  return (
    <div className="app-container">
      <Sidebar t={t} view={view} onChangeView={setView} />
      <div className="app-main">
        <Navbar
          t={t}
          userEmail={user?.email}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")}
        />

        {view === "home" && <HomePage t={t} />}
        {view === "todo" && (
          <TodoPage
            t={t}
            todos={todos}
            onAddTodo={addTodo}
            onToggleTodo={toggleTodo}
            onDeleteTodo={deleteTodo}
            now={now}
          />
        )}
        {view === "notes" && (
          <NotesPage
            t={t}
            notes={notes}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
          />
        )}
        {view === "calendar" && (
          <CalendarPage
            t={t}
            events={events}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
          />
        )}
        {view === "about" && <AboutPage t={t} />}

        <Footer t={t} />
      </div>
    </div>
  );
}

export default App;
