import { describe, expect, it } from '@effect/vitest'
import isAbsoluteProjectDirectoryPath from './isAbsoluteProjectDirectoryPath'

describe('isAbsoluteProjectDirectoryPath', () => {
  it('validate: accepts a fully qualified Windows drive path', () => {
    expect(isAbsoluteProjectDirectoryPath('C:\\red-docket', 'win32')).toBe(true)
  })

  it('validate: accepts a fully qualified Windows UNC path', () => {
    expect(isAbsoluteProjectDirectoryPath('\\\\server\\share\\red-docket', 'win32')).toBe(true)
  })

  it('validate: rejects a Windows root-relative path without a drive', () => {
    expect(isAbsoluteProjectDirectoryPath('/red-docket', 'win32')).toBe(false)
  })

  it('validate: accepts an absolute POSIX path', () => {
    expect(isAbsoluteProjectDirectoryPath('/red-docket', 'linux')).toBe(true)
  })

  it('validate: rejects a relative POSIX path', () => {
    expect(isAbsoluteProjectDirectoryPath('red-docket', 'darwin')).toBe(false)
  })

  it('validate: accepts an absolute path for any supported platform without a platform', () => {
    expect(isAbsoluteProjectDirectoryPath('/red-docket')).toBe(true)
    expect(isAbsoluteProjectDirectoryPath('C:\\red-docket')).toBe(true)
  })

  it('validate: rejects a null byte without a platform', () => {
    expect(isAbsoluteProjectDirectoryPath('/red-docket\0invalid')).toBe(false)
  })
})
