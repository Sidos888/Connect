# Chat System Setup Guide

## Overview
The chat system requires database tables and policies to be set up in Supabase before it can function properly. The errors you're seeing are because these tables don't exist yet.

## Setup Steps

### 1. Create Chat Database Tables
Run the following SQL script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of sql/setup-chat-system.sql
```

This script will create:
- `chats` table - stores chat conversations
- `chat_participants` table - stores who is in each chat
- `chat_messages` table - stores individual messages
- Proper indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

### 2. Test the Setup
After running the setup script, you can test if everything is working by running:

```sql
-- Copy and paste the contents of sql/test-chat-system.sql
```

### 3. Create Test Users (Optional)
If you want to test the chat functionality, you can create test users and connections:

```sql
-- Copy and paste the contents of sql/create-test-users.sql
-- Follow the instructions in the comments to replace UUIDs with actual user IDs
```

## Authentication Requirements

The chat system requires users to be authenticated. Make sure you have:

1. **User Authentication**: Users must be logged in through the existing auth system
2. **Account Records**: Each user must have a corresponding record in the `accounts` table
3. **Connections**: Users must have connections in the `connections` table to chat with each other

## How It Works

1. **Contact Selection**: The system loads friends from the `connections` table
2. **Chat Creation**: When users select contacts, the system creates or finds existing chats
3. **Message Sending**: Messages are stored in the `chat_messages` table
4. **Real-time Updates**: The system uses Supabase real-time subscriptions for live messaging

## Troubleshooting

### Common Issues

1. **"Chat system not set up" error**: Run the setup script in Supabase
2. **"User not authenticated" error**: Make sure the user is logged in
3. **"No contacts found" error**: Make sure users have connections in the `connections` table
4. **Empty error objects `{}`**: This was fixed in the latest code updates

### Error Messages

The system now provides clear error messages:
- `CHAT_NOT_SETUP`: Database tables don't exist
- `User not authenticated`: User needs to log in
- `User ID is required`: Authentication issue
- `No contacts found`: No friends in connections table

## Next Steps

After setting up the database:

1. **Test Authentication**: Make sure users can log in
2. **Create Connections**: Add some friend connections
3. **Test Chat Flow**: Try selecting contacts and creating chats
4. **Test Messaging**: Send some test messages

## Files Created

- `sql/setup-chat-system.sql` - Main setup script
- `sql/test-chat-system.sql` - Test script to verify setup
- `sql/create-test-users.sql` - Script to create test data
- `CHAT_SETUP.md` - This guide

The chat system is now ready to be set up! 🚀
