# Memory Profile Guide

## Overview

The Memory Profile is a comprehensive view of all the memory items that Aluuna has collected and stored during your conversations. It allows you to review, edit, and manage your personal insights, inner parts, stuck points, coping tools, and session memories.

## Features

### 📱 Memory Profile Screen

The Memory Profile screen (`/memory-profile`) provides:

- **Organized Sections**: Memory items are grouped by type with color-coded icons
- **Search & Filter**: Find specific items quickly with text search and type filters
- **Edit & Delete**: Modify or remove any memory item
- **Rich Metadata**: View importance levels, themes, and timestamps
- **Refresh**: Update the view with latest data

### 🧠 Memory Item Types

#### 1. Inner Parts
- **What**: Different aspects of your personality identified during sessions
- **Icon**: 🧠 Psychology (Purple)
- **Metadata**: Role, tone, description
- **Example**: "Protector - Keeps me safe from emotional harm"

#### 3. Stuck Points
- **What**: Areas where you feel blocked or unable to progress
- **Icon**: 🚫 Block (Red)
- **Metadata**: Creation date
- **Example**: "I keep avoiding setting boundaries with my family"

#### 4. Coping Tools
- **What**: Strategies and tools that help you manage difficult situations
- **Icon**: 🩹 Healing (Green)
- **Metadata**: Creation date
- **Example**: "Deep breathing exercises help me stay calm"

#### 4. Session Memories
- **What**: Summaries of important conversations and key themes
- **Icon**: 📜 History (Orange)
- **Metadata**: Key themes, generation method
- **Example**: "Discussed work stress and identified need for better work-life balance"

> **Note**: Insights & Learnings are managed separately in the dedicated Insights screen, accessible from the profile menu.

## How to Use

### Accessing Memory Profile
1. Open the main session screen
2. Tap the profile icon (👤) in the top right
3. Select "Memory Profile" from the menu

### Accessing Insights
1. Open the main session screen
2. Tap the profile icon (👤) in the top right
3. Select "Insights" from the menu

### Searching & Filtering
- **Search**: Type in the search bar to find items containing specific text
- **Filter**: Use the filter buttons to show only specific types of memory items
- **Combined**: Use both search and filter together for precise results

### Editing Memory Items
1. Tap the edit icon (✏️) on any memory item
2. Modify the content in the modal
3. For inner parts, use format: "Role - Description"
4. Tap "Save" to update the item

### Deleting Memory Items
1. Tap the delete icon (🗑️) on any memory item
2. Confirm the deletion in the alert dialog
3. The item will be permanently removed

### Refreshing Data
- Tap the refresh icon (🔄) in the header to reload all memory data
- Useful after making changes or to see new items

## Database Structure

The memory profile uses several database tables:

### `memory_profiles`
- Stores user's stuck points and coping tools as arrays
- One record per user

### `insights`
- Stores individual insights with importance levels and themes
- Multiple records per user
- **Managed separately** in the dedicated Insights screen

### `inner_parts`
- Stores identified inner parts with roles and descriptions
- Multiple records per user

### `memory_snapshots`
- Stores session summaries with key themes
- Multiple records per user

### `crisis_flags`
- Stores crisis detection flags (not shown in profile)
- Multiple records per user

## Technical Implementation

### Memory Processing Service
The `MemoryProcessingService` class handles:
- Storing structured responses from AI conversations
- Retrieving memory data for display
- Managing different memory item types

### Memory Profile Screen
The memory profile screen (`app/memory-profile.tsx`) provides:
- Real-time data loading and filtering
- Inline editing with validation
- Responsive design matching the session screen
- Error handling and user feedback

### Navigation Integration
- Integrated into the profile menu
- Uses Expo Router for navigation
- Maintains consistent UI/UX with the main app

## Privacy & Security

- All memory items are private to each user
- Row-level security (RLS) policies ensure data isolation
- Users can only access their own memory data
- Deletions are permanent and cannot be undone

## Future Enhancements

Potential improvements for the memory profile:

1. **Export Functionality**: Allow users to export their memory data
2. **Memory Analytics**: Show trends and patterns over time
3. **Memory Sharing**: Share specific insights with therapists or support people
4. **Memory Templates**: Pre-defined templates for common memory types
5. **Bulk Operations**: Edit or delete multiple items at once
6. **Memory Tags**: Add custom tags to organize memory items
7. **Memory Search History**: Remember recent searches
8. **Memory Favorites**: Mark important items as favorites

## Troubleshooting

### Common Issues

**No memory items showing**
- Ensure you've had conversations with Aluuna
- Check your internet connection
- Try refreshing the screen

**Can't edit memory items**
- Verify you're logged in
- Check for any error messages
- Try refreshing and editing again

**Search not working**
- Clear the search text and try again
- Check that the filter is set to "All"
- Ensure the text you're searching for exists

**Items not updating**
- Tap the refresh button in the header
- Check for any error toasts
- Try navigating away and back to the screen

### Error Messages

- **"Failed to load memory profile"**: Network or authentication issue
- **"Failed to update memory item"**: Database or validation error
- **"Failed to delete memory item"**: Database permission or constraint error

## Support

If you encounter issues with the memory profile:
1. Check the troubleshooting section above
2. Try refreshing the app
3. Contact support with specific error messages
4. Include screenshots if possible 