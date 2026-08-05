import {
  posixAbsoluteProjectDirectoryPathPattern,
  windowsDriveAbsoluteProjectDirectoryPathPattern,
  windowsUncAbsoluteProjectDirectoryPathPattern,
} from './projectDirectoryPathPatterns'

const absoluteProjectDirectoryPathPatterns = [
  posixAbsoluteProjectDirectoryPathPattern,
  windowsDriveAbsoluteProjectDirectoryPathPattern,
  windowsUncAbsoluteProjectDirectoryPathPattern,
] as const

const isAbsoluteProjectDirectoryPath = (
  absolutePath: string,
  platform?: NodeJS.Platform
): boolean => {
  if (!absolutePath || absolutePath.includes('\0')) {
    return false
  }

  const isWindowsAbsolutePath =
    windowsDriveAbsoluteProjectDirectoryPathPattern.test(absolutePath) ||
    windowsUncAbsoluteProjectDirectoryPathPattern.test(absolutePath)

  if (platform === 'win32') {
    return isWindowsAbsolutePath
  }

  const isPosixAbsolutePath = posixAbsoluteProjectDirectoryPathPattern.test(absolutePath)

  return platform
    ? isPosixAbsolutePath
    : absoluteProjectDirectoryPathPatterns.some(pattern => pattern.test(absolutePath))
}

export default isAbsoluteProjectDirectoryPath
