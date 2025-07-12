#!/bin/bash

# Run Next.js dev server in background with logging

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs/dev"
PID_FILE="$LOG_DIR/dev.pid"
LOG_FILE="$LOG_DIR/dev_background.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create log directory
mkdir -p "$LOG_DIR"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Dev server already running with PID: $PID${NC}"
        echo -e "View logs: ${GREEN}tail -f $LOG_FILE${NC}"
        echo -e "Stop server: ${RED}npm run dev:stop${NC}"
        exit 0
    else
        # Clean up stale PID file
        rm "$PID_FILE"
    fi
fi

echo -e "${GREEN}Starting Next.js dev server in background...${NC}"

# Start the dev server in background
nohup npm run dev > "$LOG_FILE" 2>&1 &
PID=$!

# Save PID
echo $PID > "$PID_FILE"

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ps -p "$PID" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Dev server started successfully!${NC}"
    echo ""
    echo -e "Server PID: ${YELLOW}$PID${NC}"
    echo -e "Log file: ${YELLOW}$LOG_FILE${NC}"
    echo ""
    echo -e "${GREEN}Useful commands:${NC}"
    echo -e "  View logs:    ${YELLOW}tail -f $LOG_FILE${NC}"
    echo -e "  Follow logs:  ${YELLOW}npm run dev:logs:tail${NC}"
    echo -e "  Stop server:  ${YELLOW}npm run dev:stop${NC}"
    echo ""
    
    # Show initial output
    echo -e "${GREEN}Initial server output:${NC}"
    echo "----------------------------------------"
    tail -n 20 "$LOG_FILE"
else
    echo -e "${RED}✗ Failed to start dev server${NC}"
    echo -e "Check the log file for errors: ${YELLOW}$LOG_FILE${NC}"
    exit 1
fi