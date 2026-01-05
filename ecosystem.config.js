module.exports = {
  apps: [{
    name: 'tms',
    script: 'serve',
    args: '-s build -l 3000',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/tms-error.log',
    out_file: './logs/tms-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};

