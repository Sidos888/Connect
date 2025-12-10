# Engineer's Solution Analysis

## Engineer's Diagnosis

**The Problem:**
- Async orchestration lives inside a component's useEffect
- When `signOut()` updates AuthContext (user → null), component re-renders/unmounts
- This interrupts the async function execution
- Steps after the first `await` never execute (not because React cancels promises, but because the component lifecycle is destroyed)

**The Root Cause:**
- The async flow is tied to component lifecycle
- Component re-render/unmount interrupts execution
- This is a structural issue, not a React hooks issue

## Engineer's Solution

**Move entire sign-out orchestration outside component lifecycle:**

1. **Stable owner** - AuthService singleton, context-level state machine, or AuthContext itself
2. **Dumb UI** - `/signing-out` page subscribes to sign-out status
3. **Fire-and-forget** - Page triggers `runSignOutFlow()` once
4. **Orchestrator handles everything** - Cleanup, delays, status updates, redirect

## Why This Is Correct

### ✅ **The Engineer is Right:**

1. **Component lifecycle interruption:**
   - Async functions in useEffect are tied to component lifecycle
   - When component re-renders/unmounts, execution context is lost
   - This is why Steps 2-6 never execute

2. **Structural solution needed:**
   - Refs, dependency arrays, different hooks won't fix this
   - Need to move orchestration outside component lifecycle
   - Service layer is the right pattern

3. **Matches WeChat/Facebook:**
   - Major apps use service layer for orchestration
   - UI components just subscribe to state
   - Orchestration persists across component lifecycles

## Implementation Plan

### 1. Enhance AuthService

**Current:** Only handles cleanup (Supabase, Zustand, React Query, storage)

**Needed:** Full orchestration including:
- Cleanup (existing)
- Status updates (signing-out → redirecting)
- Delays (wait for state propagation)
- Redirect to /explore

### 2. Add Status Tracking

**Option A: Event-based**
- AuthService emits events: `sign-out:started`, `sign-out:redirecting`, `sign-out:complete`
- Signing-out page listens to events and updates UI

**Option B: State in AuthService**
- AuthService maintains sign-out status state
- Signing-out page reads status from service
- Service updates status as flow progresses

### 3. Restructure Signing-Out Page

**Current:** Component orchestrates the flow

**New:** Component subscribes to status and triggers flow once

```typescript
// Page triggers flow once
useEffect(() => {
  authService.runSignOutFlow(); // Fire-and-forget
}, []);

// Page subscribes to status
const status = authService.getSignOutStatus(); // or use event listener
```

### 4. Handle Redirect in Service

**Current:** Page handles redirect after delays

**New:** AuthService handles redirect after orchestration completes

```typescript
// In AuthService
async runSignOutFlow() {
  // 1. Update status: 'signing-out'
  // 2. Perform cleanup
  // 3. Wait for state propagation
  // 4. Update status: 'redirecting'
  // 5. Final delay
  // 6. Navigate to /explore (using NavigationService)
}
```

## Benefits of This Approach

### ✅ **Solves the Core Issue:**
- Orchestration persists across component lifecycles
- Async flow always completes
- No interruption from re-renders

### ✅ **Better Architecture:**
- Separation of concerns (UI vs. orchestration)
- Service layer handles business logic
- UI just displays state

### ✅ **More Reliable:**
- Works even if component unmounts
- Works even if multiple re-renders occur
- Matches patterns from major apps

### ✅ **Easier to Maintain:**
- All sign-out logic in one place (AuthService)
- UI is simple and focused
- Easy to test and debug

## Implementation Details

### AuthService Enhancement

```typescript
class AuthService {
  private signOutStatus: 'idle' | 'signing-out' | 'redirecting' = 'idle';
  private statusListeners: Set<(status: string) => void> = new Set();

  getSignOutStatus(): string {
    return this.signOutStatus;
  }

  onStatusChange(callback: (status: string) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  async runSignOutFlow(): Promise<void> {
    if (this.signOutStatus !== 'idle') return; // Already running
    
    this.updateStatus('signing-out');
    
    try {
      // Step 1: Cleanup
      await this.signOut(); // Existing method
      
      // Step 2: Clear React Query
      const queryClient = (window as any).__queryClient;
      if (queryClient?.clear) queryClient.clear();
      
      // Step 3: Wait for state propagation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Update status
      this.updateStatus('redirecting');
      
      // Step 5: Final delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 6: Redirect
      navigationService.navigateToExplore();
    } catch (error) {
      // Error handling
      this.updateStatus('redirecting');
      setTimeout(() => {
        navigationService.navigateToExplore();
      }, 2000);
    }
  }

  private updateStatus(status: 'idle' | 'signing-out' | 'redirecting'): void {
    this.signOutStatus = status;
    this.statusListeners.forEach(callback => callback(status));
  }
}
```

### Signing-Out Page (Dumb UI)

```typescript
export default function Page() {
  const [status, setStatus] = useState<'signing-out' | 'redirecting'>('signing-out');

  useEffect(() => {
    // Trigger flow once (fire-and-forget)
    authService.runSignOutFlow();

    // Subscribe to status updates
    const unsubscribe = authService.onStatusChange((newStatus) => {
      if (newStatus === 'signing-out' || newStatus === 'redirecting') {
        setStatus(newStatus);
      }
    });

    return unsubscribe;
  }, []);

  // Render UI based on status
  return (
    <div>
      <h3>{status === 'signing-out' ? 'Signing out...' : 'Redirecting...'}</h3>
    </div>
  );
}
```

## Summary

**The engineer is 100% correct.** The solution is:
1. ✅ Move orchestration to AuthService (stable owner)
2. ✅ Make signing-out page a dumb UI (subscribes to status)
3. ✅ Service handles everything (cleanup, delays, redirect)
4. ✅ Fire-and-forget pattern (trigger once, let service handle it)

**This will fix the issue because:**
- Orchestration is outside component lifecycle
- Async flow persists across re-renders
- Matches WeChat/Facebook patterns
- More reliable and maintainable
