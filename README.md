# PrivateVault / Personal Server

PrivateVault is a public personal website and private admin database system.

The idea is simple:

- Visitors can open the site and continue as guests.
- Guests can view public information.
- Only the owner can sign in as admin.
- Admin login goes through a custom security pipeline using TLS, salted password-derived credentials, and a nonce-based challenge-response flow.

There is no public signup.  
There is no default admin account.  
The real admin credential is never committed to GitHub.

---

# Quick Start

## Easiest Option: GitHub Codespaces

This is the recommended way to run the project if you do not want to install Node, OpenSSL, `make`, compilers, or other tools on your computer.

### Steps

1. Open this repository on GitHub.

2. Click the green **Code** button.

3. Click the **Codespaces** tab.

4. Click **Create codespace on main**.

5. Wait for the browser-based editor to load.

6. Open the terminal at the bottom.

7. Run:

```bash
./dev.sh
```

8. When the app starts, Codespaces will show a forwarded port.

9. Open the forwarded frontend port, usually `5173`.

If the browser does not open automatically:

1. Click the **Ports** tab in Codespaces.
2. Find the port listed for the frontend.
3. Click **Open in Browser**.

---

# What You Should See

When the app opens, everyone sees the same entry page.

You can either:

```text
Continue as Guest
```

or:

```text
Sign in as Admin
```

Most users should click:

```text
Continue as Guest
```

Admin login is owner-only and will not work unless the owner’s private credentials are configured in that environment.

---

# Guest Access

Guest users can view public information, such as:

- Public profile
- Projects
- Technical skills
- Coursework
- Resume-style information
- Selected public writing or documents

Guest users cannot:

- Upload files
- Edit records
- Delete records
- Access private notes
- Access admin settings
- Access the encrypted vault
- Use server/admin controls

---

# Admin Access

Admin access is intended only for the site owner.

Admin login uses this pipeline:

```text
React login form
  ↓
Node bridge
  ↓
TLS connection to C server
  ↓
salt + password-derived key
  ↓
server nonce challenge
  ↓
HMAC response verification
  ↓
ADMIN role granted
```

The raw admin password is never stored.

The private credential file is:

```text
personal-server-c/user_db.txt
```

This file is generated privately and ignored by Git.

---

# Important Security Model

This repository does **not** include real admin credentials.

The following file should never be committed:

```text
personal-server-c/user_db.txt
```

That file stores credential data in this format:

```text
username:role:salt_hex:password_key_hex
```

The password itself is not stored.

The salt protects the stored credential.  
The nonce protects each login attempt from replay attacks.

---

# For Regular Visitors

If you are just trying to view the project:

1. Open it in Codespaces or run it locally.
2. Start the app with:

```bash
./dev.sh
```

3. Open the frontend URL printed in the terminal.
4. Click:

```text
Continue as Guest
```

You do not need an admin account.

If admin login fails, that is expected unless you are the owner and have configured the owner credentials.

---

# For the Owner

If you are the owner, admin login can work in two ways:

1. Locally, by creating a private `user_db.txt`.
2. In Codespaces, by using GitHub Codespaces secrets.

---

## Owner Setup: Local Machine

From the project root, run:

```bash
npm run create:owner
```

Enter your owner/admin username and password.

This creates:

```text
personal-server-c/user_db.txt
```

Then start the app:

```bash
./dev.sh
```

Log in with the username and password you created.

Do not commit `user_db.txt`.

---

## Owner Setup: GitHub Codespaces

To make admin login work from Codespaces on any device, add private Codespaces secrets.

In GitHub:

```text
Settings → Codespaces → Secrets
```

Add these two secrets:

```text
PRIVATEVAULT_OWNER_USER
PRIVATEVAULT_OWNER_PASSWORD
```

Give both secrets access to this repository.

Then create a new Codespace and run:

```bash
./dev.sh
```

If the secrets are configured correctly, the setup script will generate `user_db.txt` inside the Codespace automatically.

Other users do not receive your Codespaces secrets.

---

# Running Locally

The app starts three local services:

```text
React frontend
Node bridge
C TLS server
```

You do not need to manually choose ports. The project scans safe local development ports and assigns available ones.

After running:

```bash
./dev.sh
```

the terminal will print something like:

```text
Assigned services:
Frontend UI:  http://127.0.0.1:5173
Node bridge:  http://127.0.0.1:4273
C TLS server: 127.0.0.1:6273
```

Open the printed frontend URL.

---

# macOS Local Setup

If you are on Mac, Codespaces is still the easiest option. If you want to run locally, follow these steps.

## 1. Install Apple command line tools

Open Terminal and run:

```bash
xcode-select --install
```

If it says the tools are already installed, continue.

## 2. Install Homebrew

