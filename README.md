# Smart Bookmark App

A real-time bookmark manager built with Next.js, Supabase, and Google OAuth. Users can save, manage, and delete their bookmarks with instant updates across multiple tabs and devices.

🔗 **Live Demo:** [https://smart-bookmark-zeta-two.vercel.app](https://smart-bookmark-zeta-two.vercel.app)

---

## Features

- ✅ Google OAuth authentication (no email/password required)
- ✅ Add bookmarks with title and URL
- ✅ Private bookmarks (each user sees only their own)
- ✅ Real-time updates without page refresh
- ✅ Delete bookmarks instantly
- ✅ Responsive design with Tailwind CSS
- ✅ Deployed on Vercel with production-ready setup

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Realtime)
- **Styling:** Tailwind CSS
- **Authentication:** Google OAuth via Supabase
- **Deployment:** Vercel

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google Cloud Console project with OAuth credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/smart-bookmark.git
   cd smart-bookmark
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

---

## Supabase Setup

### 1. Create Database Table

Run this SQL in the Supabase SQL Editor:

```sql
-- Create bookmarks table
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 2. Enable Google OAuth

1. Go to **Authentication** → **Providers** in Supabase
2. Enable **Google** provider
3. Add your Google OAuth credentials (Client ID and Secret)

---

## Google OAuth Setup

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if prompted
6. Select **Web application**
7. Add authorized redirect URIs:
   ```
   http://localhost:3000/auth/callback
   https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
   https://your-vercel-url.vercel.app/auth/callback
   ```

### 2. Add Credentials to Supabase

1. Copy the **Client ID** and **Client Secret**
2. In Supabase, go to **Authentication** → **Providers** → **Google**
3. Paste the credentials and save

---

## Problems Faced & Solutions

### Problem 1: Real-time Updates Not Working in Chrome/Brave

**Issue:** Bookmarks would appear instantly in Safari, but in Chrome and Brave browsers, they would only show after a manual page refresh.

**Root Cause:** 
- React 18's StrictMode causes components to mount twice in development mode
- Chrome and Brave handle WebSocket connections more strictly than Safari
- The Supabase Realtime subscription was being created and destroyed rapidly, causing Chrome/Brave to miss INSERT events
- DELETE events worked fine because they happened after the subscription was stable

**Solutions Tried:**

1. **First attempt:** Added `useRef` to track channel subscriptions
   - Result: Didn't fix the issue
   
2. **Second attempt:** Created unique channel names with timestamps
   - Result: Still inconsistent behavior
   
3. **Third attempt:** Moved Supabase client creation inside `useEffect`
   - Result: Improved but still had race conditions

4. **Final solution:** Disabled React StrictMode + Production deployment
   ```javascript
   // next.config.js
   const nextConfig = {
     reactStrictMode: false, // Disabled for stable WebSocket connections
   };
   ```
   - Result: ✅ Works consistently in all browsers

**Why this worked:** Disabling StrictMode prevents the double-mounting behavior that was causing WebSocket connection issues in Chrome/Brave. In production, StrictMode is automatically disabled anyway, so this is primarily a development environment fix.

---

### Problem 2: Race Condition Between INSERT and Subscription

**Issue:** Sometimes the bookmark INSERT would happen before the Realtime subscription was fully established, causing the event to be missed.

**Solution:** Added subscription status tracking and duplicate prevention:

```typescript
const [isSubscribed, setIsSubscribed] = useState(false);

// In subscription setup
.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    setIsSubscribed(true);
  }
});

// In INSERT handler
setBookmarks((current) => {
  // Prevent duplicates
  const exists = current.some(b => b.id === payload.new.id);
  if (exists) return current;
  return [payload.new, ...current];
});
```

**Result:** Eliminated duplicate bookmarks and ensured consistent behavior.

---

### Problem 3: OAuth Redirect URI Mismatch on Deployment

**Issue:** After deploying to Vercel, Google OAuth login failed with "redirect_uri_mismatch" error.

**Solution:** Updated authorized redirect URIs in three places:

1. **Google Cloud Console:**
   - Added `https://smart-bookmark-zeta-two.vercel.app/auth/callback`
   - Added `https://PROJECT_REF.supabase.co/auth/v1/callback`

