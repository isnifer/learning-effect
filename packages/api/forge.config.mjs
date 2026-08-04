import { cp } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const betterSqlite3Directory = dirname(require.resolve('better-sqlite3/package.json'))

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
const config = {
  packagerConfig: {
    name: 'Learning Effect',
    asar: true,
    extraResource: ['migrations'],
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
  ],
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      await cp(betterSqlite3Directory, join(buildPath, 'node_modules/better-sqlite3'), {
        recursive: true,
      })
    },
  },
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/electron/main.ts',
            config: 'vite.main.config.ts',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.config.ts',
          },
        ],
      },
    },
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
}

export default config
