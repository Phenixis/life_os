# Function to update package.json version
update_package_version() {
    if ! validate_git_repo; then
        echo "❌ Invalid git repository or missing required tools" >&2
        return 1
    fi

    local version_type="$1"  # "patch", "minor", or "major"
    local current_version version_parts major minor patch new_version
    
    if [[ ! -f "package.json" ]]; then
        echo "❌ No package.json found" >&2
        return 1
    fi
    
    echo "Updating package.json version ($version_type)..." >&2
    current_version=$(jq -r '.version' package.json)
    
    if [[ -z "$current_version" || "$current_version" == "null" ]]; then
        echo "❌ Failed to read version from package.json" >&2
        return 1
    fi
    
    IFS='.' read -r major minor patch <<< "$current_version"
    
    case $version_type in
        "patch")
            new_version="$major.$minor.$((patch + 1))"
            ;;
        "minor")
            new_version="$major.$((minor + 1)).0"
            ;;
        "major")
            new_version="$((major + 1)).0.0"
            ;;
        *)
            echo "❌ Invalid version type: $version_type" >&2
            return 1
            ;;
    esac
    
    if ! jq --arg new_version "$new_version" '.version = $new_version' package.json > package.json.tmp; then
        echo "❌ Failed to update package.json" >&2
        return 1
    fi
    
    mv package.json.tmp package.json
    echo "Updated package.json version from $current_version to $new_version" >&2

    # Update readme file with new version
    # Update the line "Current Version: **Vx.x.x**"
    if ! sed -i "s/Current Version: \*\*V[0-9]\+\.[0-9]\+\.[0-9]\+\*\*/Current Version: **V$new_version**/" README.md; then
        echo "❌ Failed to update README.md with new version" >&2
        return 1
    fi
    echo "Updated README.md with new version: $new_version" >&2

    echo "$new_version"  # Return only the new version to stdout
}

# Function to update CHANGELOG.md
update_changelog() {
    if ! validate_git_repo; then
        echo "❌ Invalid git repository or missing required tools"
        return 1
    fi

    local commit_message="$1"
    local is_release="${2:-false}"
    local version="$3"
    local is_hotfix="${4:-false}"
    
    if [[ ! -f "CHANGELOG.md" ]]; then
        echo "No CHANGELOG.md found, skipping update."
        return 0
    fi
    
    echo "Updating CHANGELOG.md..."
    
    # Create backup with error handling
    if ! cp CHANGELOG.md CHANGELOG.md.backup; then
        echo "❌ Failed to create backup of CHANGELOG.md"
        return 1
    fi
    
    if [[ "$is_release" == "true" && -n "$version" ]]; then
        if [[ "$is_hotfix" == "true" ]]; then
            # Add hotfix section at the top
            local release_date
            release_date=$(date +"%Y-%m-%d")
            local section_text="## [$version] - $release_date"
            
            # Find the first existing version section and insert before it
            if ! awk -v new_section="$section_text" -v commit_msg="$commit_message" -v version="$version" '
                /^## \[/ && !inserted {
                    print new_section
                    datetime = strftime("%Y-%m-%d %H:%M:%S")
                    print "- [V" version " - " datetime "] " commit_msg
                    print ""
                    inserted = 1
                }
                { print }
            ' CHANGELOG.md > CHANGELOG.md.tmp; then
                echo "❌ Failed to update CHANGELOG.md for hotfix"
                mv CHANGELOG.md.backup CHANGELOG.md
                return 1
            fi
            
            # Move the temporary file to replace the original
            if ! mv CHANGELOG.md.tmp CHANGELOG.md; then
                echo "❌ Failed to finalize CHANGELOG.md update"
                mv CHANGELOG.md.backup CHANGELOG.md
                return 1
            fi
            
            echo "✅ Updated CHANGELOG.md with hotfix version: $version"
        else
            # Replace [NOT RELEASED] with version for promotion
            # Pre-calculate the date to avoid command substitution issues in sed
            local release_date
            release_date=$(date +"%Y-%m-%d")
            local replacement_text="[$version] - $release_date"
            
            # Simply replace [NOT RELEASED] with the new version
            # The ordering will be handled naturally since [NOT RELEASED] is at the top
            if ! awk -v replacement="$replacement_text" '
                /\[NOT RELEASED\]/ { 
                    gsub(/\[NOT RELEASED\]/, replacement)
                } 
                { print }
            ' CHANGELOG.md > CHANGELOG.md.tmp; then
                echo "❌ Failed to update CHANGELOG.md for release"
                mv CHANGELOG.md.backup CHANGELOG.md
                return 1
            fi
            
            # Move the temporary file to replace the original
            if ! mv CHANGELOG.md.tmp CHANGELOG.md; then
                echo "❌ Failed to finalize CHANGELOG.md update"
                mv CHANGELOG.md.backup CHANGELOG.md
                return 1
            fi
            
            echo "✅ Updated CHANGELOG.md with release version: $version"
        fi
    else
        # Add regular commit to [NOT RELEASED] section
        if ! grep -q "\[NOT RELEASED\]" CHANGELOG.md; then
            # Insert [NOT RELEASED] section after the third line
            if ! sed -i '3a\\n## [NOT RELEASED]\n' CHANGELOG.md; then
                echo "❌ Failed to insert [NOT RELEASED] section"
                mv CHANGELOG.md.backup CHANGELOG.md
                return 1
            fi
        fi
        
        # Get current date and time in ISO 8601 format
        local datetime
        datetime=$(date +"%Y-%m-%d %H:%M:%S")
        
        # Get current version from package.json
        local current_version
        current_version=$(jq -r '.version' package.json 2>/dev/null || echo "unknown")
        
        # Escape special characters in commit message for sed
        local escaped_commit_message
        escaped_commit_message=$(printf '%s\n' "$commit_message" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        # Insert commit message with version, date and time under [NOT RELEASED] section
        if ! sed -i "/## \[NOT RELEASED\]/a - [V$current_version - $datetime] $escaped_commit_message" CHANGELOG.md; then
            echo "❌ Failed to update CHANGELOG.md"
            mv CHANGELOG.md.backup CHANGELOG.md
            return 1
        fi
        echo "✅ Added commit to CHANGELOG.md under [NOT RELEASED] section"
    fi
    
    # Clean up backup file
    rm CHANGELOG.md.backup
    return 0
}

