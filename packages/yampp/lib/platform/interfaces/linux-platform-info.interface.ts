import { PlatformInfo } from './platform-info.interface.js';

export interface LinuxPlatformInfo extends PlatformInfo {
  shell?: string;
  distribution?: string;
}