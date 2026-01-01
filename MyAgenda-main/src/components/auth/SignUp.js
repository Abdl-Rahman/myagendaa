import React, { useState } from "react";
import "./SignIn.css";

function SignUp({ t, onBack }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Fill all fields");
      setSuccess("");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSuccess("");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Register failed");
        setSuccess("");
        return;
      }

      setError("");
      setSuccess("Account created! You can login now.");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Network error");
      setSuccess("");
      console.log("REGISTER ERROR:", err);
    }
  };

  return (
    <div className="signin-container">
      <h2 className="signin-title">Register</h2>

      <form className="signin-form" onSubmit={handleSubmit}>
        <div className="signin-field">
          <label className="signin-label">Name</label>
          <input
            type="text"
            className="signin-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
          />
        </div>

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

        <div className="signin-field">
          <label className="signin-label">Confirm Password</label>
          <input
            type="password"
            className="signin-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
          />
        </div>

        {error && <p className="signin-error">{error}</p>}
        {success && <p style={{ marginTop: 10 }}>{success}</p>}

        <button type="submit" className="signin-button">
          Register
        </button>

        <button
          type="button"
          className="signin-button"
          style={{ marginTop: 10 }}
          onClick={onBack}
        >
          Back to Login
        </button>
      </form>
    </div>
  );
}

export default SignUp;
