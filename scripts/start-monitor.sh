#!/bin/bash

# Start Performance Monitor Script
# This script compiles and starts the performance monitoring service

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Dentistry Explained Performance Monitor${NC}"
echo "======================================"

# Create log directory if it doesn't exist
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${YELLOW}Creating log directory...${NC}"
    mkdir -p "$LOG_DIR"
fi

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo -e "${RED}TypeScript compiler not found. Installing...${NC}"
    npm install -g typescript
fi

# Compile TypeScript
echo -e "${YELLOW}Compiling TypeScript...${NC}"
cd "$PROJECT_DIR"
npx tsc scripts/performance-monitor.ts --outDir scripts --module commonjs --target es2017 --esModuleInterop

if [ $? -ne 0 ]; then
    echo -e "${RED}TypeScript compilation failed${NC}"
    exit 1
fi

# Check if running with PM2
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}Starting with PM2...${NC}"
    pm2 start ecosystem.config.js --only performance-monitor
    echo -e "${GREEN}Monitor started! View logs with: pm2 logs performance-monitor${NC}"
else
    # Run directly with output piping
    echo -e "${YELLOW}PM2 not found. Running directly...${NC}"
    echo -e "${GREEN}Starting monitor (output will be piped to logs)${NC}"
    
    # Create named pipes for real-time log viewing
    STDOUT_PIPE="$LOG_DIR/monitor.stdout.pipe"
    STDERR_PIPE="$LOG_DIR/monitor.stderr.pipe"
    
    # Clean up old pipes
    rm -f "$STDOUT_PIPE" "$STDERR_PIPE"
    mkfifo "$STDOUT_PIPE" "$STDERR_PIPE"
    
    # Start log tailers in background
    tail -f "$STDOUT_PIPE" | while read line; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line" >> "$LOG_DIR/performance-$(date '+%Y-%m-%d').log"
        echo "$line"
    done &
    
    tail -f "$STDERR_PIPE" | while read line; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $line" >> "$LOG_DIR/performance-errors-$(date '+%Y-%m-%d').log"
        echo -e "${RED}ERROR: $line${NC}"
    done &
    
    # Run the monitor
    node "$PROJECT_DIR/scripts/performance-monitor.js" > "$STDOUT_PIPE" 2> "$STDERR_PIPE" &
    MONITOR_PID=$!
    
    echo -e "${GREEN}Monitor started with PID: $MONITOR_PID${NC}"
    echo "Monitor PID: $MONITOR_PID" > "$LOG_DIR/monitor.pid"
    
    # Instructions
    echo ""
    echo "======================================"
    echo -e "${GREEN}Monitor is running in background${NC}"
    echo ""
    echo "To view logs:"
    echo "  tail -f $LOG_DIR/performance-$(date '+%Y-%m-%d').log"
    echo ""
    echo "To stop the monitor:"
    echo "  $SCRIPT_DIR/stop-monitor.sh"
    echo "======================================"
fi