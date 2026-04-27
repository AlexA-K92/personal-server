#!/usr/bin/env bash
set -e

echo ""
echo "======================================"
echo " PrivateVault Local Dev Startup"
echo "======================================"
echo ""

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

if ! command_exists node; then
  echo "[error] Node.js is required but not installed."
  exit 1
fi

if ! command_exists npm; then
  echo "[error] npm is required but not installed."
  exit 1
fi

if ! command_exists openssl; then
  echo "[error] OpenSSL is required but not installed."
  echo ""
  echo "Install instructions:"
  echo "  macOS:        brew install openssl@3 pkg-config"
  echo "  Ubuntu/Linux: sudo apt update && sudo apt install openssl libssl-dev"
  echo "  Windows:      use WSL Ubuntu, then install openssl libssl-dev"
  echo ""
  exit 1
fi

if ! command_exists make; then
  echo "[error] make is required but not installed."
  echo ""
  echo "Install instructions:"
  echo "  macOS:        xcode-select --install"
  echo "  Ubuntu/Linux: sudo apt update && sudo apt install build-essential"
  echo "  Windows:      use WSL Ubuntu, then install build-essential"
  echo ""
  exit 1
fi

echo "[dev] Installing root dependencies..."
npm install

echo "[dev] Installing frontend dependencies..."
npm --prefix personal-server-frontend install

echo "[dev] Installing bridge dependencies..."
npm --prefix personal-server-bridge install

echo "[dev] Assigning local development ports..."
node scripts/assign-ports.js

# shellcheck disable=SC1091
source .privatevault-ports.sh

echo "[dev] Preparing local TLS certificates and owner credential state..."
node scripts/setup-local.js

echo ""
echo "[dev] Starting C server, bridge, and frontend..."
echo ""
echo "Frontend will be available at:"
echo "http://127.0.0.1:${PRIVATEVAULT_FRONTEND_PORT}"
echo ""
echo "Assigned services:"
echo "Frontend UI:  http://127.0.0.1:${PRIVATEVAULT_FRONTEND_PORT}"
echo "Node bridge:  http://127.0.0.1:${PRIVATEVAULT_BRIDGE_PORT}"
echo "C TLS server: 127.0.0.1:${PRIVATEVAULT_C_PORT}"
echo ""
echo "Guest access:"
echo "Click Continue as Guest in the UI."
echo ""
echo "Admin access:"
echo "Admin login is owner-only."
echo "In Codespaces, admin login is enabled when these private secrets exist:"
echo "PRIVATEVAULT_OWNER_USER"
echo "PRIVATEVAULT_OWNER_PASSWORD"
echo ""
echo "Press Control+C to stop everything."
echo ""

npm run dev