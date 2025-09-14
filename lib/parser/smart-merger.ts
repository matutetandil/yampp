import type { AstNode } from '../ast/types/ast-node.js';
import type { AstTask } from '../ast/types/ast-task.js';
import type { AstAnnotationBlock } from '../ast/types/ast-annotation-block.js';
import type { AstPlatformBlock } from '../ast/types/ast-platform-block.js';
import type { ResolvedInclude } from './types/resolved-include.js';
import type { MergeContext } from './types/merge-context.js';
import type { ConflictInfo } from './types/conflict-info.js';
import { ProfileFilter } from '../execution/profile-filter.js';

/**
 * Smart merger that combines ASTs with profile-awareness and conflict detection
 * Only processes content that matches active profiles for optimal performance
 */
export class SmartMerger {
  private readonly profileFilter: ProfileFilter;

  constructor(activeProfiles: string[]) {
    this.profileFilter = new ProfileFilter({ profiles: activeProfiles });
  }

  /**
   * Merge main AST with resolved includes using profile-aware filtering
   * @param mainAst - Main Yamfile AST
   * @param resolvedIncludes - Array of resolved include files
   * @param context - Merge context with active profiles
   * @returns Merged AST with only relevant content for active profiles
   */
  public merge(mainAst: AstNode, resolvedIncludes: ResolvedInclude[], context: MergeContext): AstNode {
    // Start with filtered main AST
    const mergedAst: AstNode = this.filterAstByProfile(mainAst, context.mainFilePath);
    
    // Process each include with profile filtering
    for (const include of resolvedIncludes) {
      const filteredIncludeAst = this.filterAstByProfile(include.ast, include.resolvedPath);
      this.mergeFiltered(mergedAst, filteredIncludeAst, context.mainFilePath, include.resolvedPath);
    }

    return mergedAst;
  }

  /**
   * Filter AST content based on active profiles - only keep what's needed
   * @param ast - Source AST to filter
   * @param filePath - File path for error context
   * @returns Filtered AST with only profile-relevant content
   */
  private filterAstByProfile(ast: AstNode, filePath: string): AstNode {
    const filteredAst: AstNode = {
      variables: [...ast.variables],
      constants: [...ast.constants],
      environmentVariables: ast.environmentVariables ? [...ast.environmentVariables] : [],
      platformBlocks: ast.platformBlocks ? [...ast.platformBlocks] : [],
      annotationBlocks: [],
      includes: [], // Includes are already processed
      defaultProfile: ast.defaultProfile || null,
      tasks: [...ast.tasks] // Regular tasks (no profile restrictions)
    };

    // Profile-aware filtering: only extract tasks from annotation blocks that match active profiles
    if (ast.annotationBlocks && ast.annotationBlocks.length > 0) {
      const profileTasks = this.profileFilter.extractTasksFromBlocks(ast.annotationBlocks);
      
      // Add profile-filtered tasks to regular tasks
      filteredAst.tasks.push(...profileTasks);
      
      // Keep annotation blocks for potential future processing, but they're already filtered
      filteredAst.annotationBlocks = [];
    }

    return filteredAst;
  }

  /**
   * Merge filtered include AST into main AST with conflict detection
   * @param mainAst - Main AST to merge into (modified in place)
   * @param includeAst - Include AST to merge from
   * @param mainFilePath - Main file path for conflict reporting
   * @param includeFilePath - Include file path for conflict reporting
   */
  private mergeFiltered(mainAst: AstNode, includeAst: AstNode, mainFilePath: string, includeFilePath: string): void {
    const conflicts: ConflictInfo[] = [];

    // Merge tasks with duplicate detection
    for (const includeTask of includeAst.tasks) {
      const existingTask = mainAst.tasks.find(t => t.name === includeTask.name);
      if (existingTask) {
        conflicts.push({
          type: 'task',
          name: includeTask.name,
          mainFile: mainFilePath,
          conflictFile: includeFilePath,
          mainLocation: existingTask.location,
          conflictLocation: includeTask.location
        });
      } else {
        mainAst.tasks.push(includeTask);
      }
    }

    // Merge variables with duplicate detection
    for (const includeVar of includeAst.variables) {
      const existingVar = mainAst.variables.find(v => v.name === includeVar.name);
      if (existingVar) {
        conflicts.push({
          type: 'variable',
          name: includeVar.name,
          mainFile: mainFilePath,
          conflictFile: includeFilePath,
          mainLocation: existingVar.location,
          conflictLocation: includeVar.location
        });
      } else {
        mainAst.variables.push(includeVar);
      }
    }

    // Merge constants with duplicate detection
    for (const includeConst of includeAst.constants) {
      const existingConst = mainAst.constants.find(c => c.name === includeConst.name);
      if (existingConst) {
        conflicts.push({
          type: 'constant',
          name: includeConst.name,
          mainFile: mainFilePath,
          conflictFile: includeFilePath,
          mainLocation: existingConst.location,
          conflictLocation: includeConst.location
        });
      } else {
        mainAst.constants.push(includeConst);
      }
    }

    // Merge environment variables
    if (includeAst.environmentVariables) {
      for (const includeEnv of includeAst.environmentVariables) {
        const existingEnv = mainAst.environmentVariables?.find(e => e.name === includeEnv.name);
        if (!existingEnv) {
          mainAst.environmentVariables = mainAst.environmentVariables || [];
          mainAst.environmentVariables.push(includeEnv);
        }
        // Note: Environment variables don't conflict - later definitions override
      }
    }

    // Check default profile conflicts
    if (includeAst.defaultProfile && mainAst.defaultProfile && includeAst.defaultProfile !== mainAst.defaultProfile) {
      conflicts.push({
        type: 'default_profile',
        name: 'default',
        mainFile: mainFilePath,
        conflictFile: includeFilePath
      });
    } else if (includeAst.defaultProfile && !mainAst.defaultProfile) {
      // Use include's default profile if main doesn't have one
      mainAst.defaultProfile = includeAst.defaultProfile;
    }

    // Merge platform blocks (no conflicts - they're platform-specific)
    if (includeAst.platformBlocks) {
      mainAst.platformBlocks = mainAst.platformBlocks || [];
      mainAst.platformBlocks.push(...includeAst.platformBlocks);
    }

    // Report conflicts
    if (conflicts.length > 0) {
      this.reportConflicts(conflicts);
    }
  }

  /**
   * Report merge conflicts with detailed context
   * @param conflicts - Array of detected conflicts
   */
  private reportConflicts(conflicts: ConflictInfo[]): void {
    const conflictMessages = conflicts.map(conflict => {
      const locationInfo = conflict.mainLocation 
        ? ` at line ${conflict.mainLocation.start?.line || 'unknown'}`
        : '';
      
      const conflictLocationInfo = conflict.conflictLocation
        ? ` at line ${conflict.conflictLocation.start?.line || 'unknown'}`
        : '';

      return `${conflict.type} '${conflict.name}' is defined in both ${conflict.mainFile}${locationInfo} and ${conflict.conflictFile}${conflictLocationInfo}`;
    });

    const message = `Include merge conflicts detected:\n${conflictMessages.map(m => `  • ${m}`).join('\n')}`;
    throw new Error(message);
  }
}