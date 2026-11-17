package railmark

import (
	"errors"
	"net/url"
	"strings"
)

var stateLabels = map[string]string{
	"todo":        "待开始",
	"in_progress": "开发中",
	"testing":     "待联调",
	"done":        "已完成",
}

var requirementCategoryLabels = map[string]string{
	"":          "未分类",
	"business":  "业务需求",
	"technical": "技术项目",
}

var groupLabels = map[string]string{
	"frontend": "前端",
	"backend":  "后端",
}

func URLAllowed(value string) bool {
	u, err := url.Parse(value)
	return err == nil && u.Hostname() != "" && (u.Scheme == "https" || u.Scheme == "http") && u.User == nil
}

func localBranchName(value string) string {
	return strings.TrimPrefix(strings.TrimSpace(value), "refs/heads/")
}

func normalizeRequirement(input *SaveRequirementInput) error {
	input.Title = strings.TrimSpace(input.Title)
	input.Direction = strings.TrimSpace(input.Direction)
	input.Background = strings.TrimSpace(input.Background)
	input.Scope = strings.TrimSpace(input.Scope)
	input.Acceptance = strings.TrimSpace(input.Acceptance)
	input.SourceURL = strings.TrimSpace(input.SourceURL)

	if input.Title == "" {
		return errors.New("请填写需求标题")
	}
	if _, ok := requirementCategoryLabels[input.Category]; !ok {
		return errors.New("请选择有效的需求类型")
	}
	if stateLabels[input.State] == "" {
		return errors.New("请选择有效的需求状态")
	}
	if input.SourceURL != "" && !URLAllowed(input.SourceURL) {
		return errors.New("原始链接需要是有效的 HTTP 或 HTTPS 地址")
	}
	if len(input.Projects) == 0 {
		return errors.New("请至少导入或关联一个本地项目目录")
	}
	for i := range input.Projects {
		link := &input.Projects[i]
		if groupLabels[link.Group] == "" || stateLabels[link.State] == "" {
			return errors.New("请选择有效的项目分组和进度")
		}
		link.Branch = localBranchName(link.Branch)
		link.BaseBranch = strings.TrimSpace(link.BaseBranch)
		link.PushTarget = strings.TrimSpace(link.PushTarget)
	}
	return nil
}
