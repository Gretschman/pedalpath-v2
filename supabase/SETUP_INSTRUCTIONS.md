# Supabase Database Setup Instructions

This guide walks you through setting up the PedalPath database in Supabase.

## Step 1: Run the Database Migration

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy the entire contents of `migrations/001_initial_schema.sql`
5. Paste it into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned" - this is correct!

## Step 2: Set Up Storage Buckets

We need two storage buckets for file uploads:

### Create Schematics Bucket

1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Configure:
   - **Name**: `schematics`
   - **Public bucket**: ✓ Check this (we'll use RLS for security)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, application/pdf`
4. Click **Create bucket**

### Create Build Images Bucket

1. Click **New bucket** again
2. Configure:
   - **Name**: `build-images`
   - **Public bucket**: ✓ Check this
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg`
3. Click **Create bucket**

## Step 3: Set Up Storage Policies

For each bucket, we need to add security policies:

### Schematics Bucket Policies

1. Click on the **schematics** bucket
2. Click **Policies** tab
3. Click **New policy** and select **For full customization**

**Policy 1: Allow authenticated users to upload**
- Policy name: `Allow authenticated uploads`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- USING expression:
```sql
auth.uid() IS NOT NULL
```
- WITH CHECK expression:
```sql
auth.uid() IS NOT NULL
```

**Policy 2: Allow users to view their own uploads**
- Policy name: `Allow users to view own files`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression:
```sql
auth.uid() IS NOT NULL
```

**Policy 3: Allow users to delete their own uploads**
- Policy name: `Allow users to delete own files`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
```sql
auth.uid() IS NOT NULL
```

### Build Images Bucket Policies

Repeat the same three policies for the **build-images** bucket.

## Step 4: Verify Setup

Run this query in the SQL Editor to verify all tables were created:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- `build_steps`
- `components`
- `projects`
- `user_profiles`

## Step 5: Test Authentication

1. Go back to your app: http://localhost:5173
2. Click **Get Started** or **Sign Up**
3. Create a new account with your email
4. Check the **Authentication** section in Supabase dashboard
5. You should see your new user listed
6. Check the **Table Editor** > **user_profiles** - your profile should be auto-created!

## What Was Created

### Tables

1. **projects** - Stores pedal building projects
   - Links to user via `user_id`
   - Has status: draft, in_progress, completed

2. **build_steps** - Step-by-step build instructions
   - Links to projects via `project_id`
   - Ordered by `step_number`

3. **components** - Parts list for each project
   - Links to projects via `project_id`
   - Includes name, value, quantity, category

4. **user_profiles** - Extended user information
   - Auto-created when user signs up
   - Stores user's name from signup

### Security (RLS)

- ✅ Row Level Security enabled on all tables
- ✅ Users can only see/modify their own data
- ✅ Build steps and components inherit project ownership
- ✅ Automatic profile creation on signup

### Performance

- ✅ Indexes on frequently queried columns
- ✅ Cascading deletes (delete project → deletes steps & components)
- ✅ Automatic timestamp updates

## Troubleshooting

**Error: "permission denied for schema public"**
- Your user needs proper permissions. This shouldn't happen on new projects.

**Error: "relation already exists"**
- Tables already exist. Either drop them first or skip this migration.

**Storage upload fails**
- Check that storage policies are set correctly
- Verify bucket is marked as public
- Check file size and MIME type restrictions

## Next Steps

Once setup is complete:
1. Test authentication (sign up/sign in)
2. Test file uploads on the Upload page
3. Ready for Week 2: AI integration and project creation!
