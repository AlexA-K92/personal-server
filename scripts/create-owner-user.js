const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const rootDir = path.join(__dirname, "..");
const userDbPath = path.join(rootDir, "personal-server-c", "user_db.txt");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function askHidden(query) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);

    const wasRaw = stdin.isRaw;
    if (stdin.setRawMode) {
      stdin.setRawMode(true);
    }

    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";

    function onData(char) {
      char = String(char);

      if (char === "\n" || char === "\r" || char === "\u0004") {
        if (stdin.setRawMode) {
          stdin.setRawMode(Boolean(wasRaw));
        }

        stdin.pause();
        stdin.removeListener("data", onData);
        stdout.write("\n");
        resolve(value);
      } else if (char === "\u0003") {
        process.exit(1);
      } else if (char === "\u007f") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    }

    stdin.on("data", onData);
  });
}

async function main() {
  console.log("Create PrivateVault owner/admin credential");
  console.log("This creates personal-server-c/user_db.txt locally.");
  console.log("Do not commit user_db.txt to GitHub.\n");

  const usernameInput = await ask("Owner admin username: ");
  const username = usernameInput.trim().toLowerCase();

  if (!username) {
    console.error("Admin username is required.");
    rl.close();
    process.exit(1);
  }

  const password = await askHidden("Owner admin password: ");

  if (!password) {
    console.error("Admin password is required.");
    rl.close();
    process.exit(1);
  }

  const confirmPassword = await askHidden("Confirm admin password: ");

  if (password !== confirmPassword) {
    console.error("Passwords do not match.");
    rl.close();
    process.exit(1);
  }

  const salt = crypto.randomBytes(16);

  const key = crypto.pbkdf2Sync(
    password,
    salt,
    100000,
    32,
    "sha256"
  );

  const entry = `${username}:ADMIN:${salt.toString("hex")}:${key.toString("hex")}\n`;

  fs.writeFileSync(userDbPath, entry, { mode: 0o600 });

  console.log("\nOwner credential created successfully.");
  console.log(`Admin username: ${username}`);
  console.log("Admin password: not displayed or stored.");
  console.log(`Credential file: ${userDbPath}`);
  console.log("\nImportant: user_db.txt is ignored by Git and should never be committed.");

  rl.close();
}

main();