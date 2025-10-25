# Local Versioning and Release Guide

**Current Version: V1.2.0**

This guide explains the local versioning system used in the Life OS project, which follows semantic versioning (SemVer) and conventional commits.

## Table of Contents

1. [Overview](#overview)
2. [Version Structure](#version-structure)
3. [Scripts Overview](#scripts-overview)
4. [Workflow](#workflow)
5. [Commands Reference](#commands-reference)
6. [Automated Updates](#automated-updates)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The project uses an automated versioning system with three main scripts:
- `commit.sh` - Interactive commit helper with automatic patch version bumping
- `promote.sh` - Branch promotion with minor/major version bumping
- `functions.sh` - Shared utility functions for version management

## Version Structure

The project follows [Semantic Versioning (SemVer)](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** (X.0.0): Breaking changes or significant feature releases
- **MINOR** (0.X.0): New features that are backward compatible
- **PATCH** (0.0.X): Bug fixes and small improvements

## Scripts Overview

### 1. commit.sh
Interactive script for creating conventional commits with automatic patch version bumping.

**Features:**
- Validates git repository and required tools
- Ensures you're on `dev` or `fix` branch
- Provides interactive commit type selection
- Automatically bumps patch version
- Updates CHANGELOG.md
- Offers branch promotion after commit

### 2. promote.sh
Script for promoting changes from development to main branch with version bumping.

**Features:**
- Supports minor and major version bumps
- Updates CHANGELOG.md with release version
- Merges dev branch to main
- Automatically returns to dev branch

### 3. functions.sh
Utility functions shared between scripts.

**Functions:**
- `update_package_version()` - Updates package.json version
- `update_changelog()` - Manages CHANGELOG.md entries
- `validate_git_repo()` - Validates environment and tools

## Workflow

### Development Workflow (dev branch)

1. **Make changes** on `dev` branch
2. **Commit changes** using the commit script:
   ```bash
   pnpm commit
   ```
3. **Choose commit type** from the interactive menu
4. **Enter description** for your changes
5. **Review and confirm** the commit message
6. **Decide on promotion** when prompted (optional)

### Hotfix Workflow (fix branch)

1. **Switch to fix branch**:
   ```bash
   git checkout fix
   ```
2. **Make critical fixes** 
3. **Commit changes** using the commit script:
   ```bash
   pnpm commit
   ```
4. **The system automatically**:
   - Bumps patch version (e.g., 1.2.0 → 1.2.1)
   - Updates CHANGELOG.md with new release section
   - Pushes to fix branch
   - Merges to main branch
   - Deploys fix to production

⚠️ **Warning**: Fix branch commits are immediately deployed to production!

### Release Workflow (dev → main promotion)

1. **Complete development** on dev branch
2. **Run promotion script**:
   ```bash
   pnpm promote
   ```
3. **Choose promotion level**:
   - `0` for major release (X.0.0)
   - `1` for minor release (0.X.0)
4. **Automatic merge** to main branch
5. **Return to dev** for continued development

## Commands Reference

### Available Scripts

```bash
# Development workflow
pnpm commit          # Interactive commit helper
pnpm promote         # Branch promotion helper

# Alternative direct execution
./scripts/commit.sh
./scripts/promote.sh
```

### Commit Types

| Choice | Type | Description |
|--------|------|-------------|
| 1 | `feat:` | New feature |
| 2 | `fix:` | Bug fix |
| 3 | `docs:` | Documentation change |
| 4 | `style:` | Code style change |
| 5 | `refactor:` | Code refactoring |
| 6 | `perf:` | Performance improvement |
| 7 | `test:` | Test changes |
| 8 | `chore:` | Non-functional change |
| 9 | `security:` | Security fix |
| 10 | `revert:` | Revert changes |
| 11 | `done:` | Completed tasks |
| 12 | `wip:` | Work in progress |
| 13 | `started:` | New tasks |

## Automated Updates

### Package.json
- **Patch**: Automatically incremented with each commit
- **Minor**: Incremented during minor promotions (resets patch to 0)
- **Major**: Incremented during major promotions (resets minor and patch to 0)

### README.md
- Version badge automatically updated with new version
- Pattern: `Current Version: **VX.X.X**`

### CHANGELOG.md
- **Regular commits (dev)**: Added under `[NOT RELEASED]` section with timestamp
- **Promotions (dev → main)**: `[NOT RELEASED]` replaced with version and release date
- **Hotfixes (fix → main)**: New section created above existing versions
- Format: `[VERSION] - YYYY-MM-DD`

#### Changelog Ordering
When hotfixes are deployed, the changelog maintains proper version ordering:

```markdown
## [1.3.0] - 2025-06-01  # ← New dev release (higher version)
- [2025-06-01 10:30:00] feat: new dashboard feature

## [1.2.1] - 2025-05-31  # ← Previous hotfix (lower version)
- [2025-05-31 15:45:12] fix: critical security issue

## [1.2.0] - 2025-05-30  # ← Original release
- [2025-05-30 14:20:30] feat: user authentication
```

## Branch-Specific Workflows

### Dev Branch Workflow
1. **Purpose**: Feature development and non-critical fixes
2. **Version Impact**: Patch increment per commit
3. **Deployment**: Manual promotion to main via `pnpm promote`
4. **Changelog**: Entries added to `[NOT RELEASED]` section

### Fix Branch Workflow  
1. **Purpose**: Critical bug fixes requiring immediate deployment
2. **Version Impact**: Automatic patch increment (e.g., 1.2.0 → 1.2.1)
3. **Deployment**: Automatic deployment to main branch
4. **Changelog**: New versioned section created above existing entries

⚠️ **Important**: Fix branch commits bypass the normal promotion process and deploy immediately to production!

## Best Practices

### Branch Management
- Work on `dev` branch for features and improvements
- Use `fix` branch for urgent bug fixes
- Only promote stable, tested code to `main`

### Commit Messages
- Use descriptive, clear commit messages
- Keep descriptions between 5-100 characters
- Use lowercase for consistency
- Be specific about what changed

### Version Bumping
- **Patch**: Small fixes, typos, minor improvements
- **Minor**: New features, significant improvements
- **Major**: Breaking changes, major feature releases

### Pre-commit Checklist
- [ ] Code is tested and working
- [ ] Documentation is updated if needed
- [ ] No breaking changes (unless major release)
- [ ] Commit message is clear and descriptive

## Troubleshooting

### Common Issues

#### "Not a valid git repository"
```bash
# Ensure you're in the project root
cd /home/etudiant/Documents/life_os
git status
```

#### "jq is required but not installed"
```bash
# Install jq on Ubuntu/Debian
sudo apt-get install jq

# Install jq on other systems
# Check https://stedolan.github.io/jq/download/
```

#### "Failed to update package.json"
- Check file permissions
- Ensure package.json exists and is valid JSON
- Verify jq is working: `jq '.version' package.json`

#### "Failed to checkout main branch"
- Ensure main branch exists: `git branch -a`
- Check for uncommitted changes: `git status`
- Ensure remote is properly configured: `git remote -v`

### Recovery Commands

#### Reset version manually
```bash
# Edit package.json manually
nano package.json

# Update README.md
sed -i 's/Current Version: \*\*V[0-9]\+\.[0-9]\+\.[0-9]\+\*\*/Current Version: **V1.2.0**/' README.md
```

#### Force branch sync
```bash
# Reset dev to match main
git checkout dev
git reset --hard origin/main
git push --force-with-lease origin dev
```

## Dependencies

### Required Tools
- `git` - Version control
- `jq` - JSON processor for package.json manipulation
- `sed` - Stream editor for file modifications
- `bash` - Shell for script execution

### Optional Tools
- `husky` - Git hooks (configured in package.json)
- `commitlint` - Commit message linting

## Configuration Files

### package.json Scripts
```json
{
    "commit": "./scripts/commit.sh",
    "promote": "./scripts/promote.sh"
}
```

### Commitlint Integration
The project includes commitlint configuration for enforcing conventional commits.

---

## Quick Reference

### Typical Development Session
```bash
# 1. Start development
git checkout dev
git pull origin dev

# 2. Make changes
# ... code changes ...

# 3. Commit with version bump
./scripts/commit.sh

# 4. Optional: Promote to main
# (during commit process or separately)
./scripts/promote.sh
```

### Version Examples
- `1.2.3` → `1.2.4` (patch via commit)
- `1.2.4` → `1.3.0` (minor via promotion)
- `1.3.0` → `2.0.0` (major via promotion)

---

*Last updated: 2025-05-31*