#!/bin/bash

# import functions from functions.sh
source "$(dirname "$0")/functions.sh"

# Conventional Commit Helper Script
# Usage: ./scripts/commit.sh

if ! validate_git_repo; then
    echo "❌ Invalid git repository or missing required tools"
    return 1
fi

# Global variables for rollback state tracking
ORIGINAL_BRANCH=""
ORIGINAL_VERSION=""
ORIGINAL_CHANGELOG=""
ROLLBACK_NEEDED=false
CHANGES_STAGED=false

# Initialize rollback state
initialize_rollback_state() {
    ORIGINAL_BRANCH=$(git branch --show-current)
    
    # Store original package.json version if it exists
    if [[ -f "package.json" ]]; then
        if command -v jq >/dev/null 2>&1; then
            ORIGINAL_VERSION=$(jq -r '.version' package.json 2>/dev/null || echo "")
        else
            ORIGINAL_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' package.json | cut -d'"' -f4 2>/dev/null || echo "")
        fi
    fi
    
    # Store original CHANGELOG.md if it exists
    if [[ -f "CHANGELOG.md" ]]; then
        ORIGINAL_CHANGELOG=$(cat CHANGELOG.md)
    fi
    
    ROLLBACK_NEEDED=true
}

# Comprehensive rollback function
rollback_changes() {
    local reason="$1"
    local exit_code="${2:-1}"
    
    if [[ "$ROLLBACK_NEEDED" == "false" ]]; then
        return 0
    fi
    
    echo ""
    echo "🔄 Rolling back changes due to: $reason"
    echo "========================================="

    # Remove staged changes
    if [[ "$CHANGES_STAGED" == true ]]; then
        echo "🚫 Unstaging changes..."
        git restore --staged .
    fi
    
    # Restore original package.json version if it was changed
    if [[ -n "$ORIGINAL_VERSION" && -f "package.json" ]]; then
        echo "📦 Restoring original package.json version: $ORIGINAL_VERSION"
        if command -v jq >/dev/null 2>&1; then
            jq --arg version "$ORIGINAL_VERSION" '.version = $version' package.json > package.json.tmp && mv package.json.tmp package.json
        else
            # Fallback if jq is not available
            sed -i "s/\"version\": \".*\"/\"version\": \"$ORIGINAL_VERSION\"/" package.json
        fi
        git checkout -- package.json 2>/dev/null || true
    fi
    
    # Restore CHANGELOG.md if it was modified
    if [[ -n "$ORIGINAL_CHANGELOG" && -f "CHANGELOG.md" ]]; then
        echo "📝 Restoring original CHANGELOG.md"
        echo "$ORIGINAL_CHANGELOG" > CHANGELOG.md
    fi
    
    # Ensure we're back on the original branch
    if [[ -n "$ORIGINAL_BRANCH" ]]; then
        current_branch=$(git branch --show-current)
        if [[ "$current_branch" != "$ORIGINAL_BRANCH" ]]; then
            echo "🌿 Switching back to original branch: $ORIGINAL_BRANCH"
            git checkout "$ORIGINAL_BRANCH" --quiet 2>/dev/null || true
        fi
    fi
    
    echo "✅ Rollback completed successfully"
    echo ""
    
    exit $exit_code
}

# Set up error trap for automatic rollback
trap 'rollback_changes "Unexpected error occurred" 1' ERR

# Check if there are changes to commit
if git diff --staged --quiet && git diff --quiet; then
    echo "❌ No changes to commit"
    exit 1
fi

# Initialize rollback state tracking
initialize_rollback_state

echo "🚀 Conventional Commit Helper"
echo "=============================="

# Check if we're on "dev" or "fix" branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "dev" && "$current_branch" != "fix" ]]; then
    echo "⚠️  Warning: You're on branch '$current_branch', not 'dev' or 'fix'"
    read -p "Continue anyway? (y/N): " continue_choice
    if [[ ! "$continue_choice" =~ ^[Yy]$ ]]; then
        rollback_changes "User cancelled due to branch warning" 1
    fi
fi

# Display branch-specific workflow info
if [[ "$current_branch" == "fix" ]]; then
    echo ""
    echo "🔧 Fix branch detected - Hotfix workflow will be used"
    echo "   → Patch version bump → Push to fix → Merge to main"
    echo "   ⚠️  This will immediately deploy to production!"
    echo ""