If Homebrew is not installed, run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, Homebrew may print “Next steps.” Follow those instructions.

For Apple Silicon Macs, this is usually:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

For Intel Macs, this is usually:

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

Verify Homebrew:

```bash
brew --version
```

## 3. Install required tools

```bash
brew install node openssl@3 pkg-config
```

Verify:

```bash
node -v
npm -v
make -v
openssl version
```

## 4. Clone and run

```bash
git clone https://github.com/AlexA-K92/personal-server.git
cd personal-server
./dev.sh
```

Open the frontend URL printed by the terminal.

---

# Windows Local Setup

For Windows, the recommended option is **GitHub Codespaces**.

If you want to run locally, use **WSL 2 with Ubuntu**.

Do **not** use Git Bash for this project. Git Bash is useful for Git commands, but this project needs a Linux-like build environment with `make`, a compiler, OpenSSL headers, Node.js, and npm.

## 1. Install WSL 2 Ubuntu

Open PowerShell as Administrator and run:

```powershell
wsl --install -d Ubuntu
```

Restart if prompted.

Then open Ubuntu from the Start menu.

## 2. Confirm WSL 2

In PowerShell, run:

```powershell
wsl --list --verbose
```

Ubuntu should show version `2`.

If it shows version `1`, run:

```powershell
wsl --set-default-version 2
wsl --set-version Ubuntu 2
```

If your distro is named `Ubuntu-24.04`, run:

```powershell
wsl --set-version Ubuntu-24.04 2
```

## 3. Install dependencies inside Ubuntu

Open Ubuntu and run:

```bash
sudo apt update
sudo apt install -y git curl build-essential openssl libssl-dev pkg-config
```

Install Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
make -v
openssl version
```

## 4. Clone and run inside Ubuntu

```bash
git clone https://github.com/AlexA-K92/personal-server.git
cd personal-server
./dev.sh
```

Open the frontend URL printed by the terminal in your normal Windows browser.

---

# Ubuntu / Debian Linux Setup

## 1. Install dependencies

```bash
sudo apt update
sudo apt install -y git curl build-essential openssl libssl-dev pkg-config
```

Install Node.js:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
node -v
npm -v
make -v
openssl version
```

## 2. Clone and run

```bash
git clone https://github.com/AlexA-K92/personal-server.git
cd personal-server
./dev.sh
```

Open the frontend URL printed by the terminal.

---

# Fedora Linux Setup

## 1. Install dependencies

```bash
sudo dnf install -y git gcc make openssl openssl-devel pkg-config nodejs npm
```

Verify:

```bash
node -v
npm -v
make -v
openssl version
```

## 2. Clone and run

```bash
git clone https://github.com/AlexA-K92/personal-server.git
cd personal-server
./dev.sh
```

Open the frontend URL printed by the terminal.

---

# Arch Linux Setup

## 1. Install dependencies

```bash
sudo pacman -Syu
sudo pacman -S git base-devel openssl pkg-config nodejs npm
```

Verify:

```bash
node -v
npm -v
make -v
openssl version
```

## 2. Clone and run

```bash
git clone https://github.com/AlexA-K92/personal-server.git
cd personal-server
./dev.sh
```

Open the frontend URL printed by the terminal.

---

# What `./dev.sh` Does

Running:

```bash
./dev.sh
```

does the following:

1. Checks that required tools are installed.
2. Installs root Node dependencies.
3. Installs frontend dependencies.
4. Installs bridge dependencies.
5. Scans safe local development ports.
6. Assigns ports for the frontend, bridge, and C server.
7. Generates local TLS certificates if missing.
8. Generates `user_db.txt` only if owner credentials are available.
9. Compiles and starts the C TLS server.
10. Starts the Node bridge.
11. Starts the React frontend.
12. Prints the URL to open.

---

# Dynamic Port Assignment

The app does not assume ports like `5173`, `4000`, or `9090` are always free.

Instead, it scans reasonable local development ports and assigns available ones.

It writes the selected ports to:

```text
.privatevault-ports.sh
.privatevault-ports.json
```

These files are generated locally and ignored by Git.

---

# Project Structure

```text
personal-server/
  README.md
  dev.sh
  package.json
  package-lock.json

  scripts/
    assign-ports.js
    setup-local.js
    create-owner-user.js

  personal-server-frontend/
    src/
    package.json
    vite.config.ts

  personal-server-bridge/
    server.js
    package.json

  personal-server-c/
    server.c
    client.c
    tls.c
    tls.h
    common.h
    Makefile
    certs/
      .gitkeep
```

---

# Authentication Design

Admin authentication uses two separate security values: a salt and a nonce.

## Salt

The salt is used for password storage.

```text
password + salt → password-derived key
```

The salt is stored in `user_db.txt`.

It does not change every login.

## Nonce

The nonce is used for login security.

