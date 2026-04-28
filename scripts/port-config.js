/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filename = ".env") {
  const envPath = path.join(projectRoot, filename);

  if (!fs.existsSync(envPath)) {
    return {};
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return acc;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return acc;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key) {
        acc[key] = value;
      }

      return acc;
    }, {});
}

function getPortConfig() {
  const fileEnv = loadEnvFile();

  return {
    staffPort:
      process.env.NEXT_PUBLIC_STAFF_PORT ||
      fileEnv.NEXT_PUBLIC_STAFF_PORT ||
      "9090",
    adminPort:
      process.env.NEXT_PUBLIC_ADMIN_PORT ||
      fileEnv.NEXT_PUBLIC_ADMIN_PORT ||
      "9999",
  };
}

module.exports = {
  getPortConfig,
  projectRoot,
};
