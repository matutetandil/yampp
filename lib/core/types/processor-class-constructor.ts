import { PlatformStrategy } from '../../platform/types/platform-strategy';
import { IInternalFunctionRegistry } from '../../internal-functions/internal-function-registry.interface';
import { BaseContentProcessor } from '../../shell-content/base-content-processor';

export type ProcessorClassConstructor = new (
  platformStrategy: PlatformStrategy,
  internalFunctionRegistry: IInternalFunctionRegistry,
) => BaseContentProcessor;