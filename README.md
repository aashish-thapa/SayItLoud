## 1. User Profile Page

### Description

The user profile page displays a user's profile information and a list of their posts.

### Frontend Implementation

- **Route:** `/profile/[username]`
- **Client Component:** `src/app/(main)/profile/[username]/ProfileClient.tsx`
- **Data Fetching:** The component fetches the entire feed using `getFeed()` from `src/lib/api.ts` and then filters the posts by the `username` from the URL.

### Backend Requirements

- A dedicated API endpoint to fetch a user's profile information by their username.
- A dedicated API endpoint to fetch all posts by a specific user.

---

## 2. Single Post Page

### Description

The single post page displays a specific post and its comments.

### Frontend Implementation

- **Route:** `/post/[id]`
- **Client Component:** `src/app/(main)/post/[id]/PostClient.tsx`
- **Data Fetching:** The component fetches the post data using `getPostById(id)` from `src/lib/api.ts`, where `id` is from the URL.

### Backend Requirements

- The current `getPostById(id)` function is sufficient, but it's important to ensure it returns the full post object with comments.

---

## 3. Feed Page

### Description

The feed page displays a list of all posts from all users.

### Frontend Implementation

- **Route:** `/feed`
- **Component:** `src/app/(main)/feed/page.tsx`
- **Data Fetching:** The component fetches all posts using `getFeed()` from `src/lib/api.ts`.

### Backend Requirements

- The current `getFeed()` function is sufficient. No new endpoint is immediately required for this feature, but pagination should be considered for the future.

---

## 4. User and Post Types

For reference, here are the TypeScript types used for `User` and `Post` objects on the frontend. The backend should aim to provide data that conforms to these structures.

- **Types file:** `src/types/index.ts`
