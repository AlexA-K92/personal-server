const express = require("express");
const cors = require("cors");
const tls = require("tls");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

const BRIDGE_PORT = 4000;
const C_SERVER_HOST = "127.0.0.1";
const C_SERVER_PORT = 9090;

const CA_CERT_PATH = path.join(
  __dirname,
  "..",
  "personal-server-c",
  "certs",
  "ca.crt"
);

let tlsSocket = null;
let connected = false;
let authenticated = false;
let currentUser = null;
let lastError = null;
let eventLog = [];

function addLog(message) {
  const entry = {
    time: new Date().toISOString(),
    message,
  };

  eventLog.unshift(entry);
  eventLog = eventLog.slice(0, 50);

  console.log(message);
}

function getStatus() {
  return {
    connected,
    authenticated,
    user: currentUser,
    host: C_SERVER_HOST,
    port: C_SERVER_PORT,
    lastError,
    log: eventLog,
  };
}

function cleanupSocket() {
  connected = false;
  authenticated = false;
  currentUser = null;

  if (tlsSocket) {
    tlsSocket.removeAllListeners();
    tlsSocket.destroy();
    tlsSocket = null;
  }
}

function createTlsConnection() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CA_CERT_PATH)) {
      reject(new Error(`CA certificate not found at ${CA_CERT_PATH}`));
      return;
    }

    const caCert = fs.readFileSync(CA_CERT_PATH);

    let settled = false;

    const socket = tls.connect(
      {
        host: C_SERVER_HOST,
        port: C_SERVER_PORT,
        ca: caCert,
        servername: "localhost",
        rejectUnauthorized: true,
      },
      () => {
        if (settled) return;
        settled = true;
        socket.setTimeout(0);
        resolve(socket);
      }
    );

    socket.setTimeout(5000, () => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error("TLS connection timed out."));
    });

    socket.once("error", (err) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(err);
    });
  });
}

function attachPersistentSocketHandlers(socket) {
  socket.on("close", () => {
    addLog("[BRIDGE] TLS socket closed.");
    connected = false;
    authenticated = false;
    currentUser = null;
    tlsSocket = null;
  });

  socket.on("error", (err) => {
    lastError = err.message;
    addLog(`[BRIDGE] TLS socket error: ${err.message}`);
    cleanupSocket();
  });
}

function sendLine(socket, line) {
  return new Promise((resolve, reject) => {
    const message = line.endsWith("\n") ? line : `${line}\n`;

    socket.write(message, "utf8", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function readLine(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";

    const timeout = setTimeout(() => {
      socket.removeListener("data", handleData);
      reject(new Error("Timed out waiting for server response."));
    }, 5000);

    function handleData(data) {
      buffer += data.toString("utf8");

      if (buffer.includes("\n")) {
        clearTimeout(timeout);
        socket.removeListener("data", handleData);

        const line = buffer.split(/\r?\n/)[0].trim();
        resolve(line);
      }
    }

    socket.on("data", handleData);
  });
}

async function performAdminAuth(socket, username, password) {
  const normalizedUsername = username.trim().toLowerCase();

  await sendLine(socket, `AUTH_BEGIN ${normalizedUsername}`);

  const challengeLine = await readLine(socket);
  addLog(`[BRIDGE] Received: ${challengeLine}`);

  const challengeParts = challengeLine.split(" ");

  if (challengeParts[0] !== "AUTH_CHALLENGE") {
    throw new Error(challengeLine || "Expected AUTH_CHALLENGE from C server.");
  }

  const saltHex = challengeParts[1];
  const nonceHex = challengeParts[2];

  if (!saltHex || !nonceHex) {
    throw new Error("Malformed AUTH_CHALLENGE from C server.");
  }

  const salt = Buffer.from(saltHex, "hex");
  const nonce = Buffer.from(nonceHex, "hex");

  const passwordKey = crypto.pbkdf2Sync(
    password,
    salt,
    100000,
    32,
    "sha256"
  );

  const responseHex = crypto
    .createHmac("sha256", passwordKey)
    .update(nonce)
    .digest("hex");

  await sendLine(socket, `AUTH_RESPONSE ${responseHex}`);

  const resultLine = await readLine(socket);
  addLog(`[BRIDGE] Received: ${resultLine}`);

  const resultParts = resultLine.split(" ");

  if (resultParts[0] !== "AUTH_OK") {
    throw new Error("Invalid admin credentials.");
  }

  const authenticatedUsername = resultParts[1];
  const role = resultParts[2];

  if (role !== "ADMIN") {
    throw new Error("Authenticated user is not an admin.");
  }

  return {
    username: authenticatedUsername,
    displayName: "Alex Araki-Kurdyla",
    role,
  };
}

app.get("/api/status", (req, res) => {
  res.json(getStatus());
});

app.post("/api/auth/admin-login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      error: "Username and password are required.",
      status: getStatus(),
    });
  }

  let socket = null;

  try {
    cleanupSocket();

    socket = await createTlsConnection();

    addLog(
      `[BRIDGE] Admin login TLS connection established using ${socket.getCipher().name}.`
    );

    const user = await performAdminAuth(socket, username, password);

    tlsSocket = socket;
    connected = true;
    authenticated = true;
    currentUser = user;
    lastError = null;

    attachPersistentSocketHandlers(tlsSocket);

    addLog(`[BRIDGE] Admin authenticated as ${user.username}.`);

    res.json({
      ok: true,
      user,
      status: getStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin login failed.";
    lastError = message;
    addLog(`[BRIDGE] Admin login failed: ${message}`);

    if (socket) {
      socket.destroy();
    }

    cleanupSocket();

    res.status(401).json({
      ok: false,
      error: message,
      status: getStatus(),
    });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    if (tlsSocket && connected) {
      await sendLine(tlsSocket, "QUIT");
    }
  } catch {
    // Ignore logout send errors.
  }

  cleanupSocket();
  addLog("[BRIDGE] Logged out and disconnected.");

  res.json({
    ok: true,
    message: "Logged out.",
    status: getStatus(),
  });
});

