import type { AstAnnotationBlock } from '../ast/types/ast-annotation-block.js';
import type { AstTask } from '../ast/types/ast-task.js';
import type { ProfileFilterOptions } from './types/profile-filter-options.js';
import { platformDetector } from '../platform/index.js';
import { Platforms } from '../core/constants/platforms.constants.js';

/**
 * Filters tasks from annotation blocks based on profiles and platform detection
 * Supports nested annotation blocks with arbitrary combinations
 */
export class ProfileFilter {
  private readonly activeProfiles: Set<string>;

  constructor(options: ProfileFilterOptions) {
    this.activeProfiles = new Set(options.profiles);
  }

  /**
   * Extract tasks from annotation blocks that match active profiles and current platform
   * @param annotationBlocks - Array of annotation blocks from AST
   * @returns Array of tasks that match the filtering criteria
   */
  public extractTasksFromBlocks(annotationBlocks: AstAnnotationBlock[]): AstTask[] {
    const tasks: AstTask[] = [];

    for (const block of annotationBlocks) {
      this.processAnnotationBlock(block, [], tasks);
    }

    return tasks;
  }

  /**
   * Recursively process annotation blocks, building context and extracting matching tasks
   * @param block - Current annotation block to process
   * @param parentAnnotations - Annotations from parent blocks
   * @param tasks - Array to collect matching tasks
   */
  private processAnnotationBlock(
    block: AstAnnotationBlock,
    parentAnnotations: string[],
    tasks: AstTask[]
  ): void {
    // Combine parent annotations with current block annotations
    const allAnnotations = [...parentAnnotations, ...block.annotations];
    
    // Check if this annotation context matches our criteria
    if (this.shouldIncludeContext(allAnnotations)) {
      // Process content within this matching context
      for (const content of block.content) {
        if (content.type === 'task') {
          // Mark task with its annotation context for debugging
          const taskWithContext = { 
            ...content, 
            _profileContext: allAnnotations 
          } as AstTask & { _profileContext: string[] };
          tasks.push(taskWithContext);
        } else if (content.type === 'annotation_block') {
          // Recursively process nested annotation blocks
          this.processAnnotationBlock(content, allAnnotations, tasks);
        }
      }
    }
  }

  /**
   * Determine if an annotation context should be included based on profiles and platform
   * @param annotations - All annotations in the current context (including parents)
   * @returns True if this context matches filtering criteria
   */
  private shouldIncludeContext(annotations: string[]): boolean {
    // If no profiles are active, don't process any profile-based blocks
    if (this.activeProfiles.size === 0) {
      return false;
    }

    // Check platform annotations (these are automatically matched)
    const platformAnnotations = annotations.filter(this.isPlatformAnnotation);
    const profileAnnotations = annotations.filter(a => !this.isPlatformAnnotation(a));

    // Platform check: if there are platform annotations, at least one must match
    if (platformAnnotations.length > 0) {
      const platformMatches = platformDetector.platformMatches(platformAnnotations);
      if (!platformMatches) {
        return false; // Platform doesn't match, exclude entire context
      }
    }

    // Profile check: if there are profile annotations, at least one must be active
    if (profileAnnotations.length > 0) {
      const profileMatches = profileAnnotations.some(profile => 
        this.activeProfiles.has(profile)
      );
      if (!profileMatches) {
        return false; // No active profiles match, exclude context
      }
    }

    // If we have active profiles but no profile annotations in this context,
    // only include if there are no profile annotations at all (platform-only block)
    if (this.activeProfiles.size > 0 && profileAnnotations.length === 0) {
      return platformAnnotations.length > 0; // Only include platform-only blocks
    }

    return true; // All checks passed
  }

  /**
   * Check if an annotation represents a platform (linux, mac, windows)
   * Uses centralized platform constants following Open-Closed Principle
   */
  private isPlatformAnnotation(annotation: string): boolean {
    const supportedPlatforms = Object.values(Platforms) as string[];
    return supportedPlatforms.includes(annotation.toLowerCase());
  }
}