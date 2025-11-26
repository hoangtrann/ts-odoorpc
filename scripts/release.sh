#!/bin/bash

# Script to create a new release
# Usage: ./scripts/release.sh [patch|minor|major]

set -e

# Check if version type is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/release.sh [patch|minor|major]"
  echo "Example: ./scripts/release.sh patch"
  exit 1
fi

VERSION_TYPE=$1

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo "Error: Version type must be patch, minor, or major"
  exit 1
fi

# Ensure working directory is clean
if [[ -n $(git status -s) ]]; then
  echo "Error: Working directory is not clean. Commit or stash your changes first."
  git status -s
  exit 1
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "Error: You must be on the main branch to create a release"
  echo "Current branch: $CURRENT_BRANCH"
  exit 1
fi

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Run tests to ensure everything works
echo "Running tests..."
npm test

# Run linter
echo "Running linter..."
npm run lint

# Run type check
echo "Running type check..."
npm run typecheck

# Build to ensure it compiles
echo "Building..."
npm run build:all

# Bump version
echo "Bumping $VERSION_TYPE version..."
npm version $VERSION_TYPE -m "chore: release v%s"

# Get the new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# Push changes and tags
echo "Pushing changes and tags..."
git push origin main
git push origin "v$NEW_VERSION"

echo ""
echo "✓ Version bumped to $NEW_VERSION"
echo "✓ Changes and tag pushed to GitHub"
echo ""
echo "Next steps:"
echo "1. Go to: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/releases/new"
echo "2. Select tag: v$NEW_VERSION"
echo "3. Add release notes"
echo "4. Click 'Publish release'"
echo ""
echo "The GitHub Action will automatically publish to npm when you create the release."
