const fs = require("fs");
const net = require("net");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const shellOutputPath = path.join(rootDir, ".privatevault-ports.sh");
const jsonOutputPath = path.join(rootDir, ".privatevault-ports.json");

const isCodespaces = Boolean(process.env.CODESPACES);

function range(start, end) {
  const ports = [];

  for (let port = start; port <= end; port++) {
    ports.push(port);
  }

  return ports;
}

const candidates = {
  frontend: isCodespaces
    ? [5173, ...range(5174, 5199), ...range(3000, 3020)]
    : [...range(5173, 5199), ...range(3000, 3020)],

  bridge: [
    ...range(4273, 4299),
    ...range(4000, 4099),
  ],

  cServer: [
    ...range(6273, 6299),
    ...range(9090, 9099),
  ],
};

const globallyAvoid = new Set([
  20, 21, 22, 25, 53, 67, 68, 80, 110, 123, 143, 389, 443, 445,
  465, 587, 993, 995, 1433, 1521, 2049, 2375, 2376, 3306, 3389,
  5432, 5900, 6379, 8000, 8080, 8443, 9200, 9300,
]);

function isPortAvailable(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    if (globallyAvoid.has(port)) {
      resolve(false);
      return;
    }

    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => {
        resolve(true);
      });
    });

    server.listen(port, host);
  });
}

async function pickPort(label, candidatePorts, alreadySelected) {
  for (const port of candidatePorts) {
    if (alreadySelected.has(port)) {
      continue;
    }

    const available = await isPortAvailable(port);

    if (available) {
      alreadySelected.add(port);
      return port;
    }
  }

  throw new Error(`No available port found for ${label}.`);
}

async function main() {
  console.log("[ports] Scanning safe local development ports...");

  const selected = new Set();

  const frontendPort = await pickPort("frontend", candidates.frontend, selected);
  const bridgePort = await pickPort("bridge", candidates.bridge, selected);
  const cPort = await pickPort("C TLS server", candidates.cServer, selected);

  const frontendHost = isCodespaces ? "0.0.0.0" : "127.0.0.1";

  const config = {
    PRIVATEVAULT_FRONTEND_HOST: frontendHost,
    PRIVATEVAULT_FRONTEND_PORT: String(frontendPort),
    PRIVATEVAULT_BRIDGE_PORT: String(bridgePort),
    PRIVATEVAULT_C_PORT: String(cPort),
    PRIVATEVAULT_C_HOST: "127.0.0.1",
    PRIVATEVAULT_FRONTEND_ORIGIN: `http://127.0.0.1:${frontendPort}`,
  };

  const shellLines = [
    `export PRIVATEVAULT_FRONTEND_HOST="${config.PRIVATEVAULT_FRONTEND_HOST}"`,
    `export PRIVATEVAULT_FRONTEND_PORT="${config.PRIVATEVAULT_FRONTEND_PORT}"`,
    `export PRIVATEVAULT_BRIDGE_PORT="${config.PRIVATEVAULT_BRIDGE_PORT}"`,
    `export PRIVATEVAULT_C_PORT="${config.PRIVATEVAULT_C_PORT}"`,
    `export PRIVATEVAULT_C_HOST="${config.PRIVATEVAULT_C_HOST}"`,
    `export PRIVATEVAULT_FRONTEND_ORIGIN="${config.PRIVATEVAULT_FRONTEND_ORIGIN}"`,
    "",
  ];

  fs.writeFileSync(shellOutputPath, shellLines.join("\n"));
  fs.writeFileSync(jsonOutputPath, JSON.stringify(config, null, 2));

  console.log("[ports] Assigned ports:");
  console.log(`[ports] Frontend UI:  http://127.0.0.1:${frontendPort}`);
  console.log(`[ports] Node bridge:  http://127.0.0.1:${bridgePort}`);
  console.log(`[ports] C TLS server: 127.0.0.1:${cPort}`);
  console.log(`[ports] Wrote ${path.basename(shellOutputPath)}.`);
}

main().catch((err) => {
  console.error(`[ports] ${err.message}`);
  process.exit(1);
});