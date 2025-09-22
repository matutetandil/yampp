import { PlatformInfo } from './platform-info.interface.js';

export interface MacPlatformInfo extends PlatformInfo {
  shell?: string;
  version?: string;
}