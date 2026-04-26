const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const rootDir = path.join(__dirname, "..");
const cDir = path.join(rootDir, "personal-server-c");
const certsDir = path.join(cDir, "certs");
const userDbPath = path.join(cDir, "user_db.txt");

const adminUsername = process.env.PRIVATEVAULT_ADMIN_USER || "alex.araki";
const adminPassword = process.env.PRIVATEVAULT_ADMIN_PASSWORD || "demo-password";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function run(command, args, options = {}) {
  console.log(`[setup] ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    stdio: "inherit",
    ...options,
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

function generateUserDbIfMissing() {
  if (fileExists(userDbPath)) {
    console.log("[setup] user_db.txt already exists. Skipping user generation.");
    return;
  }

  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(adminPassword, salt, 100000, 32, "sha256");

  const line = `${adminUsername}:ADMIN:${salt.toString("hex")}:${key.toString("hex")}\n`;

  fs.writeFileSync(userDbPath, line, { mode: 0o600 });

  console.log("[setup] Generated local user_db.txt.");
  console.log(`[setup] Demo admin username: ${adminUsername}`);

  if (!process.env.PRIVATEVAULT_ADMIN_PASSWORD) {
    console.log("[setup] Demo admin password: demo-password");
    console.log("[setup] Set PRIVATEVAULT_ADMIN_PASSWORD to create a custom local password.");
  }
}

function main() {
  console.log("[setup] Preparing PrivateVault local development environment...");

  generateCertsIfMissing();
  generateUserDbIfMissing();

  console.log("[setup] Local setup complete.");
}

main();