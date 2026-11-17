import type { Project } from './mygo'

function parentDirectory(path: string): string | undefined {
  const directory = path.replace(/\/+$/, '')
  const separator = directory.lastIndexOf('/')
  if (separator >= 0) return directory.slice(0, separator) || '/'
}

export function groupProjectsByParent(projects: readonly Project[]): Map<string, Project[]> {
  const folders = new Map<string, Project[]>()
  for (const project of projects) {
    const parent = parentDirectory(project.directories[0]?.path ?? '')
    if (!parent || !project.directories.every(directory => parentDirectory(directory.path) === parent)) continue
    const siblings = folders.get(parent)
    if (siblings) siblings.push(project)
    else folders.set(parent, [project])
  }
  return new Map([...folders].filter(([, siblings]) => siblings.length > 1))
}
