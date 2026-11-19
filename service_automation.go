package main

import (
	"context"
	"errors"
	"path/filepath"
	"sync"

	"github.com/egoist/mygo"

	"railmark/internal/automation"
)

type Automation struct {
	desk *Desk
	busy sync.Mutex
}

func (d *Automation) Capabilities() automation.Capabilities {
	return automation.Detect()
}

func (d *Automation) DefaultProvider(ctx context.Context) (string, error) {
	return d.desk.store.AutomationProvider(ctx)
}

func (d *Automation) SetDefaultProvider(ctx context.Context, provider string) error {
	return d.desk.store.SetAutomationProvider(ctx, provider)
}

func (d *Automation) ReadRequirementDocument(ctx context.Context, source string, progress *mygo.Channel[string]) (automation.Document, error) {
	if err := progress.Send("正在读取钉钉文档…"); err != nil {
		return automation.Document{}, err
	}
	return automation.ReadDocument(ctx, source)
}

func (d *Automation) GenerateRequirementDraft(ctx context.Context, provider string, document automation.Document, progress *mygo.Channel[string]) (automation.Draft, error) {
	if !d.busy.TryLock() {
		return automation.Draft{}, errors.New("已有 CLI 任务正在运行")
	}
	defer d.busy.Unlock()
	if err := progress.Send("正在整理需求草稿…"); err != nil {
		return automation.Draft{}, err
	}
	return automation.GenerateDraft(ctx, provider, document)
}

func (d *Automation) RunRequirementAutomation(ctx context.Context, requirementID, directoryID int64, group, branch, provider string,
	progress *mygo.Channel[string]) (automation.RunResult, error) {
	if !d.busy.TryLock() {
		return automation.RunResult{}, errors.New("已有 CLI 任务正在运行")
	}
	defer d.busy.Unlock()
	requirement, delivery, err := d.desk.store.AutomationTarget(ctx, requirementID, directoryID, group, branch)
	if err != nil {
		return automation.RunResult{}, err
	}
	dir, err := mygo.App.Path(mygo.PathUserData)
	if err != nil {
		return automation.RunResult{}, errors.New("无法读取 Railmark 数据目录")
	}
	task := automation.Task{Title: requirement.Title, Background: requirement.Background, Scope: requirement.Scope,
		Acceptance: requirement.Acceptance, Project: delivery.ProjectName, Directory: delivery.Path, Branch: delivery.Branch, Group: delivery.Group}
	return automation.RunCode(ctx, provider, filepath.Join(dir, "automation"), task, func(value string) { _ = progress.Send(value) })
}

func (d *Automation) OpenAutomationDirectory(name string) error {
	dir, err := mygo.App.Path(mygo.PathUserData)
	if err != nil {
		return err
	}
	base := filepath.Join(dir, "automation")
	path := filepath.Clean(name)
	if filepath.Dir(path) != base || path != name {
		return errors.New("任务目录不可用")
	}
	resolved, err := filepath.EvalSymlinks(path)
	if err != nil || resolved != path {
		return errors.New("任务目录不可用")
	}
	return mygo.Shell.OpenPath(path)
}
