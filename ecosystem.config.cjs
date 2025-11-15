module.exports = {
  apps: [{
    name: 'kushi-backend',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    time: true,
    // Restart configuration
    exp_backoff_restart_delay: 100,
    max_restarts: 10,
    min_uptime: '10s',
    autorestart: true
  }]
}
