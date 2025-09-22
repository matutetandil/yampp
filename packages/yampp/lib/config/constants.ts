/**
 * Application Constants
 * Centralized location for all magic numbers and configuration values
 * Improves maintainability and eliminates scattered magic numbers
 */

// Execution Configuration
export const EXECUTION_CONFIG = {
  DEFAULT_PARALLEL_JOBS: 10,
  SINGLE_JOB_LIMIT: 1,
  AVG_COMMAND_TIME_SECONDS: 0.5,
  MIN_PARALLEL_EFFICIENCY: 0.1,
  MAX_PARALLEL_EFFICIENCY: 1.0
} as const;

// Output Configuration
export const OUTPUT_CONFIG = {
  MAX_LINES_PER_TASK: 10,
  MAX_TASKS_DISPLAY: 20,
  LINE_TRUNCATE_LENGTH: 2000,
  MAX_OUTPUT_CHARS: 30000,
  DEFAULT_LINE_OFFSET: 1
} as const;

// Timeout Configuration
export const TIMEOUT_CONFIG = {
  COMMAND_TIMEOUT_MS: 120000,        // 2 minutes
  LONG_COMMAND_TIMEOUT_MS: 600000,   // 10 minutes
  CTRL_C_TIMEOUT_MS: 2000,           // 2 seconds for double Ctrl+C
  WATCH_DEBOUNCE_MS: 500,            // File watching debounce
  CACHE_CLEANUP_INTERVAL_MS: 60000   // 1 minute
} as const;

// File System Configuration
export const FILE_CONFIG = {
  STATE_DIRECTORY: '.yampp',
  CACHE_FILE_EXTENSION: '.done',
  DEFAULT_YAMFILE_NAME: 'Yamfile',
  ALTERNATIVE_YAMFILE_EXTENSION: '.yamfile',
  TEMP_FILE_PREFIX: 'yampp_',
  MAX_FILE_READ_LINES: 2000
} as const;

// Validation Configuration
export const VALIDATION_CONFIG = {
  MAX_TASK_NAME_LENGTH: 100,
  MAX_DEPENDENCY_DEPTH: 50,
  MAX_PARAMETER_COUNT: 20,
  MAX_COMMAND_LENGTH: 10000,
  RESERVED_TASK_NAMES: ['all', 'clean', 'list', 'help', 'version'] as readonly string[]
} as const;

// Color Configuration
export const COLOR_CONFIG = {
  AVAILABLE_COLORS_COUNT: 10,
  TASK_PREFIX_MAX_LENGTH: 30,
  ERROR_COLOR_CODE: '#ff0000',
  SUCCESS_COLOR_CODE: '#00ff00',
  WARNING_COLOR_CODE: '#ffff00'
} as const;

// Pattern Matching Configuration
export const PATTERN_CONFIG = {
  VARIABLE_REGEX: /\$([a-zA-Z_][a-zA-Z0-9_]*)/g,
  ASSIGNMENT_REGEX: /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/,
  FUNCTION_CALL_REGEX: /__([a-zA-Z_][a-zA-Z0-9_]*)/,
  PARAMETER_REGEX: /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  YAMPP_COMMENT_REGEX: /\/\/.*$/gm,
  YAMPP_MULTILINE_COMMENT_REGEX: /\/\*[\s\S]*?\*\//g
} as const;

// Internal Function Configuration
export const INTERNAL_FUNCTION_CONFIG = {
  FUNCTION_PREFIX: '__',
  MAX_RECURSION_DEPTH: 100,
  DEFAULT_INPUT_TIMEOUT_MS: 30000,
  MAX_PARAMETER_LENGTH: 1000
} as const;

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  LARGE_TASK_THRESHOLD: 100,        // Tasks with 100+ commands
  MEMORY_WARNING_MB: 512,           // Warn if memory usage exceeds
  GC_TRIGGER_INTERVAL: 1000,        // Milliseconds between GC checks
  STATS_COLLECTION_INTERVAL: 5000   // Performance stats collection
} as const;

// Watch Mode Configuration
export const WATCH_CONFIG = {
  INITIAL_SCAN_TIMEOUT: 5000,
  FILE_CHANGE_DEBOUNCE: 300,
  MAX_WATCH_FILES: 10000,
  WATCH_IGNORED_PATTERNS: [
    '**/.git/**',
    '**/node_modules/**',
    '**/.yampp/**',
    '**/.*'
  ] as readonly string[]
} as const;

// CLI Configuration
export const CLI_CONFIG = {
  HELP_TEXT_WIDTH: 80,
  OPTION_INDENT: 2,
  EXAMPLE_INDENT: 4,
  VERSION_FORMAT: 'x.y.z',
  EXIT_CODE_SUCCESS: 0,
  EXIT_CODE_ERROR: 1,
  EXIT_CODE_INTERRUPTED: 130
} as const;

// Hash Configuration
export const HASH_CONFIG = {
  ALGORITHM: 'md5' as const,
  ENCODING: 'hex' as const,
  SALT_LENGTH: 16,
  CACHE_KEY_PREFIX: 'yampp_'
} as const;

// Network/External Configuration (if needed for future features)
export const NETWORK_CONFIG = {
  DEFAULT_TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  CONNECTION_POOL_SIZE: 10
} as const;