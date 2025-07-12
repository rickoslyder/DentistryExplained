#!/bin/bash

# Run Next.js dev server with logging

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs/dev"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
LOG_FILE="$LOG_DIR/dev_${TIMESTAMP}.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create log directory
mkdir -p "$LOG_DIR"

echo -e "${GREEN}Starting Next.js dev server with logging...${NC}"
echo -e "${YELLOW}Log file: $LOG_FILE${NC}"
echo ""
echo "Server output will be displayed here and saved to the log file."
echo "Press Ctrl+C to stop."
echo "----------------------------------------"

# Run npm dev and pipe to both console and log file
npm run dev 2>&1 | tee "$LOG_FILE"