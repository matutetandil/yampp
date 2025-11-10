# NPM Publishing Guide

This guide explains how to publish new versions of Yampp packages to npm.

## Packages Published

- `@yampp/plugin-types` - TypeScript type definitions for Yampp plugins
- `@yampp/yampp` - Main Yampp task runner

## Prerequisites

### 1. NPM Account Setup

1. Create an account at [npmjs.com](https://www.npmjs.com/)
2. Verify your email address
3. Enable 2FA (two-factor authentication) for additional security

### 2. Generate NPM Access Token

1. Go to [npmjs.com/settings/tokens](https://www.npmjs.com/settings/~/tokens)
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type (for CI/CD)
4. Copy the generated token (you won't see it again!)

### 3. Configure GitHub Secret

1. Go to your GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click "Add secret"

## Publishing Process

### Automatic Publishing (Recommended)

The repository is configured to automatically publish to npm when you create a git tag:

```bash
# 1. Update versions in both packages
cd packages/plugin-types
npm version patch  # or minor, or major

cd ../yampp
npm version patch  # should match plugin-types version

# 2. Commit the version changes
git add packages/*/package.json
git commit -m "chore: bump version to 0.12.7"

# 3. Create and push the tag
git tag v0.12.7
git push origin main --tags

# GitHub Actions will automatically:
# - Run tests on multiple platforms
# - Build both packages
# - Publish @yampp/plugin-types first
# - Publish @yampp/yampp second
```

### Manual Publishing (Not Recommended)

If you need to publish manually:

```bash
# 1. Login to npm
npm login

# 2. Build and publish plugin-types first
cd packages/plugin-types
pnpm run build
pnpm publish --access public

# 3. Build and publish yampp
cd ../yampp
pnpm run build
pnpm publish --access public
```

**Note:** plugin-types must be published first since yampp depends on it.

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

## Workflow Details

### Publish Workflow

Triggers on git tags starting with `v` (`.github/workflows/publish.yml`):

1. **Setup**: Installs pnpm and Node.js 20
2. **Install**: Runs `pnpm install --frozen-lockfile`
3. **Build**: Runs `pnpm run build` (builds all packages)
4. **Test**: Runs `pnpm test` (unit + integration tests)
5. **Publish plugin-types**: Publishes `@yampp/plugin-types` to npm
6. **Publish yampp**: Publishes `@yampp/yampp` to npm

### CI Workflow

Runs on every push to `main` or `develop` (`.github/workflows/ci.yml`):

- Tests on Ubuntu, macOS, and Windows
- Tests on Node.js 18.x and 20.x
- Runs linting on Ubuntu + Node 20

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

- **Workspace Dependencies**: The yampp package uses `workspace:*` for plugin-types during development, which pnpm automatically converts to the correct version during publishing.
- **Build Order**: pnpm automatically handles the build order based on workspace dependencies.
- **Cache**: GitHub Actions caches pnpm dependencies for faster builds.
