import React, { useState } from "react";
import "./SignIn.css";

function SignIn({ t, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError(t?.loginError || "Fill all fields");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || (t?.loginError || "Login failed"));
        return;
      }

      setError("");
      onLogin(data.user);
    } catch (err) {
      setError("Network error");
      console.log("LOGIN ERROR:", err);
    }
  };

  return (
    <div className="signin-container">
      <h2 className="signin-title">{t?.loginTitle || "Login"}</h2>

      <form className="signin-form" onSubmit={handleSubmit}>
        <div className="signin-field">
          <label className="signin-label">{t?.emailLabel || "Email"}</label>
          <input
            type="email"
            className="signin-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t?.emailPlaceholder || "Enter email"}
          />
        </div>

        <div className="signin-field">
          <label className="signin-label">{t?.passwordLabel || "Password"}</label>
          <input
            type="password"
            className="signin-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t?.passwordPlaceholder || "Enter password"}
          />
        </div>

        {error && <p className="signin-error">{error}</p>}

        <button type="submit" className="signin-button">
          {t?.loginButton || "Login"}
        </button>
      </form>
    </div>
  );
}

export default SignIn;
