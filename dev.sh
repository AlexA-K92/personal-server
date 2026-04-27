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
  exit 1
fi

if ! command_exists make; then
  echo "[error] make is required but not installed."
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
echo "Default local demo admin:"
echo "username: alex.araki"
echo "password: demo-password"
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