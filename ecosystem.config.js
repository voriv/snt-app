module.exports = {
  apps: [
    {
      name: 'snt-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/snt-app',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
      max_memory_restart: '200M',
      instances: 1,
    },
    {
      name: 'snt-ws',
      script: 'ws-server/dist/index.js',
      cwd: '/var/www/snt-app',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 3001,
      },
      max_memory_restart: '100M',
      instances: 1,
    },
  ],
};
