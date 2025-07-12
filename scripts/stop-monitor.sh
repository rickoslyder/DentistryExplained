#!/bin/bash

# Stop Performance Monitor Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
PID_FILE="$LOG_DIR/monitor.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Stopping Dentistry Explained Performance Monitor${NC}"

# Check if using PM2
if command -v pm2 &> /dev/null && pm2 list | grep -q "performance-monitor"; then
    echo -e "${YELLOW}Stopping PM2 process...${NC}"
    pm2 stop performance-monitor
    pm2 delete performance-monitor
    echo -e "${GREEN}PM2 process stopped${NC}"
else
    # Stop direct process
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${YELLOW}Stopping monitor process (PID: $PID)...${NC}"
            kill "$PID"
            sleep 2
            
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                echo -e "${RED}Process didn't stop gracefully, forcing...${NC}"
                kill -9 "$PID"
            fi
            
            echo -e "${GREEN}Monitor stopped${NC}"
        else
            echo -e "${YELLOW}Monitor process not running${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}No PID file found${NC}"
        
        # Try to find and kill by name
        PIDS=$(pgrep -f "performance-monitor.js")
        if [ ! -z "$PIDS" ]; then
            echo -e "${YELLOW}Found monitor processes: $PIDS${NC}"
            kill $PIDS
            echo -e "${GREEN}Processes stopped${NC}"
        else
            echo -e "${YELLOW}No monitor processes found${NC}"
        fi
    fi
fi

# Clean up pipes
rm -f "$LOG_DIR"/*.pipe

echo -e "${GREEN}Monitor stopped successfully${NC}"