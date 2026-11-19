'use client';

import { Activity, useEffect, useMemo, useState } from 'react';
import type { Project } from '../../lib/mygo';
import { Desk } from '../../lib/mygo';
import { readableError } from '../../lib/utils';
import { resolveGitRequest } from '../../lib/workspace-data';
import { useWorkspace } from '../../lib/workspace-store';
import { AISettingsPage } from '../automation/ai-settings-page';
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
import { useAISettingsRoute } from './use-ai-settings-route';
import { useWorkspaceNavigation } from './use-workspace-navigation';
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
    git: gitRequest,
    setGit,
    reload,
  } = useWorkspace();
  const [versionEditor, editVersion] = useState<number>();
  const [creatingRequirement, setCreatingRequirement] = useState(false);
  const [projectEditor, editProject] = useState<ProjectEditorInput>();
  const [searching, setSearching] = useState(false);
  const [picking, setPicking] = useState(false);
  const [actionError, setActionError] = useState('');
  const aiSettings = useAISettingsRoute();
  const git = useMemo(() => resolveGitRequest(data, gitRequest), [data, gitRequest]);
  const version = data?.versions.find((item) => item.id === versionId);
  const requirement = data?.requirements.find((item) => item.id === requirementId);
  const project = data?.projects.find((item) => item.id === projectId);
  const projectView = view === 'projects' || view === 'project';
  const modalOpen = versionEditor !== undefined || creatingRequirement || !!projectEditor;
  const { viewport, detailNavigation, showDashboard, showVersion, showRequirement,
    showProjects, showProject, back, backLabel } =
    useWorkspaceNavigation({ view, versionId, requirementId, projectId, data });

  useEffect(() => {
    void reload().catch(() => {});
  }, [reload]);

  useEffect(() => {
    if (!data || modalOpen || aiSettings.open) return;
    function search(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (document.querySelector('[role=alertdialog], [data-slot=dialog-content][data-state=open]')) return;
        event.preventDefault();
        setSearching(true);
      }
    }
    window.addEventListener('keydown', search);
    return () => window.removeEventListener('keydown', search);
  }, [data, modalOpen, aiSettings.open]);

  function showWorkspace(action: () => void): void {
    aiSettings.close(false);
    action();
  }

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

  const breadcrumb = view === 'projects' ? undefined : projectView ? '本地项目' : '版本工作台';
  const context = projectView
    ? view === 'project'
      ? project?.name
      : undefined
    : view === 'dashboard' ? undefined : version?.name;

  return (
    <SidebarProvider className={styles.layout}>
      <WorkspaceToolbar
        area={aiSettings.open ? 'AI 设置' : breadcrumb}
        context={aiSettings.open ? undefined : context}
        details={!aiSettings.open && view === 'requirement'}
        onHome={projectView ? showProjects : showDashboard}
        onContext={view === 'requirement' ? () => showVersion(versionId) : undefined}
        loaded={!!data}
        onActionError={setActionError}
        aiSettingsOpen={aiSettings.open}
        onAISettings={aiSettings.show}
      />
      <div className={styles.workspace}>
        <Sidebar
          versions={data?.versions ?? []}
          versionId={versionId}
          view={aiSettings.open ? undefined : view}
          onDashboard={() => showWorkspace(showDashboard)}
          onVersion={id => showWorkspace(() => showVersion(id))}
          onNewVersion={() => showWorkspace(() => editVersion(0))}
          onEditVersion={id => showWorkspace(() => editVersion(id))}
          onProjects={() => showWorkspace(showProjects)}
        />
        <SidebarInset className='min-h-0 min-w-0 bg-transparent'>
          {aiSettings.open && (
            <ScrollArea className={`${styles.island} flex-1`} viewportProps={{ className: '[&>div]:block!' }}>
              <div className={styles.content}>
                <div className='space-y-3'>
                  {actionError && <ErrorLine message={actionError} />}
                  <AISettingsPage onBack={() => aiSettings.close()} />
                </div>
              </div>
            </ScrollArea>
          )}
          <WorkspacePanels hidden={aiSettings.open} request={git} onClose={() => setGit(undefined)}
            onProject={(id, source) => showProject(id, undefined, source)} onConflict={showRequirement}>
            <ScrollArea viewportProps={{ ref: viewport, className: 'h-auto [scrollbar-gutter:stable]' }}
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
                    <Spinner aria-hidden='true' />
                    正在读取工作区…
                  </p>
                )}
                {data && (
                  <div className='text-sm'>
                    {view === 'dashboard' && (
                      <Dashboard
                        data={data}
                        onCreate={() => editVersion(0)}
                        onVersion={showVersion}
                        onProjects={showProjects}
                        onProject={showProject}
                      />
                    )}
                    {(view === 'version' || view === 'requirement') && version && (
                      <Activity key={`version:${version.id}`} mode={view === 'version' ? 'visible' : 'hidden'}>
                        <VersionView
                          version={version}
                          requirements={data.requirements.filter(item => item.versionId === version.id)}
                          projects={data.projects}
                          newRequirementId={newRequirementId}
                          onEdit={() => editVersion(version.id)}
                          onCreate={() => setCreatingRequirement(true)}
                          onOpen={showRequirement}
                          onProject={showProject}
                          onGit={setGit}
                        />
                      </Activity>
                    )}

                    {view === 'requirement' && requirement && version && (
                      <RequirementDetail
                        ref={detailNavigation}
                        key={`requirement:${requirement.id}`}
                        requirement={requirement}
                        projects={data.projects}
                        requirements={data.requirements}
                        versions={data.versions}
                        onBack={back}
                        backLabel={backLabel}
                        onChanged={() => reloadThen()}
                        onProject={showProject}
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
                        onBack={back}
                        backLabel={backLabel}
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
            reloadThen(() => showVersion(id));
          }}
        />
      )}
      {data && creatingRequirement && (
        <RequirementEditor
          versionId={versionId}
          versions={data.versions}
          projects={data.projects}
          requirements={data.requirements}
          onClose={() => setCreatingRequirement(false)}
          onSaved={(id, targetVersion) => {
            setCreatingRequirement(false);
            reloadThen(() => showVersion(targetVersion, id));
          }}
        />
      )}
      {projectEditor && (
        <ProjectEditor
          input={projectEditor}
          onClose={() => editProject(undefined)}
          onSaved={(id) => {
            editProject(undefined);
            reloadThen(() => showProject(id));
          }}
        />
      )}
      {data && searching && (
        <SearchDialog
          data={data}
          onClose={() => setSearching(false)}
          onRequirement={showRequirement}
          onProject={showProject}
        />
      )}
    </SidebarProvider>
  );
}
