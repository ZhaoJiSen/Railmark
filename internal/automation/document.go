package automation

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"
)

const maxDocument = 512 << 10

var dingHost = regexp.MustCompile(`^(?:[a-z0-9]+(?:-[a-z0-9]+)*-)?alidocs\.dingtalk\.com$`)
var dingNode = regexp.MustCompile(`^/i/nodes/[a-zA-Z0-9]+/?$`)

// Document is reviewed locally before its text is sent to the chosen model.
type Document struct {
	Title     string `json:"title"`
	Markdown  string `json:"markdown"`
	SourceURL string `json:"sourceUrl"`
}

func dingTalkURL(value string) (*url.URL, error) {
	u, err := url.Parse(strings.TrimSpace(value))
	if err != nil || u.Scheme != "https" || u.User != nil || u.Port() != "" || !dingHost.MatchString(strings.ToLower(u.Hostname())) {
		return nil, errors.New("请输入 https://alidocs.dingtalk.com 的钉钉文档链接")
	}
	if !dingNode.MatchString(u.Path) && !((u.Path == "/document/edit" || u.Path == "/document/preview") && u.Query().Get("dentryKey") != "") {
		return nil, errors.New("请复制钉钉在线文档的完整链接")
	}
	u.Fragment = ""
	return u, nil
}

func ReadDocument(ctx context.Context, source string) (Document, error) {
	u, err := dingTalkURL(source)
	if err != nil {
		return Document{}, err
	}
	home, _ := os.UserHomeDir()
	path := findCLI("dws", home)
	if path == "" {
		return Document{}, errors.New("未找到钉钉 DWS。安装并登录后重试，或直接粘贴文档正文")
	}
	ctx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()
	env := withEnv(cliEnv(home), "DWS_NO_UPDATE_CHECK", "1")
	out, err := command(ctx, path, home, env, nil, "doc", "+fetch", "--node", u.String(), "--format", "json")
	if ctx.Err() != nil {
		return Document{}, operationError(ctx, "读取钉钉文档")
	}
	if err != nil {
		return Document{}, errors.New("钉钉读取失败。请检查 dws auth status、当前组织和文档查看权限，或粘贴正文")
	}
	return decodeDocument(out, u.String())
}

func decodeDocument(out []byte, source string) (Document, error) {
	var response struct {
		OK   bool `json:"ok"`
		Data struct {
			Complete bool `json:"complete"`
			Content  struct {
				Success  *bool  `json:"success"`
				Title    string `json:"title"`
				Markdown string `json:"markdown"`
			} `json:"content"`
		} `json:"data"`
	}
	if err := json.Unmarshal(out, &response); err != nil || !response.OK || !response.Data.Complete {
		return Document{}, errors.New("DWS 没有返回完整文档，请更新 DWS 或粘贴正文")
	}
	content := response.Data.Content
	if content.Success != nil && !*content.Success || strings.TrimSpace(content.Markdown) == "" {
		return Document{}, errors.New("钉钉文档没有可读取的 Markdown 正文")
	}
	if len(content.Markdown) > maxDocument {
		return Document{}, errors.New("文档正文超过 512 KB，请粘贴本次需求相关的部分")
	}
	return Document{Title: content.Title, Markdown: content.Markdown, SourceURL: source}, nil
}

func operationError(ctx context.Context, action string) error {
	if errors.Is(ctx.Err(), context.Canceled) {
		return errors.New("已取消" + action)
	}
	return errors.New(action + "超时，请重试")
}
