/**
 * @module preload
 */
import remote from '@electron/remote'
import { ipcRenderer } from 'electron'

(window as any).ipcRenderer = ipcRenderer;
(window as any).remote = remote;