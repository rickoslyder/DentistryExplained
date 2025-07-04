# API Error Handling Improvements

## Overview

This document summarizes the comprehensive error handling improvements implemented across all API routes in the Dentistry Explained application.

## Key Improvements

### 1. Standardized Error Response Structure

Created a consistent error response format across all API endpoints:

```typescript
{
  error: {
    message: string
    code: ErrorCode
    details?: any
    requestId: string
  }
}
```

### 2. Error Code Enum

Implemented standardized error codes for client-side handling:

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `INVALID_INPUT` - Validation failed
- `MISSING_REQUIRED_FIELD` - Required field missing
- `RESOURCE_NOT_FOUND` - Resource not found
- `DUPLICATE_RESOURCE` - Resource already exists
- `DATABASE_ERROR` - Database operation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Internal server error

### 3. Common Error Handlers

Created reusable error handlers in `/lib/api-errors.ts`:

- `ApiErrors.unauthorized()` - 401 responses
- `ApiErrors.forbidden()` - 403 responses
- `ApiErrors.notFound()` - 404 responses
- `ApiErrors.invalidInput()` - 400 validation errors
- `ApiErrors.duplicate()` - 409 conflict errors
- `ApiErrors.database()` - 500 database errors
- `ApiErrors.rateLimit()` - 429 rate limit errors
- `ApiErrors.internal()` - 500 internal errors

### 4. Middleware Utilities

Created middleware wrappers in `/lib/api-middleware.ts`:

- `withAuth()` - Authentication and authorization
- `withOptionalAuth()` - Optional authentication
- `withRateLimit()` - Rate limiting
- `withBodyLimit()` - Request body size limits
- `withCORS()` - CORS handling
- `compose()` - Middleware composition

### 5. Input Validation

Implemented comprehensive input validation using Zod schemas:

- Request body validation with detailed error messages
- Query parameter validation with type coercion
- File upload validation (type, size, extension)
- Pagination parameter validation with bounds

### 6. Database Error Mapping

Created intelligent database error mapping:

- Unique constraint violations → 409 Duplicate
- Foreign key violations → 400 Invalid Input
- No rows found → 404 Not Found
- Generic database errors → 500 with sanitized messages

## Route-Specific Improvements

### Search Routes (`/api/search`)

- Added rate limiting (100 req/min)
- Query parameter validation with Zod
- Non-blocking analytics tracking
- Graceful fallback for suggestion failures
- Request ID tracking

### Chat Routes (`/api/chat`)

- Message length validation (max 4000 chars)
- Rate limiting (30 messages/min)
- Body size limit (50KB)
- Streaming response error handling
- Session validation with proper 404s

### Bookmarks Routes (`/api/bookmarks`)

- Duplicate bookmark detection
- Existence validation before deletion
- Pagination with total count
- Rate limiting (50 operations/min)

### Professional Verification Routes

- File upload validation (type, size, extension)
- Document type enum validation
- Cleanup on upload failures
- Non-blocking activity logging
- Rate limiting for uploads (10/min)

### Other Routes

- **Chat Sessions**: Preview truncation, total count
- **Search Suggestions**: Rate limiting (200/min)
- **Glossary Search**: Fallback search strategy

## Error Logging

All errors are now logged with:

- Timestamp
- Error code
- Request ID
- Context information
- Stack traces (development only)

## Client Benefits

1. **Consistent Error Handling**: Frontend can rely on standardized error structure
2. **Better UX**: Specific error messages and codes for user feedback
3. **Retry Logic**: Rate limit headers for intelligent retry
4. **Debugging**: Request IDs for tracing issues
5. **Security**: No internal error details exposed in production

## Usage Example

```typescript
// Before
export async function POST(request: NextRequest) {
  try {
    // ... logic
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// After
const handler = compose(
  withRateLimit(60000, 50),
  withAuth
)(async (request: NextRequest, context) => {
  const { data, error } = validateRequestBody(body, schema)
  if (error) return error
  
  // ... logic with proper error handling
})

export const POST = handler
```

## Migration Notes

- All routes now export named functions (GET, POST, etc.)
- Authentication is handled by middleware
- Validation is centralized
- Error responses include request IDs
- Rate limiting is applied where appropriate

## Future Improvements

1. Implement distributed rate limiting with Redis
2. Add request/response logging middleware
3. Implement circuit breaker pattern for external services
4. Add OpenTelemetry tracing
5. Create error monitoring dashboard