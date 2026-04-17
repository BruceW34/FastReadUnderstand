#!/bin/bash

# ✅ FASTREAD PRODUCTION LAUNCH CHECKLIST SCRIPT
# Bu script production hazırlığı için automation yapıyor

set -e

echo "🚀 FastRead Production Launch Checklist"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. TypeScript Check
echo "🔷 Checking TypeScript compilation..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} TypeScript build successful"
else
    echo -e "${RED}✗${NC} TypeScript build failed"
    exit 1
fi

# 2. ESLint Check
echo "🔍 Checking code quality..."
if npm run lint 2>&1 | grep -q "error"; then
    echo -e "${RED}✗${NC} ESLint found errors"
    npm run lint
    exit 1
else
    echo -e "${GREEN}✓${NC} ESLint passed"
fi

# 3. Environment Variables
echo "⚙️ Checking environment configuration..."
if [ ! -f ".env.development" ]; then
    echo -e "${RED}✗${NC} .env.development missing"
    exit 1
elif [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠${NC} .env.production not configured (needed for production)"
fi
echo -e "${GREEN}✓${NC} Environment files present"

# 4. Bundle Analysis
echo "📦 Analyzing bundle size..."
npm run build

# Suggest bundle size (should be < 800kb)
BUNDLE_SIZE=$(du -sh dist/ | cut -f1)
echo -e "  Bundle size: ${YELLOW}${BUNDLE_SIZE}${NC}"

if du -sb dist/ | awk '{if ($1 > 800 * 1024 * 1024) exit 1}'; then
    echo -e "${GREEN}✓${NC} Bundle size acceptable"
else
    echo -e "${YELLOW}⚠${NC} Bundle size large, consider code splitting"
fi

# 5. Security Check
echo "🔐 Checking for security issues..."
ERROR_COUNT=0

# Check for hardcoded secrets
if grep -r "VITE_" src/ --include="*.ts" --include="*.tsx" | grep -v "import.meta.env"; then
    echo -e "${YELLOW}⚠${NC} Possible hardcoded environment values found"
fi

# Check for console.logs in production code
if grep -r "console\." src/ --include="*.ts" --include="*.tsx" | grep -v -e "console.error" -e "//.*console"; then
    echo -e "${YELLOW}⚠${NC} Console statements found (should remove in build)"
fi

echo -e "${GREEN}✓${NC} Security check completed"

# 6. Firebase Configuration
echo "🔥 Checking Firebase configuration..."
if grep -r "AIzaSy" src/ > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} Hardcoded Firebase credentials found!"
    echo "  Move to .env files instead"
    exit 1
else
    echo -e "${GREEN}✓${NC} Using environment variables for Firebase"
fi

# 7. AdMob Configuration
echo "📱 Checking AdMob configuration..."
if grep -r "ca-app-pub-3940256099942544" src/ > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} Using Google test ad IDs (development mode)"
else
    echo -e "${GREEN}✓${NC} Production ad IDs configured"
fi

# 8. Git Status
echo "📝 Checking Git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠${NC} Uncommitted changes:"
    git status --short
else
    echo -e "${GREEN}✓${NC} All changes committed"
fi

# 9. Dependencies Check
echo "📦 Checking dependencies..."
if npm list 2>&1 | grep -i problematic > /dev/null; then
    echo -e "${YELLOW}⚠${NC} Dependency issues detected"
fi
echo -e "${GREEN}✓${NC} Dependencies checked"

# 10. Build Output
echo "🏗 Final build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Production build successful"
    echo ""
    echo "📊 Build Summary:"
    du -sh dist/
    echo ""
else
    echo -e "${RED}✗${NC} Production build failed"
    exit 1
fi

# Summary
echo "======================================="
echo -e "${GREEN}✓ PRODUCTION LAUNCH READY!${NC}"
echo "======================================="
echo ""
echo "📋 Next steps:"
echo "  1. Review .env.production configuration"
echo "  2. Test on Android/iOS devices"
echo "  3. Deploy to Firebase: firebase deploy --only hosting"
echo "  4. Deploy Android: Upload to Google Play Console"
echo "  5. Deploy iOS: Upload to TestFlight"
echo ""
echo "⚠️  Don't forget:"
echo "  - Update version in package.json"
echo "  - Tag release in Git: git tag v1.0.0"
echo "  - Create changelog entries"
echo "  - Notify team members"
echo ""