2. **Supabase URL Configuration:**
   - Set Site URL to `https://smart-bookmark-zeta-two.vercel.app`
   - Added `https://smart-bookmark-zeta-two.vercel.app/**` to Redirect URLs

3. **Kept localhost URLs for development:**
   - `http://localhost:3000/auth/callback`

**Result:** OAuth works seamlessly in both development and production.

---

### Problem 4: Row Level Security Not Working

**Issue:** Initially, users could see all bookmarks from all users.

**Root Cause:** Forgot to enable Row Level Security (RLS) and create proper policies.

**Solution:** 
```sql
-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies that check auth.uid() = user_id
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);
```

**Result:** Each user now sees only their own bookmarks, ensuring privacy.

---

### Problem 5: Realtime Not Broadcasting Events

**Issue:** Realtime subscription connected successfully, but no INSERT/DELETE events were received.

**Solution:** Enabled the bookmarks table in Supabase Realtime publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

Or via Supabase Dashboard:
- Database → Publications → supabase_realtime
- Ensure INSERT, UPDATE, DELETE toggles are enabled for bookmarks table

**Result:** All database changes now broadcast in real-time.

---

## Project Structure

```
smart-bookmark/
├── app/
│   ├── page.tsx                 # Landing page with login
│   ├── dashboard/
│   │   └── page.tsx            # Main dashboard (protected)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts        # OAuth callback handler
│   └── layout.tsx              # Root layout
├── components/
│   ├── LoginButton.tsx         # Google login button
│   ├── LogoutButton.tsx        # Logout button
│   ├── AddBookmarkForm.tsx     # Form to add bookmarks
│   └── BookmarkList.tsx        # Real-time bookmark list
├── lib/
│   ├── supabase-browser.ts     # Client-side Supabase client
│   └── supabase-server.ts      # Server-side Supabase client
├── .env.local                   # Environment variables (not in repo)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS config
└── package.json                # Dependencies
```

---

## Key Files Explained

### `lib/supabase-browser.ts`
Creates a Supabase client for client-side operations (Auth, Realtime).

### `lib/supabase-server.ts`
Creates a Supabase client for server-side operations with cookie management.

### `components/BookmarkList.tsx`
- Subscribes to Realtime changes on the bookmarks table
- Handles INSERT and DELETE events
- Filters bookmarks by current user
- Prevents duplicate entries

### `app/auth/callback/route.ts`
Handles the OAuth callback from Google and exchanges the code for a session.

---

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click Deploy

3. **Update OAuth settings** (as described above)

---

## Testing Real-time Functionality

1. Open the app in **two different browser tabs**
2. Log in with the same Google account in both tabs
3. Add a bookmark in one tab
4. Watch it appear **instantly** in the other tab without refresh
5. Delete a bookmark in one tab
6. It disappears **instantly** in the other tab

---

## Known Limitations

- Only Google OAuth is supported (no email/password login)
- No bookmark editing functionality (only add/delete)
- No bookmark categorization or tags
- No bookmark search or filtering

---

## Future Enhancements

- [ ] Add bookmark editing
- [ ] Add tags/categories
- [ ] Add search and filter functionality
- [ ] Add bookmark import/export
- [ ] Add browser extension
- [ ] Add bookmark sharing between users
- [ ] Add bookmark analytics (most visited, etc.)

---

## License

MIT License - feel free to use this project for learning purposes.

---

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- Built as a take-home assignment

---

## Contact

If you have any questions about this project, feel free to reach out!

**Author:** Naveen  
**Live App:** [https://smart-bookmark-zeta-two.vercel.app](https://smart-bookmark-zeta-two.vercel.app)