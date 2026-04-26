import {
  FolderLock,
  HardDrive,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function DashboardPage() {
  const { user, isAdmin, isGuest } = useAuth();

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            {isAdmin
              ? "Admin overview of your private personal server."
              : "Guest view of Alex Araki-Kurdyla’s personal database."}
          </p>
        </div>
      </div>

      <div className="panel welcome-panel">
        <div>
          <h2>Welcome, {user?.displayName}</h2>
          <p>
            Current role:{" "}
            <strong>{user?.role === "ADMIN" ? "Administrator" : "Guest"}</strong>
          </p>
        </div>

        <span
          className={
            user?.role === "ADMIN" ? "role-pill admin" : "role-pill guest"
          }
        >
          {user?.role}
        </span>
      </div>

      {isGuest && (
        <div className="guest-grid">
          <div className="panel">
            <UserRound size={28} />
            <h2>Public Profile</h2>
            <p>
              This area will contain public information about Alex, including
              background, projects, coursework, technical skills, and selected
              writing.
            </p>
          </div>

          <div className="panel">
            <ShieldCheck size={28} />
            <h2>Limited Access</h2>
            <p>
              You are browsing as a guest. Guest users can view public
              information but cannot edit records, upload files, access private
              notes, or manage the server.
            </p>
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <FolderLock size={24} />
              <h2>Encrypted Files</h2>
              <p className="stat-number">0</p>
            </div>

            <div className="stat-card">
              <HardDrive size={24} />
              <h2>Storage Used</h2>
              <p className="stat-number">0 MB</p>
            </div>

            <div className="stat-card">
              <ShieldCheck size={24} />
              <h2>Security</h2>
              <p className="stat-number">TLS Local</p>
            </div>

            <div className="stat-card">
              <Upload size={24} />
              <h2>Uploads</h2>
              <p className="stat-number">0</p>
            </div>
          </div>

          <div className="panel">
            <h2>Admin build steps</h2>
            <ul>
              <li>Connect admin login to the C TLS authentication server.</li>
              <li>Add salted password hash verification.</li>
              <li>Add nonce challenge-response authentication.</li>
              <li>Enforce RBAC in the backend, not just the UI.</li>
              <li>Add public and private database records.</li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}