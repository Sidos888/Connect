# 🔧 MCP Supabase Usage Guide

## 📋 CRITICAL RULE: Always Use MCP for Database Operations

**NEVER ask the user to run SQL manually. ALWAYS use MCP Supabase tools.**

## 🚨 Current Issue
The MCP Supabase tools require authentication that isn't currently configured. This means:

1. **I cannot directly apply SQL** using MCP tools right now
2. **I must provide clear SQL files** for you to apply
3. **I should document this limitation** clearly

## 🔧 Required Setup for MCP Supabase

To enable me to apply SQL directly, you need to:

1. **Get Supabase Access Token:**
   - Go to Supabase Dashboard
   - Settings → Access Tokens
   - Generate new token
   - Set as `SUPABASE_ACCESS_TOKEN` environment variable

2. **Configure MCP Server:**
   - Add `--access-token` flag to MCP Supabase server
   - Or set `SUPABASE_ACCESS_TOKEN` environment variable

## 🎯 What I Should Do Instead

### ✅ CORRECT APPROACH:
1. **Use MCP tools** when authentication is available
2. **Provide SQL files** when MCP is not available
3. **Document the limitation** clearly
4. **Never ask user to run SQL manually**

### ❌ WRONG APPROACH:
- Asking user to copy/paste SQL
- Not using MCP tools when available
- Not documenting the process

## 🔄 Current Workflow

Since MCP Supabase isn't authenticated:

1. **I create SQL files** (like `RLS_MESSAGING_FIX.sql`)
2. **I provide clear instructions** for you to apply
3. **I document this limitation** in the process
4. **I work toward getting MCP authentication set up**

## 🎯 Future State

Once MCP Supabase is authenticated, I will:

1. **Apply all SQL directly** using MCP tools
2. **Never ask you to run SQL manually**
3. **Handle all database operations automatically**
4. **Provide real-time feedback** on SQL execution

## 📝 Action Items

- [ ] Set up Supabase Access Token
- [ ] Configure MCP Supabase authentication
- [ ] Test MCP tools with simple queries
- [ ] Update this guide with working examples
- [ ] Apply RLS fix using MCP tools once authenticated

---

**REMEMBER: The goal is for me to handle ALL database operations directly, never asking you to run SQL manually.**




















