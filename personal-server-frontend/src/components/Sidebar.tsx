import {
  Database,
  FolderLock,
  Home,
  LogOut,
  PlugZap,
  Settings,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Database size={24} />
        <span>PrivateVault</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard">
          <Home size={18} />
          Dashboard
        </NavLink>

        {isAdmin && (
          <>
            <NavLink to="/connection">
              <PlugZap size={18} />
              Server Connection
            </NavLink>

            <NavLink to="/vault">
              <FolderLock size={18} />
              Encrypted Vault
            </NavLink>

            <NavLink to="/settings">
              <Settings size={18} />
              Security Settings
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <p className="account-label">Account</p>

        <div className="account-card">
          <div className="account-avatar">
            {user?.role === "ADMIN" ? "A" : "G"}
          </div>

          <div className="account-details">
            <strong>{user?.displayName ?? "Private User"}</strong>
            <span>{user?.username ?? "Not signed in"}</span>
          </div>
        </div>

        <span
          className={
            user?.role === "ADMIN" ? "role-pill admin" : "role-pill guest"
          }
        >
          {user?.role ?? "UNKNOWN"}
        </span>

        <button onClick={handleLogout} className="logout-button">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}