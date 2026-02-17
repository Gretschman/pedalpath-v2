# DEBUG: Authentication Not Working

## Current Situation

- ✅ User goes to /signup
- ✅ Enters email: test@example.com
- ✅ Enters password: TestPass123!
- ✅ Clicks "Sign Up"
- ❌ localStorage.getItem('supabase.auth.token') still returns `null`
- ❌ User not authenticated

## Possible Causes

### 1. Email Confirmation Required
Supabase might be configured to require email confirmation before allowing login.

**Check Supabase Dashboard:**
- Authentication → Settings → "Enable email confirmations"
- If enabled → User must click link in confirmation email before they can sign in

**Solution:** Check email inbox for confirmation email, or disable email confirmation in Supabase settings.

### 2. Signup Failed Silently
The signup might have failed but no error was shown to the user.

**Check:**
- Browser console for errors
- Supabase Dashboard → Authentication → Users (is user listed?)

### 3. CORS or Network Issues
Signup request might be blocked by CORS or network issues.

**Check:**
- Browser console Network tab
- Look for failed requests to supabase.co
- Check if any requests return 403 or 500 errors

### 4. Auth Not Properly Initialized
The AuthContext might not be properly initialized.

**Check:**
- Browser console on page load
- Look for "Failed to initialize" errors

## Debugging Steps

### Step 1: Check Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your PedalPath project (tudjjcamqxeybqqmvctr)
3. Click **Authentication** → **Users**
4. Is there a user with email `test@example.com`?

**If YES:**
- User was created successfully
- Problem is with sign-in, not signup
- Try signing in instead

**If NO:**
- Signup failed
- Check console for errors
- Check Supabase auth settings

### Step 2: Check Email Confirmation Settings

1. Supabase Dashboard → **Authentication** → **Settings**
2. Scroll to **"Email Auth"** section
3. Check: **"Enable email confirmations"**

**If ENABLED:**
- Check email inbox for confirmation email
- Click confirmation link
- Then try signing in

**If DISABLED:**
- Signup should work immediately
- Issue is elsewhere

### Step 3: Check Browser Console

1. Go to signup page: https://pedalpath-app.vercel.app/signup
2. Open console (F12 → Console)
3. Clear console
4. Enter email and password
5. Click "Sign Up"
6. **Copy ALL console output** (especially red errors)

Common errors to look for:
```
Error: User already exists
Error: Invalid email
Error: SignUp requires a valid email and password
Error: AuthApiError
```

### Step 4: Check Network Tab

1. Open DevTools (F12)
2. Click **Network** tab
3. Click "Sign Up"
4. Look for requests to `supabase.co`
5. Check if any failed (red text)
6. Click failed request → Response tab
7. Copy error message

### Step 5: Test Auth Directly in Console

After clicking Sign Up, in console run:
```javascript
// Check if Supabase client is initialized
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

// Check current session
supabase.auth.getSession().then(({data, error}) => {
  console.log('Current session:', data)
  console.log('Session error:', error)
})

// Check if user exists
supabase.auth.getUser().then(({data, error}) => {
  console.log('Current user:', data)
  console.log('User error:', error)
})
```

## Quick Fix Options

### Option A: Disable Email Confirmation (Easiest)

1. Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. **Disable it**
4. Try signup again

### Option B: Use Email Confirmation

1. Check email inbox for `test@example.com`
2. Find confirmation email from Supabase
3. Click confirmation link
4. Go back to app
5. Go to /signin (not signup)
6. Sign in with credentials

### Option C: Create User Manually in Supabase

1. Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Click "Create User"
5. Go to app → /signin
6. Sign in

### Option D: Check if User Already Exists

1. Supabase Dashboard → Authentication → Users
2. Search for `test@example.com`
3. If exists:
   - Delete it
   - Try signup again
4. Or just try signing in instead of signing up

## What to Send Me

To help debug, send me:

1. **Screenshot of browser console** after clicking Sign Up
2. **Screenshot of Supabase Users page** (Authentication → Users)
3. **Email confirmation setting** (enabled or disabled?)
4. **Any error messages** from console or page

## Expected Working Flow

**Correct signup flow should be:**
```
1. User enters email/password
2. Click "Sign Up"
3. Request sent to Supabase
4. Supabase creates user
5. If email confirmation disabled:
   → User is immediately signed in
   → Session stored in localStorage
   → Redirected to dashboard
6. If email confirmation enabled:
   → "Check your email" message shown
   → User clicks confirmation link in email
   → Then must go to /signin and sign in
```

## Most Likely Issue

Based on symptoms, **I believe email confirmation is enabled** in your Supabase project.

This means:
- Signup succeeds in creating the user
- But user is NOT automatically signed in
- User must confirm email first
- Then sign in manually

**Solution:**
1. Check email for confirmation link
2. Click it
3. Go to /signin
4. Sign in with credentials
5. Should work!

## Alternative: Use Real Email

Instead of `test@example.com`, use your real email:
1. Go to /signup
2. Use your actual email (rob@yourdomain.com)
3. Enter password
4. Sign up
5. Check YOUR email inbox
6. Click confirmation link
7. Sign in

This way you'll actually receive the confirmation email if it's required.
