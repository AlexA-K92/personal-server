const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const rootDir = path.join(__dirname, "..");
const cDir = path.join(rootDir, "personal-server-c");
const certsDir = path.join(cDir, "certs");
const userDbPath = path.join(cDir, "user_db.txt");

const ownerUsername = process.env.PRIVATEVAULT_OWNER_USER || null;
const ownerPassword = process.env.PRIVATEVAULT_OWNER_PASSWORD || null;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function run(command, args) {
  console.log(`[setup] ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    stdio: "inherit",
  });
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function generateCertsIfMissing() {
  ensureDir(certsDir);

  const caKey = path.join(certsDir, "ca.key");
  const caCrt = path.join(certsDir, "ca.crt");
  const serverKey = path.join(certsDir, "server.key");
  const serverCsr = path.join(certsDir, "server.csr");
  const serverCrt = path.join(certsDir, "server.crt");
  const serverExt = path.join(certsDir, "server.ext");

  if (fileExists(caCrt) && fileExists(serverCrt) && fileExists(serverKey)) {
    console.log("[setup] TLS certs already exist. Skipping certificate generation.");
    return;
  }

  fs.writeFileSync(
    serverExt,
    [
      "authorityKeyIdentifier=keyid,issuer",
      "basicConstraints=CA:FALSE",
      "keyUsage=digitalSignature,keyEncipherment",
      "extendedKeyUsage=serverAuth",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
      "",
    ].join("\n")
  );

  run("openssl", ["genrsa", "-out", caKey, "4096"]);

  run("openssl", [
    "req",
    "-x509",
    "-new",
    "-nodes",
    "-key",
    caKey,
    "-sha256",
    "-days",
    "3650",
    "-out",
    caCrt,
    "-subj",
    "/CN=PrivateVault Local CA",
  ]);

  run("openssl", ["genrsa", "-out", serverKey, "2048"]);

  run("openssl", [
    "req",
    "-new",
    "-key",
    serverKey,
    "-out",
    serverCsr,
    "-subj",
    "/CN=localhost",
  ]);

  run("openssl", [
    "x509",
    "-req",
    "-in",
    serverCsr,
    "-CA",
    caCrt,
    "-CAkey",
    caKey,
    "-CAcreateserial",
    "-out",
    serverCrt,
    "-days",
    "825",
    "-sha256",
    "-extfile",
    serverExt,
  ]);

  console.log("[setup] Generated local TLS certificates.");
}

function generateOwnerUserDbIfPossible() {
  if (fileExists(userDbPath)) {
    console.log("[setup] Private owner credential database found.");
    console.log("[setup] Admin login is available for the configured owner account.");
    return;
  }

  if (!ownerUsername || !ownerPassword) {
    console.log("[setup] No owner credentials found in environment.");
    console.log("[setup] Guest mode will work.");
    console.log("[setup] Admin login will remain unavailable in this environment.");
    console.log("[setup] To enable owner admin login in Codespaces, add these Codespaces secrets:");
    console.log("[setup] PRIVATEVAULT_OWNER_USER");
    console.log("[setup] PRIVATEVAULT_OWNER_PASSWORD");
    return;
  }

  const normalizedUsername = ownerUsername.trim().toLowerCase();

  if (!normalizedUsername) {
    console.log("[setup] PRIVATEVAULT_OWNER_USER is empty. Guest mode only.");
    return;
  }

  const salt = crypto.randomBytes(16);

  const key = crypto.pbkdf2Sync(
    ownerPassword,
    salt,
    100000,
    32,
    "sha256"
  );

  const entry = `${normalizedUsername}:ADMIN:${salt.toString("hex")}:${key.toString("hex")}\n`;

  fs.writeFileSync(userDbPath, entry, { mode: 0o600 });

  console.log("[setup] Generated private owner credential database from environment secrets.");
  console.log(`[setup] Owner admin username: ${normalizedUsername}`);
  console.log("[setup] Owner admin password was not printed or stored.");
}

function main() {
  console.log("[setup] Preparing PrivateVault local development environment...");

  generateCertsIfMissing();
  generateOwnerUserDbIfPossible();

  console.log("[setup] Local setup complete.");
}

main();