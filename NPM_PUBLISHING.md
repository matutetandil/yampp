# NPM Publishing Guide

This guide explains how to publish new versions of Yampp packages to npm.

**Note:** Yampp is published **manually** to npm. Automated GitHub Actions publishing was attempted but is not currently in use.

## Published Packages

- [`@yampp/yampp`](https://www.npmjs.com/package/@yampp/yampp) - Main task runner
- [`@yampp/plugin-types`](https://www.npmjs.com/package/@yampp/plugin-types) - TypeScript type definitions for plugins

## Prerequisites

### 1. NPM Account Setup

1. Create an account at [npmjs.com](https://www.npmjs.com/)
2. Verify your email address
3. Enable 2FA (two-factor authentication) for additional security

### 2. Login to NPM

```bash
# Login to npm from command line
npm login

# Enter your credentials
# Username: your-username
# Password: your-password
# Email: your-email
# OTP (if 2FA enabled): 123456
```

## Publishing Process

### Manual Publishing

```bash
# 1. Ensure you're logged in
npm whoami

# 2. Update versions in both packages
cd packages/plugin-types
npm version patch  # or minor, or major
cd ../yampp
npm version patch  # keep versions in sync

# 3. Commit version changes
git add packages/*/package.json
git commit -m "chore: bump version to 0.12.7"
git push origin main

# 4. Build and publish plugin-types FIRST
cd packages/plugin-types
pnpm run build
pnpm publish --access public

# 5. Build and publish yampp SECOND
cd ../yampp
pnpm run build
pnpm test  # ensure tests pass
pnpm publish --access public

# 6. Create git tag and push
git tag v0.12.7
git push origin v0.12.7
```

**Important:**
- Always publish `plugin-types` **before** `yampp` (yampp depends on it)
- Run tests before publishing yampp
- Keep version numbers synchronized between packages
- Tag the release after successful publishing

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backwards compatible
- **PATCH** (0.0.1): Bug fixes, backwards compatible

Examples:
```bash
npm version patch  # 0.12.6 → 0.12.7 (bug fixes)
npm version minor  # 0.12.6 → 0.13.0 (new features)
npm version major  # 0.12.6 → 1.0.0 (breaking changes)
```

### Version Synchronization

Keep versions synchronized across packages:
- `packages/plugin-types/package.json`
- `packages/yampp/package.json`
- Root `package.json`

## Release Checklist

Before creating a new release:

- [ ] All tests pass locally (`pnpm test`)
- [ ] Code is linted (`pnpm run lint`)
- [ ] CHANGELOG.md is updated with changes
- [ ] README.md reflects any new features or changes
- [ ] Version numbers are synchronized across all packages
- [ ] Git tag matches package.json versions (e.g., v0.12.7)
- [ ] Dependencies between packages are updated if needed

## Publishing Checklist

Use this checklist when publishing a new version:

- [ ] All tests pass locally (`cd packages/yampp && pnpm test`)
- [ ] Code is linted (`cd packages/yampp && pnpm run lint`)
- [ ] CHANGELOG.md is updated with changes
- [ ] README.md reflects any new features or changes
- [ ] Version numbers bumped in both packages
- [ ] Logged into npm (`npm whoami`)
- [ ] Build plugin-types successfully
- [ ] Publish plugin-types to npm
- [ ] Build yampp successfully
- [ ] Tests pass for yampp
- [ ] Publish yampp to npm
- [ ] Commit version changes
- [ ] Create and push git tag
- [ ] Verify packages on npmjs.com
- [ ] Test installation: `npm install -g @yampp/yampp`

## Troubleshooting

### "You cannot publish over the previously published versions"

- Increment the version number in all `package.json` files
- Create a new tag with the new version
- Ensure you haven't already published this version

### "403 Forbidden"

- Verify your NPM_TOKEN is correctly set in GitHub Secrets
- Ensure your npm account has publish permissions for @yampp scope
- Check if 2FA is enabled and configured correctly
- Make sure you're part of the @yampp organization on npm

### "Cannot find module '@yampp/plugin-types'"

- Ensure plugin-types is published before yampp
- The workflow automatically handles this order
- If publishing manually, always publish plugin-types first

### CI tests failing

- Run tests locally: `pnpm test`
- Fix any failing tests before pushing tags
- Check GitHub Actions logs for detailed error messages
- Ensure all platforms (Ubuntu, macOS, Windows) pass

## Package Information

### @yampp/plugin-types

- **Registry**: https://www.npmjs.com/package/@yampp/plugin-types
- **Purpose**: TypeScript type definitions for plugin development
- **Access**: Public
- **License**: MIT

### @yampp/yampp

- **Registry**: https://www.npmjs.com/package/@yampp/yampp
- **Purpose**: Main task runner with CLI
- **Access**: Public
- **License**: MIT
- **Binary**: Provides `yampp` command

## Post-Publishing

After successful publishing:

1. Verify packages on npm:
   - https://www.npmjs.com/package/@yampp/plugin-types
   - https://www.npmjs.com/package/@yampp/yampp

2. Test installation:
   ```bash
   npm install -g @yampp/yampp
   yampp --version
   ```

3. Create GitHub Release:
   - Go to repository releases
   - Create new release from the tag
   - Copy relevant CHANGELOG.md section
   - Publish release notes

4. Update documentation if needed
   - README.md with new features
   - CHANGELOG.md with release notes
   - Any affected examples

## Notes

- **Independent Packages**: Although organized as a monorepo, each package is published independently with its own dependencies and lock file.
- **Workspace Dependencies**: The yampp package uses `workspace:*` for plugin-types during development, which pnpm automatically converts to the correct version during publishing.
- **Publish Order**: Always publish plugin-types first, then yampp (yampp depends on plugin-types).
- **Lock Files**: Each package has its own `pnpm-lock.yaml` for reproducible builds.
- **Manual Process**: Publishing is done manually. Automated CI/CD was attempted but is not currently in use.

## Quick Publish Script

For convenience, here's a complete publish script:

```bash
#!/bin/bash
# publish.sh - Publish both yampp packages to npm

set -e  # Exit on error

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: ./publish.sh <version>"
  echo "Example: ./publish.sh 0.12.7"
  exit 1
fi

echo "Publishing version $VERSION..."

# Check npm login
npm whoami || { echo "Not logged in to npm. Run 'npm login' first."; exit 1; }

# Update versions
echo "Updating versions..."
cd packages/plugin-types
npm version $VERSION --no-git-tag-version
cd ../yampp
npm version $VERSION --no-git-tag-version
cd ../..

# Commit version bump
git add packages/*/package.json
git commit -m "chore: bump version to $VERSION"

# Publish plugin-types
echo "Publishing @yampp/plugin-types..."
cd packages/plugin-types
pnpm run build
pnpm publish --access public

# Publish yampp
echo "Publishing @yampp/yampp..."
cd ../yampp
pnpm run build
pnpm test
pnpm publish --access public

# Tag and push
cd ../..
git tag "v$VERSION"
git push origin main
git push origin "v$VERSION"

echo "✅ Successfully published version $VERSION!"
echo "Verify at:"
echo "  - https://www.npmjs.com/package/@yampp/plugin-types"
echo "  - https://www.npmjs.com/package/@yampp/yampp"
```
