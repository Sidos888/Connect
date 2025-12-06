# 🚀 Quick Setup Guide

## The Problem
This is a **hybrid app** (Next.js web + Capacitor mobile), which requires:
- Building the web app
- Syncing to iOS/Android
- Managing dev servers

## The Solution: One Command

### iOS Sync (Simplified)
```bash
npm run sync:ios
```

This single command:
1. ✅ Builds your Next.js app
2. ✅ Syncs with iOS
3. ✅ Restarts dev server automatically

### Open in Xcode
```bash
npm run open:ios
```

---

## Why It's Complex

### The Architecture
- **Next.js** → Web framework (React)
- **Capacitor** → Wraps web app as native iOS/Android
- **Static Export** → Required for Capacitor (no server-side rendering)

### The Workflow
1. **Development**: Edit code → See changes in browser (`npm run dev`)
2. **Mobile Testing**: Build → Sync → Test in iOS simulator/device
3. **Production**: Build → Sync → Deploy

### Common Issues
- ❌ Forgetting to build before sync
- ❌ Dev server conflicts (port 3000)
- ❌ Multiple manual steps

---

## Daily Workflow

### For Web Development
```bash
npm run dev
```
Just edit code, changes hot-reload automatically.

### For iOS Testing
```bash
npm run sync:ios    # Build + sync + restart dev server
npm run open:ios    # Open in Xcode
```

### For Android Testing
```bash
npm run build
npx cap sync android
npx cap open android
```

---

## Troubleshooting

### "Port 3000 already in use"
The sync script automatically kills and restarts the dev server. If it doesn't:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### "Build failed"
Check for TypeScript errors:
```bash
npm run build
```

### "Sync failed"
Make sure you have:
- ✅ Xcode installed (for iOS)
- ✅ CocoaPods installed (`sudo gem install cocoapods`)
- ✅ iOS folder exists (`ios/` directory)

---

## What Makes It "Difficult"

1. **Two Build Systems**: Next.js (web) + Capacitor (mobile)
2. **Static Export Requirement**: Can't use Next.js server features
3. **Multiple Steps**: Build → Sync → Test (not just "run")
4. **Platform-Specific**: iOS needs Xcode, Android needs Android Studio

**But now it's just: `npm run sync:ios` ✨**

