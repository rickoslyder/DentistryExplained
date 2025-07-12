module.exports = {
  apps: [
    {
      // Main Next.js application
      name: 'dentistry-explained',
      script: 'npm',
      args: 'start',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: './logs/app-error.log',
      out_file: './logs/app-out.log',
      log_file: './logs/app-combined.log',
      time: true,
    },
    {
      // Performance monitoring service
      name: 'performance-monitor',
      script: './scripts/performance-monitor.js',
      instances: 1,
      exec_mode: 'fork',
      cron_restart: '0 0 * * *', // Restart daily at midnight
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/monitor-error.log',
      out_file: './logs/monitor-out.log',
      log_file: './logs/monitor-combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
}