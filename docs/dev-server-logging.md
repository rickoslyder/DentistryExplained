# Dev Server Logging Guide

## Quick Start

### Option 1: Run with Live Logging (Recommended for Development)

```bash
# Simple logging - outputs to console and saves to file
npm run dev:log

# Advanced logging - categorizes output by type (errors, builds, API calls)
npm run dev:log:advanced
```

### Option 2: Run in Background (Recommended for Testing)

```bash
# Start dev server in background
npm run dev:background

# View logs in real-time
npm run dev:logs:tail

# Stop the background server
npm run dev:stop
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Normal dev server (no logging) |
| `npm run dev:log` | Dev server with simple logging |
| `npm run dev:log:advanced` | Dev server with categorized logging |
| `npm run dev:background` | Start dev server in background |
| `npm run dev:stop` | Stop background dev server |
| `npm run dev:logs:tail` | View background server logs |

## Log Files

All logs are saved in `logs/dev/`:

- **Simple logging**: `dev_YYYYMMDD_HHMMSS.log`
- **Advanced logging**:
  - `dev_all_*.log` - Complete output
  - `dev_errors_*.log` - Errors only
  - `dev_build_*.log` - Build/compilation messages
  - `dev_api_*.log` - API route calls
- **Background**: `dev_background.log`

## Examples

### Development Workflow

```bash
# Start dev with error tracking
npm run dev:log:advanced

# In another terminal, watch for errors
tail -f logs/dev/dev_errors_*.log
```

### Testing Workflow

```bash
# Start server in background
npm run dev:background

# Run tests while monitoring server
npm test & npm run dev:logs:tail

# Stop when done
npm run dev:stop
```

### Debugging Workflow

```bash
# Run with advanced logging
npm run dev:log:advanced

# After reproducing issue, check specific logs
grep "Error" logs/dev/dev_all_*.log
grep "/api/" logs/dev/dev_api_*.log
```

## Color Coding (Advanced Logging)

- 🔴 **Red**: Errors and exceptions
- 🟡 **Yellow**: Warnings
- 🟣 **Magenta**: Build/compilation messages  
- 🟢 **Green**: API calls
- 🔵 **Blue**: Server ready/started messages
- ⚪ **White**: General output

## Tips

1. **Log Rotation**: Logs are timestamped, so old logs won't be overwritten
2. **Disk Space**: Clean up old logs periodically: `rm logs/dev/dev_*_*.log`
3. **Performance**: Logging has minimal impact on dev server performance
4. **Searching**: Use `grep` to search through logs for specific patterns
5. **Monitoring**: Use `watch` to monitor log file sizes: `watch ls -lh logs/dev/`

## Troubleshooting

**Server won't start in background:**
- Check if port 3000 is already in use
- Look at the log file for startup errors

**Can't stop the server:**
- Use `ps aux | grep "next dev"` to find the process
- Kill manually: `kill -9 <PID>`

**Logs not appearing:**
- Ensure `logs/dev/` directory exists
- Check file permissions