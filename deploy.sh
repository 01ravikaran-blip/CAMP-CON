#!/bin/bash

# Smart Campus Super-App - Production Deployment Helper Script
# Run this script to verify your local environment before triggering deployments.

echo "🚀 Smart Campus Super-App Deployment Pre-Flight Check 🚀"
echo "========================================================="

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Please install it using: npm i -g vercel"
else
    echo "✅ Vercel CLI is installed."
fi

# Check Prisma CLI
if ! command -v npx prisma &> /dev/null; then
    echo "❌ Prisma CLI not found."
else
    echo "✅ Prisma CLI is accessible."
fi

# Check Database URLs
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL is not set in your current terminal session."
    echo "   Run: export DATABASE_URL=\"your-production-pooler-url\" before pushing the schema."
else
    echo "✅ DATABASE_URL is set."
fi

if [ -z "$DIRECT_URL" ]; then
    echo "⚠️  WARNING: DIRECT_URL is not set in your current terminal session."
    echo "   Run: export DIRECT_URL=\"your-production-direct-url\" before pushing the schema."
else
    echo "✅ DIRECT_URL is set."
fi

echo ""
echo "📝 Deployment Instructions:"
echo "1. Run 'npx prisma db push' in the backend/ directory to sync your production schema."
echo "2. Deploy backend/verification-service to Render using the render.yaml blueprint."
echo "3. Deploy apps/web to Vercel using 'vercel --prod'."
echo ""
echo "Good luck with the launch! 🎓"
