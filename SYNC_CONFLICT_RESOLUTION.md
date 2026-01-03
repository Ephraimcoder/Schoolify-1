# Appwrite Sync Conflict Resolution System

## Overview

The manual sync system now includes intelligent conflict resolution that compares local vs Appwrite tasks and merges them properly.

## Conflict Resolution Logic

### **"Last Write Wins" Principle**

- Uses `last_synced_at` timestamp to determine which version is newer
- Newer version overwrites older version
- Prevents data loss while ensuring most recent changes are kept

## Sync Process Flow

### 1. **Comparison Phase**

- Fetches all Appwrite tasks for the user
- Creates maps for efficient lookup
- Compares local tasks with Appwrite tasks

### 2. **Conflict Resolution**

For each task, the system handles these scenarios:

#### **Local Task Exists + Appwrite Task Exists**

```
if (localLastSynced > appwriteLastSynced) {
  // Local is newer - update Appwrite
  await updateTaskInAppwrite(localTask.$id, localTaskData);
} else if (appwriteLastSynced > localLastSynced) {
  // Appwrite is newer - update local (handled by merge)
  conflicts.push({ type: "appwrite_won", reason: "Appwrite task was newer" });
} else {
  // Same timestamp - no conflict
  console.log("No conflict - tasks are in sync");
}
```

#### **Local Task Only (No Appwrite ID)**

```
// Create new task in Appwrite
const createdTask = await createTaskInAppwrite(localTask, userId);
```

#### **Appwrite Task Only (Not in Local)**

```
// Merge into local WatermelonDB
await mergeAppwriteTasksToLocal([appwriteTask]);
```

### 3. **Results Processing**

- **Created**: New tasks added to Appwrite
- **Updated**: Existing tasks updated in Appwrite
- **Conflicts**: Tasks that needed resolution
- **Failed**: Tasks that couldn't be processed

## Conflict Types

### **local_won**

- Local task was newer than Appwrite version
- Appwrite was updated with local data

### **appwrite_won**

- Appwrite task was newer than local version
- Local task should be updated (handled by merge system)

### **appwrite_only**

- Task exists only in Appwrite
- Automatically merged into local database

## Usage Examples

### **Manual Sync with Conflict Resolution**

```javascript
const { syncAllTasksToAppwrite } = useAppwriteSync();

const handleSync = async () => {
  try {
    const results = await syncAllTasksToAppwrite();

    console.log(`Created: ${results.created.length}`);
    console.log(`Updated: ${results.updated.length}`);
    console.log(`Conflicts: ${results.conflicts.length}`);

    // Conflicts are automatically resolved
    // Appwrite-only tasks are automatically merged locally
  } catch (error) {
    console.error("Sync failed:", error);
  }
};
```

### **Conflict Details**

When conflicts occur, the system provides detailed information:

```javascript
results.conflicts = [
  {
    type: "local_won",
    taskId: "task_123",
    reason: "Local task was newer",
  },
  {
    type: "appwrite_only",
    taskId: "task_456",
    task: {
      /* full task data */
    },
    reason: "Task exists only in Appwrite",
  },
];
```

## Benefits

✅ **No Data Loss**: Last write wins principle
✅ **Automatic Merging**: Appwrite-only tasks added locally
✅ **Detailed Logging**: Full visibility into sync process
✅ **Manual Control**: User decides when to sync
✅ **Conflict Detection**: Clear indication of what was resolved
✅ **Bidirectional Sync**: Changes flow both ways

## Implementation Files

- **`services/appwriteSyncService.js`**: Core sync logic with conflict resolution
- **`context/TasksContext.jsx`**: React integration with merge functions
- **`app/(tabs)/Profile.jsx`**: UI for testing and monitoring

## Testing

Use the Profile tab's "Appwrite Sync Test" section to:

1. Create sample tasks
2. Modify existing tasks locally
3. Sync to see conflict resolution in action
4. Check console logs for detailed sync information

The system ensures data integrity while providing maximum flexibility for manual synchronization.
