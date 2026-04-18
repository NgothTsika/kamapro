# Fix: Characters Not Displaying in Collections

## Problem

Collections were showing on the home page, but displaying the message "No characters in this collection yet" even though characters were added to the collections in the admin panel.

## Root Cause

The home page was fetching collections from `/content/character-collections` endpoint, which only returns:

- `id`, `name`, `description`, `order`, `coverImage`, `characterCount`
- ❌ Does NOT include the `characters` array

The `CollectionCard` component checks for `collection.characters` to display the character carousel. Since this array was missing, it always showed the empty state.

## The Solution

Modified `home.tsx` to fetch full collection details for each collection:

### Before (Incomplete Data)

```typescript
const allCollections = await getCharacterCollections();
// Returns: [ { id, name, order, characterCount, ... } ]
// Missing: characters array!
setCollections(allCollections);
```

### After (Complete Data)

```typescript
const allCollections = await getCharacterCollections();
const sortedCollections = allCollections.sort((a, b) => a.order - b.order);

// Fetch full details (including characters) for each collection
const collectionsWithCharacters = await Promise.all(
  sortedCollections.map(async (collection) => {
    try {
      return await getCharacterCollection(collection.id); // ← Fetch details
    } catch (err) {
      return collection; // Fallback if detail fetch fails
    }
  }),
);

setCollections(collectionsWithCharacters);
```

## API Endpoints Used

### List Endpoint (Summary Only)

```
GET /content/character-collections
Response: { collections: [{ id, name, order, characterCount, ... }] }
```

### Detail Endpoint (Full Data with Characters)

```
GET /content/character-collections/:collectionId
Response: { collection: { id, name, characters: [...], ... } }
```

## Code Changes

### File: `clients/kamamobile/app/(tabs)/home.tsx`

1. Added import for `getCharacterCollection`:

```typescript
import {
  getDashboard,
  getCharacterCollections,
  getCharacterCollection, // ← Added
  type CharacterCollection,
} from "@/lib";
```

2. Updated the fetch logic to load each collection's characters:

```typescript
// Fetch full details (including characters) for each collection
const collectionsWithCharacters = await Promise.all(
  sortedCollections.map(async (collection) => {
    try {
      return await getCharacterCollection(collection.id);
    } catch (err) {
      console.warn(
        `Failed to load characters for collection ${collection.id}:`,
        err,
      );
      return collection;
    }
  }),
);

setCollections(collectionsWithCharacters);
```

## Result

✅ Collections now display with their characters
✅ Character carousel shows all added characters
✅ Empty state only shows if collection truly has no characters
✅ Graceful fallback if individual collection fetch fails

## Performance Note

This fetches N+1 requests (1 list + N detail requests). For better performance with many collections, you could:

1. Add a `?includeCharacters=true` query parameter to the list endpoint
2. Or fetch all collections in a batch query on the backend

For now, this solution works and provides complete data.
