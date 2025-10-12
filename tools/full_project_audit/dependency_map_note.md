# Dependency Map Note

**Date:** October 12, 2025

## Status: Not Generated

The dependency visualization (`dependency_map.svg`) could not be generated during this audit.

### Attempted Tool
- **dependency-cruiser** with Graphviz dot output

### Why It Failed
```
ERROR: Can't open a config file (.dependency-cruiser.(c)js) at the default location.
```

### Alternative Approach for Future

To generate a dependency graph for this project, you can:

**Option 1: Configure dependency-cruiser**
```bash
# Initialize configuration
npx dependency-cruiser --init

# Generate graph
npx depcruise src --output-type dot | dot -T svg > dependency_map.svg
```

**Option 2: Use Madge**
```bash
# Install
npm install -g madge

# Generate circular dependency report
madge --circular --extensions ts,tsx src/

# Generate visual graph
madge --image dependency_map.svg src/
```

**Option 3: Use TypeScript compiler**
```bash
# Generate dependency tree
tsc --noEmit --listFiles > dependency_tree.txt
```

## Manual Dependency Analysis

Based on manual code review, here are the key dependency patterns:

### High-Level Module Structure

```
app/ (Pages)
  ↓ depends on
components/ (UI)
  ↓ depends on
lib/ (Business Logic & Services)
  ↓ depends on
Supabase, External Libraries
```

### Key Dependencies

1. **Supabase** - Database, Auth, Storage, Realtime
   - Used in 33 files
   - 436 query calls throughout codebase

2. **Lucide React** - Icons
   - Used in 20+ files
   - Full library imported (687KB)

3. **Zustand** - State Management
   - Central store in `src/lib/store.ts`
   - Used by 15+ components

4. **Next.js** - Framework
   - Routing (file-based)
   - Image optimization (disabled)
   - API routes (1 route found)

5. **React** - UI Library
   - All components
   - Hooks used extensively

### Circular Dependencies

No circular dependencies detected in initial analysis, but potential concerns:

1. **Tight Coupling:**
   - `authContext.tsx` imports `store.ts`
   - `store.ts` imports `simpleChatService.ts`
   - Creates indirect coupling chain

2. **Service Dependencies:**
   - `simpleChatService.ts` depends on `dedupeStore`, `network utils`
   - `connectionsService.ts` depends on `supabaseClient`
   - All services depend on Supabase client

### Dependency Issues Found

1. **Feature Coupling:**
   - Chat components import from profile components
   - Menu components import from chat components
   - No clear feature boundaries

2. **Utility Coupling:**
   - Many files import directly from `supabaseClient`
   - No service layer abstraction
   - Direct database coupling throughout

3. **Component Coupling:**
   - Large components import 10-15 other components
   - Deep import trees
   - Hard to track dependencies

### Recommendations

1. **Add service layer** to decouple from Supabase
2. **Feature-based organization** to reduce cross-feature imports
3. **Dependency injection** for services
4. **Interface/abstraction layer** between components and services

### Generating Your Own Graph

To generate a visual dependency graph:

1. Install Graphviz: `brew install graphviz` (macOS)
2. Install dependency-cruiser: `npm install -g dependency-cruiser`
3. Initialize config: `npx dependency-cruiser --init`
4. Generate graph:
   ```bash
   npx depcruise src \
     --include-only "^src" \
     --output-type dot \
     | dot -T svg > dependency_map.svg
   ```

This will create a visual representation of how your modules depend on each other.

---

**Note:** While the visual graph wasn't generated, the manual analysis above provides the key insights about dependency structure and coupling issues in the codebase.

