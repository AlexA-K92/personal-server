# PrivateVault

PrivateVault is a local personal database/security prototype with:

- React + Vite frontend
- Node/Express bridge
- C server using Berkeley sockets
- OpenSSL TLS transport
- Salted password-derived admin credential storage
- Nonce-based challenge-response authentication
- Guest/Admin RBAC

## Quick Start: GitHub Codespaces

The easiest way to run this project is with GitHub Codespaces. This avoids local setup issues with Node, OpenSSL, make, gcc, and platform-specific build tools.

1. Open the repository on GitHub.
2. Click the green **Code** button.
3. Click the **Codespaces** tab.
4. Click **Create codespace on main**.
5. Wait for the environment to finish setting up.
6. In the Codespaces terminal, run:

```bash
./dev.sh



## Prerequisites

Before running the project, install:

- Node.js and npm
- OpenSSL
- make
- gcc or clang

### macOS

```bash
xcode-select --install
brew install openssl@3 pkg-config
