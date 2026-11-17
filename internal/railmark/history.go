package railmark

import (
	"fmt"
	"slices"
	"strings"
)

func summarizeChanges(old Requirement, input SaveRequirementInput, deliveries []Delivery, oldVersion, newVersion string) string {
	changes := []string{}
	if old.Title != input.Title {
		changes = append(changes, transition("标题", old.Title, input.Title))
	}
	if old.Category != input.Category {
		changes = append(changes, transition("需求类型", requirementCategoryLabels[old.Category], requirementCategoryLabels[input.Category]))
	}
	if old.Direction != input.Direction {
		changes = append(changes, transition("方向", old.Direction, input.Direction))
	}
	if old.VersionID != input.VersionID {
		changes = append(changes, transition("版本", oldVersion, newVersion))
	}
	if old.State != input.State {
		changes = append(changes, transition("状态", stateLabels[old.State], stateLabels[input.State]))
	}
	for _, field := range []struct{ label, before, after string }{
		{"需求背景", old.Background, input.Background},
		{"交付范围", old.Scope, input.Scope},
		{"验收条件", old.Acceptance, input.Acceptance},
		{"原始链接", old.SourceURL, input.SourceURL},
	} {
		if field.before != field.after {
			changes = append(changes, "更新"+field.label)
		}
	}

	previous := make(map[deliveryKey]Delivery)
	for _, d := range old.Projects {
		previous[deliveryKey{d.DirectoryID, d.Group}] = d
	}
	current := make(map[deliveryKey]bool)
	for _, d := range deliveries {
		key := deliveryKey{d.DirectoryID, d.Group}
		current[key] = true
		before, ok := previous[key]
		title := d.ProjectName + "（" + groupLabels[d.Group] + "）"
		if !ok {
			changes = append(changes, "关联项目 "+title+" · "+d.Path)
			if d.Branch != "" {
				changes = append(changes, transition(title+" 开发分支", "", d.Branch))
			}
			continue
		}
		for _, field := range []struct{ label, before, after string }{
			{"进度", stateLabels[before.State], stateLabels[d.State]},
			{"开发分支", localBranchName(before.Branch), d.Branch},
			{"目标合入分支", before.BaseBranch, d.BaseBranch},
			{"预期推送目标", before.PushTarget, d.PushTarget},
		} {
			if field.before != field.after {
				changes = append(changes, transition(title+" "+field.label, field.before, field.after))
			}
		}
	}
	for _, d := range old.Projects {
		if !current[deliveryKey{d.DirectoryID, d.Group}] {
			changes = append(changes, "移除项目 "+d.ProjectName+"（"+groupLabels[d.Group]+"） · "+d.Path)
		}
	}
	return strings.Join(changes, "\n")
}

func transition(label, before, after string) string {
	if before == "" {
		before = "未设置"
	}
	if after == "" {
		after = "未设置"
	}
	return fmt.Sprintf("%s：%s → %s", label, before, after)
}

type branchKey struct {
	projectID int64
	branch    string
}

func addBranchConflicts(data *Workspace) {
	activeVersions := make(map[int64]string)
	for _, v := range data.Versions {
		if v.State == "open" {
			activeVersions[v.ID] = v.Name
		}
	}
	bindings := make(map[branchKey]map[int64]string)
	for _, r := range data.Requirements {
		if activeVersions[r.VersionID] == "" {
			continue
		}
		for _, d := range r.Projects {
			branch := localBranchName(d.Branch)
			if branch == "" {
				continue
			}
			key := branchKey{d.ProjectID, branch}
			if bindings[key] == nil {
				bindings[key] = make(map[int64]string)
			}
			bindings[key][r.VersionID] = activeVersions[r.VersionID]
		}
	}
	for i := range data.Requirements {
		r := &data.Requirements[i]
		if activeVersions[r.VersionID] == "" {
			continue
		}
		for j := range r.Projects {
			d := &r.Projects[j]
			for id, name := range bindings[branchKey{d.ProjectID, localBranchName(d.Branch)}] {
				if id != r.VersionID {
					d.Conflicts = append(d.Conflicts, name)
				}
			}
			slices.Sort(d.Conflicts)
		}
	}
}
