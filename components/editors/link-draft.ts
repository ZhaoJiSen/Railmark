import type { Delivery, DirectoryPreview, ProjectLink } from '../../lib/mygo'
import type { Group } from '../../lib/types'

export interface LinkDraft extends ProjectLink {
  draftId: string
  currentBranch: string
}

export function fromDelivery(delivery: Delivery): LinkDraft {
  return {
    directoryId: delivery.directoryId,
    projectId: delivery.projectId,
    projectName: delivery.projectName,
    path: delivery.path,
    group: delivery.group,
    state: delivery.state,
    branch: delivery.branch,
    baseBranch: delivery.baseBranch,
    pushTarget: delivery.pushTarget,
    draftId: `${delivery.group}:${delivery.directoryId}`,
    currentBranch: '',
  }
}

export function fromPreview(preview: DirectoryPreview, group: Group): LinkDraft {
  return {
    directoryId: preview.directoryId,
    projectId: preview.projectId,
    projectName: preview.name,
    path: preview.path,
    group,
    state: 'todo',
    branch: '',
    baseBranch: '',
    pushTarget: '',
    draftId: `${group}:${preview.path}`,
    currentBranch: preview.branch,
  }
}