# Function to handle hotfix workflow (for fix branch)
handle_hotfix_workflow() {
    if ! validate_git_repo; then
        echo "❌ Invalid git repository or missing required tools"
        return 1
    fi

    local commit_message="$1"
    
    echo "🚀 Starting hotfix workflow..."
    
    # Update package.json version (patch)
    local new_version
    new_version=$(update_package_version "patch")
    if [[ $? -ne 0 ]]; then
        echo "❌ Failed to update package.json version"
        return 1
    fi
    
    # Update CHANGELOG.md for hotfix
    if ! update_changelog "$commit_message" "true" "$new_version" "true"; then
        echo "❌ Failed to update CHANGELOG.md for hotfix"
        return 1
    fi
    
    # Commit hotfix changes
    echo "📦 Committing hotfix changes..."
    git add -A
    
    if ! git commit -m "$commit_message"; then
        echo "❌ Failed to commit hotfix changes"
        return 1
    fi
    
    # Push to fix branch
    echo "⬆️  Pushing to fix branch..."
    if ! git push origin fix; then
        echo "❌ Failed to push hotfix to fix branch"
        return 1
    fi
    
    # Merge to main branch
    echo "🔀 Merging hotfix to main branch..."
    
    if ! git checkout main; then
        echo "❌ Failed to checkout main branch"
        return 1
    fi
    
    if ! git pull origin main; then
        echo "❌ Failed to pull latest changes from main. Returning to fix branch."
        if ! git checkout fix; then
            echo "⚠️  Warning: Failed to return to fix branch"
        fi
        return 1
    fi
    
    if ! git merge fix; then
        echo "❌ Failed to merge fix into main. Returning to fix branch."
        if ! git checkout fix; then
            echo "⚠️  Warning: Failed to return to fix branch"
        fi
        return 1
    fi
    
    if ! git push origin main; then
        echo "❌ Failed to push to main branch. Returning to fix branch."
        if ! git checkout fix; then
            echo "⚠️  Warning: Failed to return to fix branch"
        fi
        return 1
    fi
    
    # Return to fix branch
    if ! git checkout fix; then
        echo "⚠️  Warning: Failed to return to fix branch"
    fi
    
    echo "✅ Hotfix workflow completed successfully!"
    echo "📋 Version $new_version has been deployed to main branch"
    
    return 0
}

# Function to validate git repository and required tools
validate_git_repo() {
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        echo "❌ Not a valid git repository"
        return 1
    fi
    
    if ! command -v jq &>/dev/null; then
        echo "❌ jq is required but not installed"
        return 1
    fi
    
    if ! command -v sed &>/dev/null; then
        echo "❌ sed is required but not installed"
        return 1
    fi
    
    return 0
}