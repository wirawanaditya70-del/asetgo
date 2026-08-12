import { useState } from "react";
import { supabase } from "../lib/supabase";

function LoginAdmin({ onBack, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError("Email atau password salah.");
      setLoading(false);
      return;
    }

    setLoading(false);

    onLogin(data.user);
  }

  return (
    <div className="login-page">

      <div className="login-card">

        <button
          className="login-back"
          onClick={onBack}
        >
          ← Kembali
        </button>

        <div className="login-logo">
          AB
        </div>

        <div className="login-label">
          ADMINISTRATOR
        </div>

        <h1>
          Login Admin
        </h1>

        <p className="login-description">
          Masuk untuk mengelola data agunan bank.
        </p>

        <form onSubmit={handleLogin}>

          <div className="form-group">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Masukkan email admin"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

          </div>


          <div className="form-group">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

          </div>


          {error && (
            <div className="login-error">
              {error}
            </div>
          )}


          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? "Memproses..."
              : "Masuk sebagai Admin"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default LoginAdmin;