// POSIX absolute paths start with a forward slash.
// Source: https://github.com/nodejs/node/blob/v26.5.0/lib/path.js#L1322-L1325
export const posixAbsoluteProjectDirectoryPathPattern = /^\//

// A fully qualified Windows drive path starts with a drive letter, a colon, and a separator.
// Source: https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#traditional-dos-paths
export const windowsDriveAbsoluteProjectDirectoryPathPattern = /^[A-Za-z]:[\\/]/

// A fully qualified UNC path starts with two separators followed by a server and a share.
// Source: https://learn.microsoft.com/en-us/dotnet/standard/io/file-path-formats#unc-paths
export const windowsUncAbsoluteProjectDirectoryPathPattern =
  /^(?:\\\\|\/\/)[^\\/]+[\\/][^\\/]+(?:[\\/]|$)/
