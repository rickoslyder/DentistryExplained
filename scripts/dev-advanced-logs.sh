#!/bin/bash

# Advanced Next.js dev server logging with separate files for different output types

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs/dev"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Log files
ALL_LOG="$LOG_DIR/dev_all_${TIMESTAMP}.log"
ERROR_LOG="$LOG_DIR/dev_errors_${TIMESTAMP}.log"
BUILD_LOG="$LOG_DIR/dev_build_${TIMESTAMP}.log"
API_LOG="$LOG_DIR/dev_api_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Create log directory
mkdir -p "$LOG_DIR"

echo -e "${GREEN}Starting Next.js dev server with advanced logging...${NC}"
echo -e "${YELLOW}Logs will be saved to:${NC}"
echo -e "  All output: ${BLUE}$ALL_LOG${NC}"
echo -e "  Errors:     ${RED}$ERROR_LOG${NC}"
echo -e "  Build:      ${MAGENTA}$BUILD_LOG${NC}"
echo -e "  API calls:  ${GREEN}$API_LOG${NC}"
echo ""
echo "Press Ctrl+C to stop."
echo "=========================================="

# Function to process and categorize logs
process_logs() {
    while IFS= read -r line; do
        # Save to all logs
        echo "$line" >> "$ALL_LOG"
        
        # Display with color coding
        if [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"ERROR"* ]]; then
            echo -e "${RED}$line${NC}"
            echo "$line" >> "$ERROR_LOG"
        elif [[ $line == *"warn"* ]] || [[ $line == *"Warning"* ]] || [[ $line == *"WARN"* ]]; then
            echo -e "${YELLOW}$line${NC}"
        elif [[ $line == *"compiled"* ]] || [[ $line == *"building"* ]] || [[ $line == *"Built"* ]]; then
            echo -e "${MAGENTA}$line${NC}"
            echo "$line" >> "$BUILD_LOG"
        elif [[ $line == *"/api/"* ]] || [[ $line == *"API"* ]]; then
            echo -e "${GREEN}$line${NC}"
            echo "$line" >> "$API_LOG"
        elif [[ $line == *"ready"* ]] || [[ $line == *"started"* ]]; then
            echo -e "${BLUE}$line${NC}"
        else
            echo "$line"
        fi
    done
}

# Create a cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    echo -e "${GREEN}Logs saved to: $LOG_DIR${NC}"
    
    # Show summary
    if [ -f "$ERROR_LOG" ]; then
        ERROR_COUNT=$(wc -l < "$ERROR_LOG")
        echo -e "${RED}Total errors: $ERROR_COUNT${NC}"
    fi
    
    exit 0
}

# Set up signal handler
trap cleanup SIGINT SIGTERM

# Run npm dev and process output
npm run dev 2>&1 | process_logs