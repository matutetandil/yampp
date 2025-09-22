import { PlatformInfo } from './platform-info.interface.js';

export interface WindowsPlatformInfo extends PlatformInfo {
  powershellVersion?: string;
  windowsVersion?: string;
}