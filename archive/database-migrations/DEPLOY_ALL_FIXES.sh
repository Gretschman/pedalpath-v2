#!/bin/bash

# ==============================================================================
# PEDALPATH COMPLETE FIX & DEPLOYMENT SCRIPT
# This script deploys all fixes in the correct order
# ==============================================================================

set -e  # Exit on any error

echo "==============================================="
echo "PedalPath Complete Fix & Deployment"
echo "==============================================="
echo ""

# Navigate to project directory
cd /home/rob/git/pedalpath-v2/pedalpath-app

echo "Step 1: Building application..."
echo "-----------------------------------------------"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix TypeScript errors and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

echo "Step 2: Running linter..."
echo "-----------------------------------------------"
npm run lint --fix

echo "✅ Linting complete!"
echo ""

echo "Step 3: Git commit changes..."
echo "-----------------------------------------------"
git add -A

git commit -m "$(cat <<'EOF'
fix: complete auth and upload integration fixes

- Remove storage bucket initialization (causes RLS errors)
- Add proper authentication check in UploadPage (no temp-user-id fallback)
- Add GIF support to file uploads
- Add Navbar component with user info and sign out
- Update file type validation messages

CRITICAL FIXES:
1. Storage bucket must be created via Supabase dashboard, not runtime
2. Upload now requires proper authentication (redirects to signin if not auth)
3. GIF files now accepted alongside PNG/JPG/WebP/PDF
4. Navbar shows user email and provides sign out button

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

echo "✅ Changes committed!"
echo ""

echo "Step 4: Pushing to GitHub..."
echo "-----------------------------------------------"
git push origin main

echo "✅ Pushed to GitHub!"
echo ""

echo "Step 5: Deploying to Vercel..."
echo "-----------------------------------------------"
vercel --prod --yes

echo "✅ Deployed to Vercel!"
echo ""

echo "==============================================="
echo "✅ ALL FIXES DEPLOYED SUCCESSFULLY!"
echo "==============================================="
echo ""
echo "NEXT STEPS:"
echo ""
echo "1. Run the database fix:"
echo "   - Go to: https://supabase.com/dashboard"
echo "   - Select your PedalPath project"
echo "   - SQL Editor → New Query"
echo "   - Copy contents of MASTER_FIX_ALL.sql"
echo "   - Run it"
echo ""
echo "2. Create an account:"
echo "   - Go to: https://pedalpath-app.vercel.app/signup"
echo "   - Use YOUR real email"
echo "   - Create account"
echo "   - Check email for confirmation link"
echo "   - Click confirmation link"
echo ""
echo "3. Sign in and test:"
echo "   - Go to: https://pedalpath-app.vercel.app/signin"
echo "   - Sign in"
echo "   - Go to Upload"
echo "   - Upload a schematic"
echo "   - Should work! ✅"
echo ""
echo "==============================================="
