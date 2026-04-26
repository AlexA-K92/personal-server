import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { loginAsAdmin, loginAsGuest } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleGuestLogin() {
    loginAsGuest();
    navigate("/dashboard");
  }

  async function handleAdminSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await loginAsAdmin(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <Lock size={28} />
        </div>

        <h1>PrivateVault</h1>
        <p>Access Alex Araki-Kurdyla’s private personal server.</p>

        <button
          type="button"
          className="guest-login-button"
          onClick={handleGuestLogin}
        >
          <UserRound size={18} />
          Continue as Guest
        </button>

        <div className="login-divider">
          <span>Admin Access</span>
        </div>

        <form onSubmit={handleAdminSubmit}>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
              placeholder="Enter admin username"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Enter admin password"
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit">Sign in as Admin</button>
        </form>
      </div>
    </div>
  );
}