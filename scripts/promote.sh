#!/bin/bash

# import functions from functions.sh
source "$(dirname "$0")/functions.sh"

if ! validate_git_repo; then
    echo "❌ Invalid git repository or missing required tools"
    exit 1
fi

# Check if we're on the dev branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "dev" ]]; then
    echo "❌ Promotion script can only be run from the 'dev' branch"
    echo "   Current branch: $current_branch"
    echo "   Please switch to 'dev' branch first: git checkout dev"
    exit 1
fi

# Check if dev is up to date with main
if ! git fetch origin main; then
    echo "❌ Failed to fetch latest changes from main"
    exit 1
fi

if ! git merge-base --is-ancestor origin/main dev; then
    echo "❌ Your dev branch is not up to date with main. Please merge main into dev first."
    exit 1
fi

# Ask for promotion to main branch
read -p "Do you want to promote your changes to the main branch (y/N): " is_promotion

if [[ "$is_promotion" =~ ^[Yy]$ ]]; then
    # Ask the level of promotion (minor/major)
    read -p "Is this a minor or major promotion? (0:major, 1:minor, other:cancel): " promotion_level

    if [[ "$promotion_level" != "0" && "$promotion_level" != "1" ]]; then
        echo "Promotion cancelled."
        exit 0
    fi

    # Update package.json version for promotion
    if [[ "$promotion_level" == "0" ]]; then
        new_version=$(update_package_version "major")
    else
        new_version=$(update_package_version "minor")
    fi
    
    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to update package.json version"
        exit 1
    fi

    # Update CHANGELOG.md for promotion
    # Replace [NOT RELEASED] with the new version
    if ! update_changelog "" "true" "$new_version"; then
        echo "❌ Failed to update CHANGELOG.md for promotion"
        exit 1
    fi

    # Commit promotion changes
    echo "Pushing to changes to dev branch..."
    git add -A

    if ! git commit -m "chore: bump version to $new_version"; then
        echo "❌ Failed to commit promotion changes"
        exit 1
    fi

    if ! git push origin dev; then
        echo "❌ Failed to push promotion changes to dev"
        exit 1
    fi

    echo "Merging changes to main branch..."

    if ! git checkout main; then
        echo "❌ Failed to checkout main branch"
        exit 1
    fi

    if ! git pull origin main; then
        echo "❌ Failed to pull latest changes from main. Returning to dev branch."
        if ! git checkout dev; then
            echo "⚠️  Warning: Failed to return to dev branch"
        fi
        exit 1
    fi

    if ! git merge dev; then
        echo "❌ Failed to merge dev into main. Returning to dev branch."
        if ! git checkout dev; then
            echo "⚠️  Warning: Failed to return to dev branch"
        fi
        exit 1
    fi

    if ! git push origin main; then
        echo "❌ Failed to push to main branch. Returning to dev branch."
        if ! git checkout dev; then
            echo "⚠️  Warning: Failed to return to dev branch"
        fi
        exit 1
    fi

    if ! git checkout dev; then
        echo "⚠️  Warning: Failed to return to dev branch"
    fi
else 
    echo "Promotion refused."
    exit 0
fi
