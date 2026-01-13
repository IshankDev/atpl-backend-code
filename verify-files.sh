#!/bin/bash
# Script to verify required files exist on the server
# Run this on the server after pulling to ensure all files are present

echo "Verifying required files exist..."

REQUIRED_FILES=(
  "src/questions/dto/create-question.dto.ts"
  "src/questions/dto/update-question.dto.ts"
  "src/questions/schemas/question.schema.ts"
  "src/mock-test-results/schemas/mock-test-result.schema.ts"
)

MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Missing file: $file"
    MISSING_FILES+=("$file")
  else
    echo "✓ Found: $file"
  fi
done

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo ""
  echo "All required files are present!"
  exit 0
else
  echo ""
  echo "ERROR: ${#MISSING_FILES[@]} file(s) are missing!"
  echo "Please ensure these files are committed and pushed to the repository."
  exit 1
fi
