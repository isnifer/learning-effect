import type DesktopApi from './DesktopApi'

declare global {
  interface Window {
    readonly redDocket?: DesktopApi
  }
}

export {}
