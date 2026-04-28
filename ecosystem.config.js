/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const { getPortConfig, projectRoot } = require("./scripts/port-config");

const { staffPort, adminPort } = getPortConfig();
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");

module.exports = {
  apps: [
    {
      name: "frontend-staff",
      script: nextBin,
      args: `start -p ${staffPort}`,
      env: { NODE_ENV: "production", NEXT_PUBLIC_APP_ROLE: "staff" },
    },
    {
      name: "frontend-admin",
      script: nextBin,
      args: `start -p ${adminPort}`,
      env: { NODE_ENV: "production", NEXT_PUBLIC_APP_ROLE: "admin" },
    },
  ],
};