app.post("/api/connect", async (req, res) => {
  if (connected && tlsSocket) {
    return res.json({
      ok: true,
      message: authenticated
        ? "Already connected and authenticated."
        : "Already connected.",
      status: getStatus(),
    });
  }

  try {
    cleanupSocket();

    tlsSocket = await createTlsConnection();
    connected = true;
    authenticated = false;
    currentUser = null;
    lastError = null;

    attachPersistentSocketHandlers(tlsSocket);

    addLog(`[BRIDGE] Connected to C TLS server using ${tlsSocket.getCipher().name}.`);
    addLog("[BRIDGE] Not authenticated yet. Admin login is required before commands.");

    res.json({
      ok: true,
      message: "Connected to C TLS server. Admin login is still required.",
      status: getStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Connection failed.";
    lastError = message;
    addLog(`[BRIDGE] Connection failed: ${message}`);

    cleanupSocket();

    res.status(500).json({
      ok: false,
      error: message,
      status: getStatus(),
    });
  }
});

app.post("/api/send", async (req, res) => {
  const { command } = req.body;

  if (!command || typeof command !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Command is required.",
      status: getStatus(),
    });
  }

  if (!connected || !tlsSocket) {
    return res.status(400).json({
      ok: false,
      error: "Not connected to C TLS server.",
      status: getStatus(),
    });
  }

  if (!authenticated) {
    return res.status(403).json({
      ok: false,
      error: "Connected but not authenticated. Sign in as admin first.",
      status: getStatus(),
    });
  }

  try {
    await sendLine(tlsSocket, command);
    const response = await readLine(tlsSocket);

    addLog(`[BRIDGE] Sent command: ${command}`);
    addLog(`[BRIDGE] Server response: ${response}`);

    res.json({
      ok: true,
      command,
      response,
      status: getStatus(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed.";
    lastError = message;
    addLog(`[BRIDGE] Send failed: ${message}`);

    cleanupSocket();

    res.status(500).json({
      ok: false,
      error: message,
      status: getStatus(),
    });
  }
});

app.post("/api/disconnect", async (req, res) => {
  try {
    if (tlsSocket && connected) {
      await sendLine(tlsSocket, "QUIT");
    }
  } catch {
    // Ignore disconnect send errors.
  }

  cleanupSocket();
  addLog("[BRIDGE] Disconnected from C TLS server.");

  res.json({
    ok: true,
    message: "Disconnected.",
    status: getStatus(),
  });
});

const server = app.listen(BRIDGE_PORT, "127.0.0.1", () => {
  console.log(`[BRIDGE] Running on http://127.0.0.1:${BRIDGE_PORT}`);
  console.log(
    `[BRIDGE] Expecting C TLS server at ${C_SERVER_HOST}:${C_SERVER_PORT}`
  );
});

server.on("error", (err) => {
  console.error(`[BRIDGE] Failed to start server: ${err.message}`);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("[BRIDGE] Received SIGTERM. Shutting down.");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("[BRIDGE] Received SIGINT. Shutting down.");
  server.close(() => process.exit(0));
});