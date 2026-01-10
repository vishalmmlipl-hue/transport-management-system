#!/bin/bash

# Script to update Git remote URL for GitHub

echo "=========================================="
echo "GitHub Remote URL Updater"
echo "=========================================="
echo ""
echo "Current remote URL:"
git remote -v
echo ""
echo "Please enter your GitHub username:"
read GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "Error: Username cannot be empty!"
    exit 1
fi

NEW_URL="https://github.com/${GITHUB_USERNAME}/transport-management-system.git"

echo ""
echo "Updating remote URL to: ${NEW_URL}"
git remote set-url origin "${NEW_URL}"

echo ""
echo "Updated remote URL:"
git remote -v

echo ""
echo "✅ Remote URL updated successfully!"
echo ""
echo "Next steps:"
echo "1. Make sure you've created the repository on GitHub:"
echo "   https://github.com/${GITHUB_USERNAME}/transport-management-system"
echo ""
echo "2. Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git push -u origin main"
echo ""

