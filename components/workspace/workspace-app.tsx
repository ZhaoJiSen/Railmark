'use client';

import { Activity, useEffect, useState } from 'react';
import type { Project, Requirement } from '../../lib/mygo';
import { Desk } from '../../lib/mygo';
import { readableError } from '../../lib/utils';
import { useWorkspace } from '../../lib/workspace-store';
import type { ProjectEditorInput } from '../editors/project-editor';
import { ProjectEditor } from '../editors/project-editor';
import { RequirementEditor } from '../editors/requirement-editor';
import { VersionEditor } from '../editors/version-editor';
import { Button } from '../ui/button';
import { ErrorLine } from '../ui/form-parts';
import { Spinner } from '../ui/spinner';
import { ScrollArea } from '../ui/scroll-area';
import { SidebarInset } from '../ui/sidebar';
import { SidebarProvider } from '../ui/sidebar-provider';
import { Dashboard } from './dashboard';
import { ProjectDetail } from './project-detail';
import { ProjectLibrary } from './project-library';
import { RequirementDetail } from './requirement-detail';
import { SearchDialog } from './search-dialog';
import { Sidebar } from './sidebar';
import { VersionView } from './version-view';
import { useListReturn } from './use-list-return';
import { WorkspacePanels } from './workspace-panels';
import { WorkspaceToolbar } from './workspace-toolbar';
import styles from './workspace.module.scss';

