// Main plugin system exports
export { PluginManager } from './PluginManager.js';
export { PluginResolver } from './PluginResolver.js';
export { PluginIntegrator } from './PluginIntegrator.js';
export { PluginAwareParser } from './PluginAwareParser.js';

// Auth system exports
export { AuthStrategyManager } from './auth/AuthStrategyManager.js';
export { AuthStrategyFactory } from './auth/AuthStrategyFactory.js';
export type { IAuthStrategy } from './auth/IAuthStrategy.js';

// Resolver exports
export { ImportResolverManager } from './resolvers/ImportResolverManager.js';
export { NpmResolver } from './resolvers/NpmResolver.js';
export { GitResolver } from './resolvers/GitResolver.js';
export { HttpsResolver } from './resolvers/HttpsResolver.js';
export { FileResolver } from './resolvers/FileResolver.js';
export type { IImportResolver, ImportSource } from './resolvers/IImportResolver.js';

// Adapter exports
export { FunctionPluginAdapter } from './adapters/FunctionPluginAdapter.js';
export { ModifierAdapter } from './adapters/ModifierAdapter.js';
export { CommandAdapter } from './adapters/CommandAdapter.js';

// Type exports
export type { ImportStatement } from './types/ImportStatement.js';

// Auth strategy exports
export { InlineCredentialsStrategy } from './auth/strategies/InlineCredentialsStrategy.js';
export { DomainSpecificStrategy } from './auth/strategies/DomainSpecificStrategy.js';
export { GitHubTokenStrategy } from './auth/strategies/GitHubTokenStrategy.js';
export { GitLabTokenStrategy } from './auth/strategies/GitLabTokenStrategy.js';
export { GenericBearerStrategy } from './auth/strategies/GenericBearerStrategy.js';
export { GenericBasicStrategy } from './auth/strategies/GenericBasicStrategy.js';