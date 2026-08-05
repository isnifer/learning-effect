import { describe, expect, it } from '@effect/vitest'
import {
  posixAbsoluteProjectDirectoryPathPattern,
  windowsDriveAbsoluteProjectDirectoryPathPattern,
  windowsUncAbsoluteProjectDirectoryPathPattern,
} from './projectDirectoryPathPatterns'

describe('projectDirectoryPathPatterns', () => {
  describe('posixAbsoluteProjectDirectoryPathPattern', () => {
    it('test: accepts an absolute POSIX path', () => {
      expect(posixAbsoluteProjectDirectoryPathPattern.test('/red-docket')).toBe(true)
    })

    it('test: rejects a relative POSIX path', () => {
      expect(posixAbsoluteProjectDirectoryPathPattern.test('red-docket')).toBe(false)
    })
  })

  describe('windowsDriveAbsoluteProjectDirectoryPathPattern', () => {
    it('test: accepts Windows paths with either directory separator', () => {
      expect(windowsDriveAbsoluteProjectDirectoryPathPattern.test('C:\\red-docket')).toBe(true)
      expect(windowsDriveAbsoluteProjectDirectoryPathPattern.test('C:/red-docket')).toBe(true)
    })

    it('test: rejects a drive-relative Windows path', () => {
      expect(windowsDriveAbsoluteProjectDirectoryPathPattern.test('C:red-docket')).toBe(false)
    })
  })

  describe('windowsUncAbsoluteProjectDirectoryPathPattern', () => {
    it('test: accepts a Windows UNC path containing a server and share', () => {
      expect(
        windowsUncAbsoluteProjectDirectoryPathPattern.test('\\\\server\\share\\red-docket')
      ).toBe(true)
      expect(windowsUncAbsoluteProjectDirectoryPathPattern.test('//server/share/red-docket')).toBe(
        true
      )
    })

    it('test: rejects a Windows UNC path without a share', () => {
      expect(windowsUncAbsoluteProjectDirectoryPathPattern.test('\\\\server')).toBe(false)
    })
  })
})
