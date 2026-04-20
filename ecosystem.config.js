module.exports = {
  apps: [{
    name: "frontend",
    script: "node_modules/next/dist/bin/next",
    args: "start -p 9090", 
    env: { NODE_ENV: "production" }
  }]
};