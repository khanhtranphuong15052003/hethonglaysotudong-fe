/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { spawn } = require("child_process");
const { getPortConfig, projectRoot } = require("./port-config");

const mode = process.argv[2] || "dev";
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const { staffPort, adminPort } = getPortConfig();
const targetRole = process.argv[3];

const roles = [
  { name: "staff", port: staffPort },
  { name: "admin", port: adminPort },
].filter((role) => !targetRole || role.name === targetRole);

if (targetRole && roles.length === 0) {
  console.error(`Unknown role "${targetRole}". Use "staff" or "admin".`);
  process.exit(1);
}

const children = [];
let shuttingDown = false;

const killAll = (exitCode = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  process.exit(exitCode);
};

for (const role of roles) {
  const args =
    mode === "start"
      ? [nextBin, "start", "-p", role.port]
      : [nextBin, "dev", "--webpack", "-p", role.port];

  const child = spawn(process.execPath, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_ROLE: role.name,
    },
  });

  child.on("exit", (code) => {
    if (shuttingDown) {
      return;
    }

    console.error(
      `[${role.name}] Next process exited with code ${code ?? 0}. Stopping the remaining instance.`,
    );
    killAll(code ?? 0);
  });

  children.push(child);
}

process.on("SIGINT", () => killAll(0));
process.on("SIGTERM", () => killAll(0));
