module.exports = {
    apps: [
      {
        name: "backend",
        script: "server/server.js",
        cwd: "./server",
        watch: true,
        env: {
          NODE_ENV: "production"
        }
      },
      {
        name: "frontend",
        script: "npm",
        args: "run dev",
        cwd: "./",
        watch: false,
        interpreter: "none"
      }
    ]
  };
  