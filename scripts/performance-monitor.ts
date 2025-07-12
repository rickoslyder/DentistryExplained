#!/usr/bin/env node

/**
 * Performance Monitoring Background Process
 * Continuously monitors application performance and logs metrics
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { format } from 'date-fns'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') })

// Configuration
const MONITOR_INTERVAL = 60000 // 1 minute
const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds
const LOG_DIR = path.join(__dirname, '../logs')
const LOG_FILE = path.join(LOG_DIR, `performance-${format(new Date(), 'yyyy-MM-dd')}.log`)
const ERROR_LOG_FILE = path.join(LOG_DIR, `performance-errors-${format(new Date(), 'yyyy-MM-dd')}.log`)

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for background tasks
)

// Monitoring targets
const ENDPOINTS = [
  { name: 'Homepage', url: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000' },
  { name: 'API Health', url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/health` },
  { name: 'Search API', url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/search?q=test` },
  { name: 'Analytics API', url: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/analytics/performance?range=1h` },
]

// Logging functions
function log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    pid: process.pid,
  }

  const logLine = JSON.stringify(logEntry) + '\n'

  // Write to appropriate log file
  if (level === 'ERROR') {
    fs.appendFileSync(ERROR_LOG_FILE, logLine)
  }
  fs.appendFileSync(LOG_FILE, logLine)

  // Also log to console
  console.log(`[${timestamp}] [${level}] ${message}`, data || '')
}

// Performance check function
async function checkEndpointPerformance(endpoint: { name: string; url: string }) {
  const startTime = Date.now()
  let status = 'success'
  let statusCode = 0
  let error: string | null = null

  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'DentistryExplained-Monitor/1.0',
      },
      timeout: 10000, // 10 second timeout
    })

    statusCode = response.status
    if (!response.ok) {
      status = 'error'
      error = `HTTP ${statusCode}`
    }
  } catch (err) {
    status = 'error'
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  const responseTime = Date.now() - startTime

  return {
    endpoint: endpoint.name,
    url: endpoint.url,
    status,
    statusCode,
    responseTime,
    error,
    timestamp: new Date().toISOString(),
  }
}

// Database health check
async function checkDatabaseHealth() {
  const startTime = Date.now()
  let status = 'healthy'
  let error: string | null = null
  let metrics = {
    connectionTime: 0,
    queryTime: 0,
    activeConnections: 0,
  }

  try {
    // Test connection and basic query
    const { data, error: dbError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (dbError) {
      throw dbError
    }

    metrics.connectionTime = Date.now() - startTime

    // Get database metrics if available
    const { data: perfData } = await supabase
      .from('performance_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    metrics.queryTime = Date.now() - startTime - metrics.connectionTime

  } catch (err) {
    status = 'unhealthy'
    error = err instanceof Error ? err.message : 'Unknown database error'
  }

  return {
    service: 'PostgreSQL (Supabase)',
    status,
    metrics,
    error,
    timestamp: new Date().toISOString(),
  }
}

// System metrics collection (mock for now - would use OS utilities in production)
async function collectSystemMetrics() {
  // In production, you would use:
  // - os.cpus() for CPU usage
  // - os.freemem() / os.totalmem() for memory
  // - disk usage libraries
  // - network statistics

  return {
    cpu: {
      usage: Math.random() * 30 + 20, // Mock: 20-50%
      cores: 4,
    },
    memory: {
      used: Math.random() * 4 + 2, // Mock: 2-6 GB
      total: 8, // Mock: 8 GB
      percentage: Math.random() * 30 + 40, // Mock: 40-70%
    },
    disk: {
      used: Math.random() * 50 + 100, // Mock: 100-150 GB
      total: 500, // Mock: 500 GB
      percentage: Math.random() * 10 + 20, // Mock: 20-30%
    },
    network: {
      bytesIn: Math.floor(Math.random() * 1000000), // Mock
      bytesOut: Math.floor(Math.random() * 1000000), // Mock
    },
    timestamp: new Date().toISOString(),
  }
}

// Aggregate and store metrics
async function storeMetrics(metrics: {
  endpoints: any[]
  database: any
  system: any
}) {
  try {
    // Calculate aggregates
    const avgResponseTime = metrics.endpoints.reduce((sum, e) => sum + e.responseTime, 0) / metrics.endpoints.length
    const errorCount = metrics.endpoints.filter(e => e.status === 'error').length
    const successRate = ((metrics.endpoints.length - errorCount) / metrics.endpoints.length) * 100

    // Store in database
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        url: 'system-monitor',
        metrics_summary: {
          avg_response_time: avgResponseTime,
          success_rate: successRate,
          error_count: errorCount,
          cpu_usage: metrics.system.cpu.usage,
          memory_usage: metrics.system.memory.percentage,
          disk_usage: metrics.system.disk.percentage,
          database_status: metrics.database.status,
        },
        raw_metrics: metrics,
      })

    if (error) {
      log('ERROR', 'Failed to store metrics in database', error)
    } else {
      log('INFO', 'Metrics stored successfully', {
        avgResponseTime,
        successRate,
        errorCount,
      })
    }

    // Alert on critical issues
    if (successRate < 90 || avgResponseTime > 5000) {
      log('WARN', 'Performance degradation detected', {
        successRate,
        avgResponseTime,
        failedEndpoints: metrics.endpoints.filter(e => e.status === 'error').map(e => e.endpoint),
      })
    }

    if (metrics.system.cpu.usage > 80 || metrics.system.memory.percentage > 90) {
      log('WARN', 'High resource utilization', {
        cpu: metrics.system.cpu.usage,
        memory: metrics.system.memory.percentage,
      })
    }

  } catch (error) {
    log('ERROR', 'Failed to process metrics', error)
  }
}

// Main monitoring loop
async function runMonitoring() {
  log('INFO', 'Starting performance monitoring', {
    pid: process.pid,
    intervals: {
      monitor: MONITOR_INTERVAL,
      healthCheck: HEALTH_CHECK_INTERVAL,
    },
    endpoints: ENDPOINTS.map(e => e.name),
  })

  // Run endpoint checks
  setInterval(async () => {
    try {
      const endpointResults = await Promise.all(
        ENDPOINTS.map(endpoint => checkEndpointPerformance(endpoint))
      )

      const failedChecks = endpointResults.filter(r => r.status === 'error')
      if (failedChecks.length > 0) {
        log('WARN', `${failedChecks.length} endpoint(s) failed health check`, failedChecks)
      }

      // Collect all metrics
      const [database, system] = await Promise.all([
        checkDatabaseHealth(),
        collectSystemMetrics(),
      ])

      // Store aggregated metrics
      await storeMetrics({
        endpoints: endpointResults,
        database,
        system,
      })

    } catch (error) {
      log('ERROR', 'Monitoring cycle failed', error)
    }
  }, MONITOR_INTERVAL)

  // Quick health checks
  setInterval(async () => {
    try {
      // Just check the main homepage
      const health = await checkEndpointPerformance(ENDPOINTS[0])
      if (health.status === 'error') {
        log('ERROR', 'Health check failed', health)
      }
    } catch (error) {
      log('ERROR', 'Health check error', error)
    }
  }, HEALTH_CHECK_INTERVAL)

  // Log rotation at midnight
  setInterval(() => {
    const now = new Date()
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      log('INFO', 'Rotating log files')
      // In production, you'd implement proper log rotation
      // For now, just update the log file paths
    }
  }, 60000) // Check every minute
}

// Graceful shutdown
process.on('SIGTERM', () => {
  log('INFO', 'Received SIGTERM, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  log('INFO', 'Received SIGINT, shutting down gracefully')
  process.exit(0)
})

process.on('uncaughtException', (error) => {
  log('ERROR', 'Uncaught exception', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  log('ERROR', 'Unhandled rejection', reason)
  process.exit(1)
})

// Start monitoring
runMonitoring()