# Testing Guide for Connect Messaging System

This guide explains how to run tests, write new tests, and validate the messaging refactor.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI (browser-based test runner)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

---

## Test Structure

```
tests/
├── setup.ts                           # Global test configuration
├── unit/                              # Unit tests (fast, isolated)
│   ├── dedupeStore.test.ts           # Deduplication logic
│   ├── network.test.ts               # Retry and network utilities
│   └── simpleChatService.test.ts     # Core messaging logic
└── integration/                       # Integration tests (require database)
    └── messaging.test.ts              # End-to-end messaging flows
```

---

## Running Specific Tests

```bash
# Run only unit tests
npm test tests/unit

# Run specific test file
npm test tests/unit/dedupeStore.test.ts

# Run tests matching pattern
npm test --grep "idempotent"

# Run in watch mode (useful during development)
npm test tests/unit/network.test.ts
```

---

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Testing Async Operations

```typescript
it('should handle async operation', async () => {
  const operation = vi.fn().mockResolvedValue('success');
  
  const result = await myAsyncFunction(operation);
  
  expect(result).toBe('success');
  expect(operation).toHaveBeenCalled();
});
```

### Testing with Timers

```typescript
it('should delay execution', async () => {
  vi.useFakeTimers();
  
  const fn = vi.fn();
  const debounced = debounce(fn, 1000);
  
  debounced('test');
  expect(fn).not.toHaveBeenCalled();
  
  vi.advanceTimersByTime(1000);
  expect(fn).toHaveBeenCalledWith('test');
  
  vi.restoreAllMocks();
});
```

---

## Test Coverage Goals

### Current Coverage

Run `npm run test:coverage` to see detailed coverage report.

**Current Status:**
- DedupeStore: 100% ✅
- Network utilities: 100% ✅
- SimpleChatService core logic: ~70% ✅
- UI components: Not tested yet

**Coverage Goals:**
- Critical paths: 100%
- Service layer: 80%+
- UI components: 60%+
- Overall: 70%+

---

## Integration Testing

**Note:** Integration tests require a Supabase test database.

### Setup Test Supabase Project

1. **Create test project:**
   ```bash
   # In Supabase dashboard, create "Connect-Test" project
   # Use same region as production for consistency
   ```

2. **Apply migrations:**
   ```bash
   # Apply all migrations to test project
   # See STAGING_SETUP.md for detailed steps
   ```

3. **Configure test environment:**
   ```env
   # .env.test
   NEXT_PUBLIC_SUPABASE_URL=https://[TEST_PROJECT_REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

### Running Integration Tests

```bash
# Load test environment
cp .env.test .env.local

# Run integration tests
npm test tests/integration

# Cleanup test data after tests
# (Integration tests should clean up after themselves)
```

---

## Manual Testing Checklist

After applying the refactor, manually test these scenarios:

### Basic Functionality
- [ ] Send a message in direct chat
- [ ] Send a message in group chat
- [ ] Receive a message (open two browser windows)
- [ ] Messages appear in correct order
- [ ] No duplicate messages
- [ ] Typing indicators work
- [ ] Read receipts work

### Edge Cases
- [ ] Send message while offline (should queue)
- [ ] Go back online (should send queued message)
- [ ] Send same message twice quickly (should not duplicate)
- [ ] Load chat with 1000+ messages (should paginate)
- [ ] Scroll up to load older messages
- [ ] Send message with attachment
- [ ] Reply to a message
- [ ] React to a message
- [ ] Delete a message

### Stress Testing
- [ ] Send 100 messages rapidly (no duplicates)
- [ ] Open 10 chats simultaneously (no crashes)
- [ ] Toggle online/offline rapidly (messages queue/flush)
- [ ] Send messages from multiple devices (consistent ordering)

### Delivery Status (if enabled)
- [ ] Own messages show single checkmark (sent)
- [ ] When receiver opens chat, shows double checkmark (delivered)
- [ ] When receiver reads, shows blue double checkmark (read)

---

## Debugging Failed Tests

### Test Timeouts

```
Error: Test timed out in 5000ms
```

**Solution:** Increase timeout for async tests:

```typescript
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Mock Issues

```
TypeError: Cannot read property 'X' of undefined
```

**Solution:** Check `tests/setup.ts` mocks are correct for the services you're using.

### Database Connection Errors

```
Error: Could not connect to Supabase
```

**Solution:**
1. Check `.env.test` file exists and has correct values
2. Verify test project is running in Supabase dashboard
3. Check network connection

---

## Continuous Integration (CI/CD)

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:run
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Test Data Fixtures

### Creating Test Messages

```typescript
function createTestMessage(overrides: Partial<SimpleMessage> = {}): SimpleMessage {
  return {
    id: 'test-msg-123',
    chat_id: 'test-chat-456',
    sender_id: 'test-user-789',
    sender_name: 'Test User',
    text: 'Test message',
    created_at: new Date().toISOString(),
    seq: 1,
    client_generated_id: 'test-client-gen-id',
    status: 'sent',
    reactions: [],
    deleted_at: null,
    ...overrides
  };
}

// Usage
const message = createTestMessage({ text: 'Custom text', seq: 42 });
```

### Creating Test Chats

```typescript
function createTestChat(overrides: Partial<SimpleChat> = {}): SimpleChat {
  return {
    id: 'test-chat-123',
    type: 'direct',
    participants: [
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' }
    ],
    messages: [],
    unreadCount: 0,
    ...overrides
  };
}
```

---

## Best Practices

1. **Test one thing at a time** - Each test should verify a single behavior
2. **Use descriptive test names** - Should read like documentation
3. **Arrange-Act-Assert pattern** - Clear test structure
4. **Mock external dependencies** - Tests should be fast and isolated
5. **Test edge cases** - Not just happy paths
6. **Clean up after tests** - Prevent test pollution
7. **Use fake timers** - For testing time-based logic
8. **Test error cases** - Failures are important too

---

## Coverage Reports

After running `npm run test:coverage`:

```
File                           | % Stmts | % Branch | % Funcs | % Lines
-------------------------------|---------|----------|---------|--------
All files                      |   72.45 |    65.31 |   68.29 |   72.45
 lib/utils                     |     100 |      100 |     100 |     100
  dedupeStore.ts               |     100 |      100 |     100 |     100
  network.ts                   |     100 |      100 |     100 |     100
 lib                           |   68.12 |    60.45 |   65.23 |   68.12
  simpleChatService.ts         |   68.12 |    60.45 |   65.23 |   68.12
```

Open `coverage/index.html` in browser for detailed line-by-line coverage.

---

## Support

If tests are failing and you're stuck:

1. Check the error message carefully
2. Review `tests/setup.ts` for correct mocks
3. Enable debug logging in feature flags
4. Run tests in UI mode: `npm run test:ui`
5. Check for recent changes to service layer
6. Consult `docs/messaging.md` for API reference

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Status**: Complete

