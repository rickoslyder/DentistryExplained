# Performance Monitoring System

This document describes the performance monitoring system for Dentistry Explained.

## Overview

The performance monitoring system continuously tracks application health, response times, and resource usage. It runs as a background process and logs all metrics to both files and the database.

## Components

### 1. Performance Monitor Script (`scripts/performance-monitor.ts`)
- Monitors endpoint health (homepage, APIs)
- Tracks database performance
- Collects system metrics (CPU, memory, disk)
- Stores metrics in Supabase
- Logs to structured JSON files

### 2. Web Performance Metrics (`lib/performance-metrics.ts`)
- Collects Core Web Vitals (LCP, FID, CLS, TTFB)
- Tracks resource loading times
- Identifies long JavaScript tasks
- Sends metrics to the collection endpoint

### 3. Performance Dashboard (`components/admin/analytics/performance-dashboard.tsx`)
- Real-time visualization of metrics
- Core Web Vitals tracking
- Infrastructure health monitoring
- Error analysis and trends

## Quick Start

### Starting the Monitor

```bash
# Using npm scripts
npm run monitor:start

# Or directly
./scripts/start-monitor.sh
```

### Viewing Logs

```bash
# View recent logs
npm run monitor:logs

# Follow logs in real-time
npm run monitor:logs:follow

# View only errors
npm run monitor:logs:errors

# View with options
./scripts/view-logs.sh -f -n 100  # Follow last 100 lines
```

### Stopping the Monitor

```bash
npm run monitor:stop
# or
./scripts/stop-monitor.sh
```

## Deployment Options

### Option 1: PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.js

# View logs
pm2 logs performance-monitor

# Monitor dashboard
pm2 monit
```

### Option 2: Systemd Service

```bash
# Copy service file
sudo cp scripts/dentistry-performance-monitor.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable dentistry-performance-monitor
sudo systemctl start dentistry-performance-monitor

# View logs
sudo journalctl -u dentistry-performance-monitor -f
```

### Option 3: Docker

```dockerfile
# Add to your Dockerfile
RUN npm run build
RUN npx tsc scripts/performance-monitor.ts --outDir scripts

# Start monitor in container
CMD ["node", "scripts/performance-monitor.js"]
```

## Log Files

Logs are stored in the `logs/` directory:

- `performance-YYYY-MM-DD.log` - All performance metrics
- `performance-errors-YYYY-MM-DD.log` - Error logs only
- `monitor.pid` - Process ID for manual management

## Metrics Collected

### Endpoint Metrics
- Response time (ms)
- Status codes
- Error rates
- Availability

### Database Metrics
- Query execution time
- Connection pool status
- Slow query identification

### System Metrics
- CPU usage (%)
- Memory usage (%)
- Disk usage (%)
- Network I/O

### Web Vitals (from browser)
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- TTFB (Time to First Byte)

## Configuration

Edit `scripts/performance-monitor.ts` to adjust:

```typescript
const MONITOR_INTERVAL = 60000 // Check every minute
const HEALTH_CHECK_INTERVAL = 30000 // Quick check every 30s
```

## Alerts

The monitor will log warnings when:
- Endpoint response time > 5 seconds
- Success rate < 90%
- CPU usage > 80%
- Memory usage > 90%
- Database queries fail

## Database Schema

Metrics are stored in the `performance_metrics` table:

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY,
  timestamp TIMESTAMPTZ,
  url TEXT,
  metrics_summary JSONB,
  raw_metrics JSONB
);
```

## Troubleshooting

### Monitor won't start
- Check TypeScript compilation: `npx tsc scripts/performance-monitor.ts`
- Verify environment variables are loaded
- Check log directory permissions

### High resource usage
- Increase monitoring intervals
- Reduce number of endpoints
- Check for memory leaks in long-running process

### Missing metrics
- Verify Supabase connection
- Check network connectivity to endpoints
- Review error logs for failed checks

## Security Considerations

- Use read-only database credentials where possible
- Rotate service role keys regularly
- Limit log file access permissions
- Sanitize any user data in logs

## Future Enhancements

1. **Alerting System**
   - Email/SMS alerts for critical issues
   - Slack/Discord integration
   - PagerDuty integration

2. **Advanced Metrics**
   - Business KPI tracking
   - User journey analytics
   - A/B test performance impact

3. **Distributed Monitoring**
   - Multi-region monitoring
   - Load balancer health checks
   - CDN performance tracking

4. **Machine Learning**
   - Anomaly detection
   - Performance prediction
   - Auto-scaling recommendations