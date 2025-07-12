#!/bin/bash

# View Performance Monitor Logs

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
LOG_TYPE="all"
FOLLOW=false
LINES=50

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -e|--errors)
            LOG_TYPE="errors"
            shift
            ;;
        -p|--performance)
            LOG_TYPE="performance"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -f, --follow      Follow log output (like tail -f)"
            echo "  -n, --lines NUM   Show last NUM lines (default: 50)"
            echo "  -e, --errors      Show only error logs"
            echo "  -p, --performance Show only performance logs"
            echo "  -h, --help        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Function to display logs with formatting
display_logs() {
    local file=$1
    local type=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}Log file not found: $file${NC}"
        return
    fi
    
    echo -e "${BLUE}=== $type Logs ===${NC}"
    echo -e "${BLUE}File: $file${NC}"
    echo ""
    
    if [ "$FOLLOW" = true ]; then
        tail -f "$file" | while IFS= read -r line; do
            # Color code based on log level
            if [[ $line == *"\"level\":\"ERROR\""* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line == *"\"level\":\"WARN\""* ]]; then
                echo -e "${YELLOW}$line${NC}"
            elif [[ $line == *"\"level\":\"INFO\""* ]]; then
                echo -e "${GREEN}$line${NC}"
            else
                echo "$line"
            fi
        done
    else
        tail -n "$LINES" "$file" | while IFS= read -r line; do
            # Color code based on log level
            if [[ $line == *"\"level\":\"ERROR\""* ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ $line == *"\"level\":\"WARN\""* ]]; then
                echo -e "${YELLOW}$line${NC}"
            elif [[ $line == *"\"level\":\"INFO\""* ]]; then
                echo -e "${GREEN}$line${NC}"
            else
                echo "$line"
            fi
        done
    fi
}

# Function to parse and format JSON logs
parse_json_logs() {
    local file=$1
    
    if command -v jq &> /dev/null; then
        if [ "$FOLLOW" = true ]; then
            tail -f "$file" | jq -r '. | "\(.timestamp) [\(.level)] \(.message) \(.data // "")"'
        else
            tail -n "$LINES" "$file" | jq -r '. | "\(.timestamp) [\(.level)] \(.message) \(.data // "")"'
        fi
    else
        display_logs "$file" "$2"
    fi
}

# Main logic
TODAY=$(date '+%Y-%m-%d')

case $LOG_TYPE in
    errors)
        LOG_FILE="$LOG_DIR/performance-errors-$TODAY.log"
        if command -v jq &> /dev/null; then
            echo -e "${RED}=== Error Logs (Parsed) ===${NC}"
            parse_json_logs "$LOG_FILE" "Error"
        else
            display_logs "$LOG_FILE" "Error"
        fi
        ;;
    performance)
        LOG_FILE="$LOG_DIR/performance-$TODAY.log"
        if command -v jq &> /dev/null; then
            echo -e "${GREEN}=== Performance Logs (Parsed) ===${NC}"
            parse_json_logs "$LOG_FILE" "Performance"
        else
            display_logs "$LOG_FILE" "Performance"
        fi
        ;;
    all)
        # Show both logs
        if [ "$FOLLOW" = true ]; then
            # Can't follow multiple files easily, so follow performance log
            LOG_FILE="$LOG_DIR/performance-$TODAY.log"
            echo -e "${YELLOW}Following performance log (use -e for errors only)${NC}"
            echo ""
            if command -v jq &> /dev/null; then
                parse_json_logs "$LOG_FILE" "All"
            else
                display_logs "$LOG_FILE" "All"
            fi
        else
            # Show last N lines from both files
            echo -e "${GREEN}=== Recent Performance Logs ===${NC}"
            LOG_FILE="$LOG_DIR/performance-$TODAY.log"
            if [ -f "$LOG_FILE" ]; then
                tail -n "$LINES" "$LOG_FILE" | while IFS= read -r line; do
                    if [[ $line == *"\"level\":\"ERROR\""* ]]; then
                        echo -e "${RED}$line${NC}"
                    elif [[ $line == *"\"level\":\"WARN\""* ]]; then
                        echo -e "${YELLOW}$line${NC}"
                    else
                        echo -e "${GREEN}$line${NC}"
                    fi
                done
            fi
            
            echo ""
            echo -e "${RED}=== Recent Error Logs ===${NC}"
            ERROR_FILE="$LOG_DIR/performance-errors-$TODAY.log"
            if [ -f "$ERROR_FILE" ]; then
                tail -n "$LINES" "$ERROR_FILE" | while IFS= read -r line; do
                    echo -e "${RED}$line${NC}"
                done
            fi
        fi
        ;;
esac

# Show summary statistics
if [ "$FOLLOW" != true ]; then
    echo ""
    echo -e "${BLUE}=== Log Statistics ===${NC}"
    
    if [ -f "$LOG_DIR/performance-$TODAY.log" ]; then
        TOTAL_LINES=$(wc -l < "$LOG_DIR/performance-$TODAY.log")
        ERROR_COUNT=$(grep -c '"level":"ERROR"' "$LOG_DIR/performance-$TODAY.log" 2>/dev/null || echo "0")
        WARN_COUNT=$(grep -c '"level":"WARN"' "$LOG_DIR/performance-$TODAY.log" 2>/dev/null || echo "0")
        INFO_COUNT=$(grep -c '"level":"INFO"' "$LOG_DIR/performance-$TODAY.log" 2>/dev/null || echo "0")
        
        echo -e "Total log entries: ${TOTAL_LINES}"
        echo -e "${GREEN}INFO: ${INFO_COUNT}${NC}"
        echo -e "${YELLOW}WARN: ${WARN_COUNT}${NC}"
        echo -e "${RED}ERROR: ${ERROR_COUNT}${NC}"
    fi
fi