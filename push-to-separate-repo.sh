#!/bin/bash

set -e

# -------------------------------------------------
# CONFIG
# -------------------------------------------------
BACKEND_REPO_URL="https://github.com/IshankDev/atpl-backend-code.git"
REMOTE_NAME="backend-repo"
BRANCH_NAME="main"
FOLDER_NAME="backend_nestjs_code"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Navigate to parent directory (where the main git repo is)
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Starting Backend Code Push to Separate Repository"
echo "📁 Script location: $SCRIPT_DIR"
echo "📁 Parent directory: $PARENT_DIR"
echo "🔗 Target repository: $BACKEND_REPO_URL"

# -------------------------------------------------
# Navigate to parent directory
# -------------------------------------------------
cd "$PARENT_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a git repository. Please run this script from within the git repository."
  exit 1
fi

# Check if backend_nestjs_code folder exists
if [ ! -d "$FOLDER_NAME" ]; then
  echo "❌ Error: $FOLDER_NAME folder not found in parent directory."
  exit 1
fi

# -------------------------------------------------
# Setup remote
# -------------------------------------------------
echo ""
echo "🔧 Setting up remote repository..."

# Check if remote already exists
if git remote get-url "$REMOTE_NAME" &>/dev/null; then
  CURRENT_URL=$(git remote get-url "$REMOTE_NAME")
  if [ "$CURRENT_URL" != "$BACKEND_REPO_URL" ]; then
    echo "⚠️  Remote '$REMOTE_NAME' exists with different URL: $CURRENT_URL"
    echo "🔄 Updating remote URL..."
    git remote set-url "$REMOTE_NAME" "$BACKEND_REPO_URL"
  else
    echo "✅ Remote '$REMOTE_NAME' already configured correctly"
  fi
else
  echo "➕ Adding remote '$REMOTE_NAME'..."
  git remote add "$REMOTE_NAME" "$BACKEND_REPO_URL"
fi

# Verify remote
echo "📋 Remote configuration:"
git remote -v | grep "$REMOTE_NAME" || true

# -------------------------------------------------
# Check and commit uncommitted changes
# -------------------------------------------------
echo ""
echo "🔍 Checking for uncommitted changes in $FOLDER_NAME..."

# Check for modified files
HAS_MODIFIED=$(git diff --name-only HEAD -- "$FOLDER_NAME" 2>/dev/null | wc -l | tr -d ' ')
# Check for untracked files
HAS_UNTRACKED=$(git ls-files --others --exclude-standard "$FOLDER_NAME" | wc -l | tr -d ' ')

if [ "$HAS_MODIFIED" -gt 0 ] || [ "$HAS_UNTRACKED" -gt 0 ]; then
  if [ "$HAS_MODIFIED" -gt 0 ]; then
    echo "📝 Found $HAS_MODIFIED modified file(s) in $FOLDER_NAME"
  fi
  if [ "$HAS_UNTRACKED" -gt 0 ]; then
    echo "📝 Found $HAS_UNTRACKED untracked file(s) in $FOLDER_NAME"
  fi
  
  echo "   Staging all changes..."
  
  # Stage all changes (modified and untracked) in the backend_nestjs_code folder
  git add "$FOLDER_NAME"
  
  # Check if there are staged changes
  if git diff --cached --quiet -- "$FOLDER_NAME"; then
    echo "   No changes to commit (all changes may be ignored by .gitignore)."
  else
    # Generate commit message with timestamp
    if [ "$HAS_UNTRACKED" -gt 0 ] && [ "$HAS_MODIFIED" -eq 0 ]; then
      COMMIT_MSG="Add new files to backend code - $(date '+%Y-%m-%d %H:%M:%S')"
    elif [ "$HAS_MODIFIED" -gt 0 ] && [ "$HAS_UNTRACKED" -eq 0 ]; then
      COMMIT_MSG="Update backend code - $(date '+%Y-%m-%d %H:%M:%S')"
    else
      COMMIT_MSG="Update backend code (modified and new files) - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    echo "   Committing changes..."
    if git commit -m "$COMMIT_MSG" -- "$FOLDER_NAME"; then
      echo "✅ Changes committed successfully"
      echo "   Commit message: $COMMIT_MSG"
    else
      echo "❌ Failed to commit changes"
      exit 1
    fi
  fi
else
  echo "✅ No uncommitted changes found"
fi

# -------------------------------------------------
# Push using git subtree (force push to overwrite remote)
# -------------------------------------------------
echo ""
echo "📤 Pushing current local code to $BACKEND_REPO_URL on $BRANCH_NAME branch..."
echo "⚠️  This will overwrite the remote repository with your current local code"

# Use subtree split to create a branch with only the backend_nestjs_code folder
TEMP_BRANCH="subtree-backend-$(date +%s)"
echo "   Creating temporary branch: $TEMP_BRANCH"

# Split the subtree into a temporary branch
if git subtree split --prefix="$FOLDER_NAME" -b "$TEMP_BRANCH" 2>&1; then
  echo "   ✅ Subtree split successful"
  
  # Force push the temporary branch to the remote main branch (overwrites remote)
  echo "   Force pushing to overwrite remote..."
  if git push --force "$REMOTE_NAME" "$TEMP_BRANCH:$BRANCH_NAME" 2>&1; then
    echo ""
    echo "✅ Successfully pushed current local code to $BRANCH_NAME branch"
    
    # Clean up temporary branch
    echo "   Cleaning up temporary branch..."
    git branch -D "$TEMP_BRANCH" 2>/dev/null || true
  else
    echo ""
    echo "❌ Failed to push to $BRANCH_NAME branch"
    echo ""
    echo "   Possible solutions:"
    echo "   1. Check that you have push permissions to the repository"
    echo "   2. Verify the repository URL is correct: $BACKEND_REPO_URL"
    echo "   3. Ensure you have force push permissions"
    
    # Clean up temporary branch on error
    git branch -D "$TEMP_BRANCH" 2>/dev/null || true
    exit 1
  fi
else
  echo ""
  echo "❌ Failed to split subtree"
  echo "   Cleaning up temporary branch..."
  git branch -D "$TEMP_BRANCH" 2>/dev/null || true
  exit 1
fi

echo ""
echo "🎉 Backend code pushed successfully to separate repository!"
echo "🔗 Repository: $BACKEND_REPO_URL"
echo "🌿 Branch: $BRANCH_NAME"