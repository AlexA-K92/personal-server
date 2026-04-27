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

echo "[dev] Preparing local TLS certificates and local demo user..."
node scripts/setup-local.js

echo ""
echo "[dev] Starting C server, bridge, and frontend..."
echo ""
echo "Frontend will be available at:"
echo "http://127.0.0.1:5173"
echo ""
echo "Guest access:"
echo "Click Continue as Guest in the UI."
echo ""
echo "Admin access:"
echo "Admin login is owner-only."
echo "The owner must privately create personal-server-c/user_db.txt with:"
echo "npm run create:owner"
echo ""
echo "Press Control+C to stop everything."
echo ""

for port in 9090 4000 5173; do
  if lsof -nP -iTCP:$port -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[error] Port $port is already in use."
    echo "Run this to see the process:"
    echo "lsof -nP -iTCP:$port -sTCP:LISTEN"
    echo ""
    echo "Then kill it with:"
    echo "kill -9 <PID>"
    exit 1
  fi
done

npm run dev