elif [[ "$current_branch" == "dev" ]]; then
    echo ""
    echo "🚀 Dev branch detected - Development workflow will be used"
    echo "   → Patch version bump → Option to promote to main"
    echo ""
fi

# Display the modified files
echo "Modified files:"
git diff --name-only | while read -r file; do
    echo "  - $file"
done

echo ""

read -p "Did you update the documentation to reflect these changes (y/N)? " update_docs
if [[ ! "$update_docs" =~ ^[Yy]$ ]]; then
    rollback_changes "Documentation not updated" 1
fi

# Define commit types
declare -A commit_types=(
    ["1"]="feat:New feature"
    ["2"]="fix:Bug fix"
    ["3"]="docs:Documentation change"
    ["4"]="style:Code style change"
    ["5"]="refactor:Code refactoring"
    ["6"]="perf:Performance improvement"
    ["7"]="test:Test changes"
    ["8"]="chore:Non-functional change"
    ["9"]="security:Security fix"
    ["10"]="revert:Revert changes"
    ["11"]="done:Completed tasks"
    ["12"]="wip:Work in progress"
    ["13"]="started:New tasks"
)

echo "Select commit type:"
for key in $(echo ${!commit_types[@]} | tr ' ' '\n' | sort -n); do
    IFS=':' read -r type desc <<< "${commit_types[$key]}"
    echo "  $key) $type ($desc)"
done

read -p "Enter choice (1-13): " choice

if [[ ! ${commit_types[$choice]} ]]; then
    rollback_changes "Invalid commit type choice" 1
fi

IFS=':' read -r type desc <<< "${commit_types[$choice]}"

# Get description
read -p "Enter commit description: " description
if [[ -z "$description" ]]; then
    rollback_changes "Description is required" 1
fi

# Validate commit description length and content
if [[ ${#description} -lt 5 ]]; then
    rollback_changes "Description must be at least 5 characters long" 1
fi

if [[ ${#description} -gt 100 ]]; then
    echo "⚠️  Warning: Description is too long (${#description} characters). It will be truncated to 100 characters."
    truncated_desc="${description:0:100}"
    echo "Truncated commit description:"
    echo "  $truncated_desc"
    description="$truncated_desc"
fi

# Construct commit message
commit_msg="${type}: $(echo "$description" | tr '[:upper:]' '[:lower:]')"

# Show preview
echo ""
echo "📝 Commit message preview:"
echo "========================="
echo "$commit_msg"
echo "========================="

read -p "Proceed with this commit? (Y/n): " proceed
if [[ "$proceed" =~ ^[Nn]$ ]]; then
    rollback_changes "User cancelled commit" 1
fi

# Branch-specific workflow
if [[ "$current_branch" == "fix" ]]; then
    # Hotfix workflow: auto-bump version, commit, push to fix, merge to main
    echo ""
    echo "🔧 Executing hotfix workflow..."
    echo "⚠️  WARNING: This will immediately deploy to production!"
    echo ""
    read -p "Are you sure you want to proceed with the hotfix? (Y/n): " confirm_hotfix
    if [[ "$confirm_hotfix" =~ ^[Nn]$ ]]; then
        echo "❌ Hotfix cancelled"
        exit 1
    fi
    
    if ! handle_hotfix_workflow "$commit_msg"; then
        echo "❌ Hotfix workflow failed"
        exit 1
    fi
    
    echo ""
    echo "✅ Hotfix completed successfully!"
    echo "🎯 The fix has been deployed to main branch"
    
else
    # Development workflow: bump version, update changelog, commit, offer promotion
    
    # Update package.json version / always a patch version
    new_version=$(update_package_version "patch")
    if [[ $? -ne 0 ]]; then
        rollback_changes "Failed to update package version" 1
    fi

    # Update CHANGELOG.md
    if ! update_changelog "$commit_msg"; then
        rollback_changes "Failed to update CHANGELOG.md" 1
    fi

    # Execute commit
    git add -A
    CHANGES_STAGED=true
    if ! git commit -m "$commit_msg"; then
        rollback_changes "Failed to create commit" 1
    fi

    echo ""
    echo "✅ Commit created successfully!"

    # Disable rollback once commit is successful
    ROLLBACK_NEEDED=false

    # Run promotion script
    ./scripts/promote.sh
fi