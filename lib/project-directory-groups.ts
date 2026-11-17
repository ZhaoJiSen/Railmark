import type { Delivery, Project } from './mygo'

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

export function deliveryDirectoryLabels(deliveries: Delivery[]): Map<number, string> {
  const labels = new Map<number, string>()
  for (const siblings of Map.groupBy(deliveries, delivery => delivery.projectName).values()) {
    if (siblings.length < 2) continue
    for (const delivery of siblings) {
      const parts = delivery.path.split('/').filter(Boolean)
      for (let depth = 1; depth <= parts.length; depth++) {
        const suffix = parts.slice(-depth).join('/')
        if (depth === parts.length || siblings.every(item => item === delivery || !item.path.endsWith('/' + suffix))) {
          labels.set(delivery.directoryId, depth === parts.length ? delivery.path : '…/' + suffix)
          break
        }
      }
    }
  }
  return labels
}
