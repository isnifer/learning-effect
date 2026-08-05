export const SELECT_PROJECT_DIRECTORY_CHANNEL = 'dialog:select-project-directory'

export default interface DesktopApi {
  readonly selectProjectDirectory: () => Promise<string | undefined>
}
