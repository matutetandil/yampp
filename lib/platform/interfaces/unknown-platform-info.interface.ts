import { PlatformInfo } from './platform-info.interface.js';

export interface UnknownPlatformInfo extends PlatformInfo {
  unknown: boolean;
  shell: string;
}