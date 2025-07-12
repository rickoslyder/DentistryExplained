#!/bin/bash

# Stop background Next.js dev server

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs/dev"
PID_FILE="$LOG_DIR/dev.pid"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping dev server (PID: $PID)...${NC}"
        kill "$PID"
        
        # Wait for process to stop
        sleep 2
        
        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${RED}Process didn't stop gracefully, forcing...${NC}"
            kill -9 "$PID"
        fi
        
        rm "$PID_FILE"
        echo -e "${GREEN}✓ Dev server stopped${NC}"
    else
        echo -e "${YELLOW}Dev server not running (stale PID file)${NC}"
        rm "$PID_FILE"
    fi
else
    echo -e "${YELLOW}Dev server not running${NC}"
    
    # Try to find Next.js process
    NEXT_PIDS=$(pgrep -f "next dev")
    if [ ! -z "$NEXT_PIDS" ]; then
        echo -e "${YELLOW}Found Next.js processes: $NEXT_PIDS${NC}"
        echo -e "${RED}Kill them? (y/n)${NC}"
        read -r response
        if [ "$response" = "y" ]; then
            kill $NEXT_PIDS
            echo -e "${GREEN}✓ Processes stopped${NC}"
        fi
    fi
fi