export function WorkspaceApp() {
  const {
    data,
    error,
    view,
    versionId,
    requirementId,
    projectId,
    newRequirementId,
    git,
    setGit,
    reload,
    openDashboard,
    openVersion,
    openRequirement,
    openProjects,
    openProject,
  } = useWorkspace();
  const [versionEditor, editVersion] = useState<number>();
  const [requirementEditor, editRequirement] = useState<number>();
  const [projectEditor, editProject] = useState<ProjectEditorInput>();
  const [requirementProject, setRequirementProject] = useState<number>()
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [actionError, setActionError] = useState('');
  const version = data?.versions.find((item) => item.id === versionId);
  const requirement = data?.requirements.find((item) => item.id === requirementId);
  const project = data?.projects.find((item) => item.id === projectId);
  const projectView = view === 'projects' || view === 'project';
  const modalOpen = versionEditor !== undefined || requirementEditor !== undefined || !!projectEditor;
  const location = view === 'version' ? `version:${versionId}`
    : view === 'requirement' ? `requirement:${requirementId}`
    : view === 'project' ? `project:${projectId}` : view;
  const { viewport, rememberList } = useListReturn(location);

  useEffect(() => {
    void reload().catch(() => {});
  }, [reload]);

  useEffect(() => {
    if (!data || modalOpen) return;
    function search(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearching(true);
      }
    }
    window.addEventListener('keydown', search);
    return () => window.removeEventListener('keydown', search);
  }, [data, modalOpen]);

  function showRequirement(item: Requirement): void {
    const fromProject = view === 'project';
    setRequirementProject(fromProject ? projectId : undefined);
    if (fromProject || view === 'version')
      rememberList(`requirement:${item.id}`, fromProject ? `project-requirement-${item.id}` : `requirement-link-${item.id}`);
    openRequirement(item.id, item.versionId);
  }

  function showProject(id: number): void {
    if (view === 'projects') rememberList(`project:${id}`, `project-link-${id}`);
    openProject(id);
  }

  const backToVersion = () => openVersion(versionId);

  function reloadThen(navigate?: () => void): void {
    void reload()
      .then(() => navigate?.())
      .catch(() => {});
  }

  async function pickProject(target?: Project): Promise<void> {
    if (picking) return;
    setPicking(true);
    setActionError('');
    try {
      const preview = await Desk.pickDirectory();
      if (preview.path)
        editProject({ kind: 'import', preview, project: target });
    } catch (error) {
      setActionError(readableError(error));
    } finally {
      setPicking(false);
    }
  }

  const breadcrumb = projectView ? '本地项目' : '版本工作台';
  const context = projectView
    ? view === 'project'
      ? project?.name
      : undefined
    : view === 'dashboard' ? undefined : version?.name;

  return (
    <SidebarProvider className={styles.layout}>
      <WorkspaceToolbar
        area={breadcrumb}
        context={context}
        details={view === 'requirement'}
        onHome={projectView ? openProjects : openDashboard}
        onContext={view === 'requirement' ? backToVersion : undefined}
        loaded={!!data}
        onActionError={setActionError}
      />
      <div className='relative flex min-h-0 flex-1 overflow-hidden'>
        <Sidebar
          versions={data?.versions ?? []}
          versionId={versionId}
          view={view}
          onDashboard={openDashboard}
          onVersion={openVersion}
          onNewVersion={() => editVersion(0)}
          onProjects={openProjects}
        />
        <SidebarInset className='min-h-0 min-w-0'>
          <WorkspacePanels request={git} onClose={() => setGit(undefined)} onProject={openProject}>
            <ScrollArea viewportProps={{ ref: viewport, className: 'h-auto' }}
              className='grid h-full min-h-0 grid-rows-[minmax(0,1fr)] overflow-hidden'>
              <div className={styles.content}>
                {error && (
                  <div className='mb-4 space-y-2'>
                    <ErrorLine message={error} />
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={() => reloadThen()}
                    >
                      重试读取
                    </Button>
                  </div>
                )}
                {actionError && (
                  <div className='mb-4'>
                    <ErrorLine message={actionError} />
                  </div>
                )}
                {!data && !error && (
                  <p
                    role='status'
                    className='flex items-center gap-2 text-muted-foreground'
                  >
                    <Spinner aria-hidden='true' className='size-3.5' />
                    正在读取工作区…
                  </p>
                )}
                {data && (
                  <div className='text-sm'>
                    {view === 'dashboard' && (
                      <Dashboard
                        data={data}
                        onCreate={() => editVersion(0)}
                        onVersion={openVersion}
                        onProjects={openProjects}
                        onProject={openProject}
                      />
                    )}
                    {(view === 'version' || view === 'requirement') && version && (
                      <Activity key={version.id} mode={view === 'version' ? 'visible' : 'hidden'}>
                        <VersionView
                          version={version}
                          requirements={data.requirements.filter(item => item.versionId === version.id)}
                          projects={data.projects}
                          newRequirementId={newRequirementId}
                          onEdit={() => editVersion(version.id)}
                          onCreate={() => editRequirement(0)}
                          onOpen={showRequirement}
                          onGit={setGit}
                        />
                      </Activity>
                    )}

                    {view === 'requirement' && requirement && version && (
                      <RequirementDetail
                        key={requirement.id}
                        requirement={requirement}
                        onBack={requirementProject ? () => openProject(requirementProject) : backToVersion}
                        backLabel={requirementProject ? '返回项目' : '返回版本'}
                        onEdit={() => editRequirement(requirement.id)}
                        onChanged={() => reloadThen()}
                        onGit={setGit}
                      />
                    )}

                    <Activity mode={view === 'projects' ? 'visible' : 'hidden'}>
                      <ProjectLibrary projects={data.projects} requirements={data.requirements} onOpen={showProject}
                        importing={picking} onImport={() => void pickProject()} />
                    </Activity>

                    {view === 'project' && project && (
                      <ProjectDetail
                        project={project}
                        requirements={data.requirements}
                        versions={data.versions}
                        onBack={openProjects}
                        activeDirectoryId={git?.directoryId}
                        onRename={() => editProject({ kind: 'rename', project })}
                        onAddDirectory={() => void pickProject(project)}
                        importing={picking}
                        onRequirement={showRequirement}
                        onGit={setGit}
                      />
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </WorkspacePanels>
        </SidebarInset>
      </div>

      {data && versionEditor !== undefined && (
        <VersionEditor
          version={data.versions.find((v) => v.id === versionEditor)}
          onClose={() => editVersion(undefined)}
          onSaved={(id) => {
            editVersion(undefined);
            reloadThen(() => openVersion(id));
          }}
        />
      )}
      {data && requirementEditor !== undefined && (
        <RequirementEditor
          versionId={versionId}
          versions={data.versions}
          projects={data.projects}
          requirements={data.requirements}
          requirement={data.requirements.find(
            (r) => r.id === requirementEditor,
          )}
          directions={[
            ...new Set(
              data.requirements.map((req) => req.direction).filter(Boolean),
            ),
          ].sort()}
          onClose={() => editRequirement(undefined)}
          onSaved={(id, targetVersion) => {
            editRequirement(undefined);
            reloadThen(() =>
              requirementEditor === 0
                ? openVersion(targetVersion, id)
                : openRequirement(id, targetVersion),
            );
          }}
        />
      )}
      {projectEditor && (
        <ProjectEditor
          input={projectEditor}
          onClose={() => editProject(undefined)}
          onSaved={(id) => {
            editProject(undefined);
            reloadThen(() => openProject(id));
          }}
        />
      )}
      {data && searching && (
        <SearchDialog
          data={data}
          onClose={() => setSearching(false)}
          onRequirement={showRequirement}
          onProject={openProject}
        />
      )}
    </SidebarProvider>
  );
}