The C server generates a fresh nonce every login attempt.

The bridge proves knowledge of the password-derived key by computing:

```text
HMAC-SHA256(password_key, nonce)
```

This prevents an old captured response from being reused.

---

# Role-Based Access Control

The app uses two roles:

```text
GUEST
ADMIN
```

Guest users can view public information.

Admin users can access private/admin sections.

Admin-only sections include:

- Server Connection
- Encrypted Vault
- Security Settings
- Future upload/edit/delete controls

Frontend RBAC hides UI from guests.  
Backend RBAC should be the final authority for production use.

---

# Files Ignored by Git

These files are generated locally and should not be committed:

```text
personal-server-c/user_db.txt
personal-server-c/certs/
personal-server-c/server
personal-server-c/client
personal-server-c/*.o
.privatevault-ports.sh
.privatevault-ports.json
node_modules/
.env
```

The only file committed inside `personal-server-c/certs/` should be:

```text
personal-server-c/certs/.gitkeep
```

---

# Protecting `user_db.txt`

The file:

```text
personal-server-c/user_db.txt
```

is sensitive.

It does not contain the raw password, but it does contain a password verifier.

It should be:

- ignored by Git
- never committed
- never shared
- kept private
- readable only by the owner/server process

If created by the owner scripts, it should be made read-only.

---

# Common Troubleshooting

## `node: command not found`

Install Node.js.

macOS:

```bash
brew install node
```

Ubuntu/WSL:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## `npm: command not found`

Install Node.js. npm is normally installed with Node.

---

## `make: command not found`

macOS:

```bash
xcode-select --install
```

Ubuntu/WSL:

```bash
sudo apt install -y build-essential
```

Fedora:

```bash
sudo dnf install -y make gcc
```

Arch:

```bash
sudo pacman -S base-devel
```

---

## OpenSSL errors

macOS:

```bash
brew install openssl@3 pkg-config
```

Ubuntu/WSL:

```bash
sudo apt install -y openssl libssl-dev pkg-config
```

Fedora:

```bash
sudo dnf install -y openssl openssl-devel pkg-config
```

Arch:

```bash
sudo pacman -S openssl pkg-config
```

---

## `bind: Address already in use`

A previous instance may still be running.

Check active processes:

```bash
lsof -nP -iTCP:9090 -sTCP:LISTEN
lsof -nP -iTCP:4000 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Kill the process:

```bash
kill -9 <PID>
```

Then rerun:

```bash
./dev.sh
```

With the dynamic port scanner, this should happen less often.

---

## `Permission denied: ./dev.sh`

Run:

```bash
chmod +x dev.sh
./dev.sh
```

---

## Guest login does nothing

Open the terminal where `./dev.sh` is running and check for errors.

Then test the guest route manually.

First, look at the assigned ports:

```bash
cat .privatevault-ports.json
```

Then use the printed frontend port:

```bash
curl -v -X POST http://127.0.0.1:<FRONTEND_PORT>/api/auth/guest
```

You should get a JSON response with role `GUEST`.

---

## Admin login says invalid credentials

This usually means one of these is true:

- `user_db.txt` does not exist.
- The username is wrong.
- The password is wrong.
- You are in an environment without owner secrets.
- You cleaned local files and need to recreate the owner credential.

For local owner setup:

```bash
npm run create:owner
./dev.sh
```

For Codespaces owner setup, make sure these secrets exist:

```text
PRIVATEVAULT_OWNER_USER
PRIVATEVAULT_OWNER_PASSWORD
```

Then create a fresh Codespace or restart the existing one.

---

# Development Commands

Start all services:

```bash
./dev.sh
```

Start services after setup:

```bash
npm run dev
```

Create owner/admin credential locally:

```bash
npm run create:owner
```

Clean generated local files:

```bash
npm run clean:local
```

Rebuild the C server manually:

```bash
cd personal-server-c
make clean
make
./server
```

---

# Production Direction

This project is currently a local development prototype.

For a real hosted public website, the intended architecture is:

```text
Public browser
  ↓ HTTPS
Web backend / reverse proxy
  ↓ internal TLS
C authentication server
  ↓
private user_db.txt
```

Before production use, the project should add:

- HTTPS for browser-to-backend traffic
- Secure HttpOnly cookie sessions
- Backend-enforced RBAC
- Rate limiting on admin login
- Admin session expiration
- Production database/storage
- Secure deployment-specific secret management
- Proper server monitoring and logging

The C server and `user_db.txt` should remain private/internal. They should not be directly exposed to the public internet.

---

# Intended Use

PrivateVault is intended to become a public personal website/database with:

- Guest access for public information
- Private admin access only for the owner
- A custom C-based TLS authentication pipeline
- A React-based dashboard UI
- Local and Codespaces-friendly development setup