import { useEffect, useState } from "react";
import { PlugZap, RefreshCw, Send, Server, Unplug } from "lucide-react";
import {
  connectToServer,
  disconnectFromServer,
  getBridgeStatus,
  sendServerCommand,
  type BridgeStatus,
} from "../api/bridgeClient";

export function ConnectionPage() {
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [command, setCommand] = useState("Hello from React UI");
  const [serverResponse, setServerResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function refreshStatus() {
    try {
      const nextStatus = await getBridgeStatus();
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load status.");
    }
  }

  async function handleConnect() {
    setLoading(true);
    setError("");
    setServerResponse("");

    try {
      const result = await connectToServer();
      setStatus(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed.");
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setLoading(true);
    setError("");
    setServerResponse("");

    try {
      const result = await disconnectFromServer();
      setStatus(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed.");
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCommand() {
    setLoading(true);
    setError("");
    setServerResponse("");

    try {
      const result = await sendServerCommand(command);
      setServerResponse(result.response);
      setStatus(result.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Command failed.");
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Server Connection</h1>
          <p>Control the local bridge connection to your C TLS server.</p>
        </div>

        <button className="secondary-button" onClick={refreshStatus}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="connection-grid">
        <div className="panel">
          <div className="connection-title">
            <Server size={22} />
            <h2>C TLS Server</h2>
          </div>

          <div className="status-row">
            <span>Status</span>
            <strong
              className={
                status?.connected ? "status-pill connected" : "status-pill"
              }
            >
              {status?.connected ? "Connected" : "Disconnected"}
            </strong>
          </div>

          <div className="status-row">
            <span>Host</span>
            <strong>{status ? `${status.host}:${status.port}` : "—"}</strong>
          </div>

          {status?.lastError && (
            <div className="error-box">Last error: {status.lastError}</div>
          )}

          {error && <div className="error-box">{error}</div>}

          <div className="button-row">
            <button
              className="action-button"
              onClick={handleConnect}
              disabled={loading || status?.connected}
            >
              <PlugZap size={16} />
              Connect
            </button>

            <button
              className="danger-button"
              onClick={handleDisconnect}
              disabled={loading || !status?.connected}
            >
              <Unplug size={16} />
              Disconnect
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="connection-title">
            <Send size={22} />
            <h2>Send Command</h2>
          </div>

          <label className="field-label">
            Command
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="STATUS"
            />
          </label>

          <button
            className="action-button full-width"
            onClick={handleSendCommand}
            disabled={loading || !status?.connected}
          >
            <Send size={16} />
            Send to C Server
          </button>

          {serverResponse && (
            <div className="server-response">
              <strong>Server response</strong>
              <pre>{serverResponse}</pre>
            </div>
          )}

          <p className="small-note">
            With the current simple C server, the server may close the connection
            after one response. That is okay for this phase. Later, the C server
            will stay open for the authenticated command loop.
          </p>
        </div>
      </div>

      <div className="panel">
        <h2>Bridge Event Log</h2>

        {!status?.log?.length ? (
          <p className="muted">No bridge events yet.</p>
        ) : (
          <div className="log-list">
            {status.log.map((entry, index) => (
              <div className="log-entry" key={`${entry.time}-${index}`}>
                <span>{new Date(entry.time).toLocaleTimeString()}</span>
                <code>{entry.message}</code>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}