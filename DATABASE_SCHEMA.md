# Firebase Database Schema

## Collections Structure

### 1. users/{uid}
```
{
  uid: string,
  email: string,
  handle: string,
  name: string,
  totalStars: number,
  canCreateSpace: boolean,
  joinedAt: timestamp
}
```

### 2. journals/{journalId}
```
{
  userId: string,
  authorName: string,
  authorHandle: string,
  title: string,
  content: string,
  excerpt: string,
  mood: string,
  visibility: 'public' | 'private' | 'space',
  spaceId: string | null,
  tags: string[],
  imageUrl: string | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Subcollection: journals/{journalId}/notes/{noteId}
```
{
  userId: string,
  authorName: string,
  authorHandle: string,
  content: string,
  starred: boolean,
  createdAt: timestamp,
  starredAt?: timestamp
}
```

### 3. spaces/{spaceId}
```
{
  name: string,
  description: string,
  inviteCode: string,
  createdBy: string,
  createdAt: timestamp
}
```

#### Subcollection: spaces/{spaceId}/members/{userId}
```
{
  joinedAt: timestamp
}
```

### 4. userSpaces/{userId}_{spaceId}
```
{
  userId: string,
  spaceId: string,
  joinedAt: timestamp
}
```

### 5. notifications/{notificationId}
```
{
  userId: string,
  type: 'note' | 'star' | 'milestone',
  fromUserId: string,
  fromUserName: string,
  journalId: string,
  noteId?: string,
  createdAt: timestamp,
  read: boolean
}
```

## Relationships

- Users can create multiple journals
- Users can join multiple spaces via userSpaces junction table
- Spaces have members subcollection for quick membership queries
- Journals can belong to spaces (spaceId field)
- Journals have notes subcollection for comments
- Notifications track user interactions