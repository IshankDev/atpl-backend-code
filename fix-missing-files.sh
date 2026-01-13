#!/bin/bash
# Script to fix missing files on the server
# Run this on the server after pulling if you get TypeScript errors about missing files

set -e

echo "Checking for missing files..."

REQUIRED_FILES=(
  "src/questions/dto/create-question.dto.ts"
  "src/questions/dto/update-question.dto.ts"
  "src/questions/schemas/question.schema.ts"
  "src/mock-test-results/schemas/mock-test-result.schema.ts"
)

MISSING_FILES=()

# Check which files are missing
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Missing: $file"
    MISSING_FILES+=("$file")
  else
    echo "✓ Found: $file"
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo ""
  echo "All required files are present!"
  exit 0
fi

echo ""
echo "Attempting to restore ${#MISSING_FILES[@]} missing file(s) from git..."

# Ensure directories exist
for file in "${MISSING_FILES[@]}"; do
  dir=$(dirname "$file")
  if [ ! -d "$dir" ]; then
    echo "Creating directory: $dir"
    mkdir -p "$dir"
  fi
done

# Try to restore files from git
for file in "${MISSING_FILES[@]}"; do
  echo "Restoring: $file"
  if git checkout HEAD -- "$file" 2>/dev/null; then
    echo "✓ Restored: $file"
  else
    echo "✗ Failed to restore: $file"
    echo "  Please ensure this file is committed and pushed to the repository."
  fi
done

echo ""
echo "Verification after restore:"
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (STILL MISSING)"
  fi
done
