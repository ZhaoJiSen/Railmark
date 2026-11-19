package automation

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

type Provider struct {
	ID            string `json:"id"`
	Available     bool   `json:"available"`
	Model         string `json:"model"`
	CustomGateway bool   `json:"customGateway"`
}

type Capabilities struct {
	DingTalk  bool       `json:"dingTalk"`
	Providers []Provider `json:"providers"`
}

type claudeSettings struct {
	Model string            `json:"model,omitempty"`
	Env   map[string]string `json:"env,omitempty"`
}

var modelName = regexp.MustCompile(`^[a-zA-Z0-9][a-zA-Z0-9_.:/@+\[\]-]{0,127}$`)

func Detect() Capabilities {
	home, _ := os.UserHomeDir()
	settings := loadClaudeSettings(home)
	model := settings.Model
	if !modelName.MatchString(model) {
		model = ""
	}
	return Capabilities{
		DingTalk: findCLI("dws", home) != "",
		Providers: []Provider{
			{ID: "codex", Available: findCLI("codex", home) != ""},
			{ID: "claude", Available: findCLI("claude", home) != "", Model: model,
				CustomGateway: settings.Env["ANTHROPIC_BASE_URL"] != ""},
		},
	}
}

func loadClaudeSettings(home string) claudeSettings {
	configDir := os.Getenv("CLAUDE_CONFIG_DIR")
	if configDir == "" {
		configDir = filepath.Join(home, ".claude")
	}
	var user claudeSettings
	if file, err := os.Open(filepath.Join(configDir, "settings.json")); err == nil {
		defer file.Close()
		data, err := io.ReadAll(io.LimitReader(file, 1<<20))
		if err == nil {
			_ = json.Unmarshal(data, &user)
		}
	}
	// The restricted runner loads only model and transport settings from the user config.
	settings := claudeSettings{Model: user.Model, Env: make(map[string]string)}
	for _, key := range []string{"ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL",
		"ANTHROPIC_DEFAULT_OPUS_MODEL", "ANTHROPIC_DEFAULT_SONNET_MODEL", "ANTHROPIC_DEFAULT_HAIKU_MODEL",
		"CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX", "CLAUDE_CODE_USE_FOUNDRY"} {
		if value := os.Getenv(key); value != "" {
			settings.Env[key] = value
		} else if value := user.Env[key]; value != "" {
			settings.Env[key] = value
		}
	}
	if model := settings.Env["ANTHROPIC_MODEL"]; model != "" {
		settings.Model = model
	}
	return settings
}

func runAgent(ctx context.Context, provider, dir, stateDir, prompt, schema string, edit bool) ([]byte, error) {
	if provider != "codex" && provider != "claude" {
		return nil, errors.New("请选择 Codex 或 Claude Code")
	}
	home, _ := os.UserHomeDir()
	path := findCLI(provider, home)
	if path == "" {
		return nil, errors.New("未找到所选 CLI，请安装后重试")
	}
	env := cliEnv(home)
	var result []byte
	var err error
	if provider == "codex" {
		result, err = runCodex(ctx, path, dir, stateDir, env, prompt, schema, edit)
	} else {
		result, err = runClaude(ctx, path, dir, env, home, prompt, schema, edit)
	}
	if ctx.Err() != nil {
		return nil, operationError(ctx, "CLI 任务")
	}
	if err != nil {
		return nil, err
	}
	return result, nil
}

func runCodex(ctx context.Context, path, dir, stateDir string, env []string, prompt, schema string, edit bool) ([]byte, error) {
	resultFile := filepath.Join(stateDir, "result.json")
	args := []string{"-a", "never", "--disable", "shell_tool", "--disable", "hooks", "--disable", "apps",
		"--disable", "in_app_browser", "--disable", "shell_snapshot", "-c", `web_search="disabled"`}
	if edit {
		binary, err := os.Executable()
		if err != nil {
			return nil, errors.New("无法启动 Codex 文件工具")
		}
		args = append(args, "-c", "mcp_servers.railmark_files={command="+strconv.Quote(binary)+
			",args=[\"--railmark-automation-files\","+strconv.Quote(dir)+`],required=true,default_tools_approval_mode="approve"}`)
	}
	args = append(args, "exec", "--ignore-user-config", "--ignore-rules", "--ephemeral", "--skip-git-repo-check",
		"--sandbox", "read-only", "--output-last-message", resultFile)
	if schema != "" {
		schemaFile := filepath.Join(stateDir, "schema.json")
		if err := os.WriteFile(schemaFile, []byte(schema), 0600); err != nil {
			return nil, errors.New("无法准备 Codex 输出格式")
		}
		args = append(args, "--output-schema", schemaFile)
	}
	_, err := command(ctx, path, stateDir, env, strings.NewReader(prompt), append(args, "-")...)
	if err != nil {
		return nil, errors.New("Codex 执行失败，请检查 CLI 登录状态和版本")
	}
	return readModelFile(resultFile)
}

func runClaude(ctx context.Context, path, dir string, env []string, home, prompt, schema string, edit bool) ([]byte, error) {
	settings := loadClaudeSettings(home)
	for key, value := range settings.Env {
		env = withEnv(env, key, value)
	}
	inline, err := json.Marshal(claudeSettings{Model: settings.Model})
	if err != nil {
		return nil, errors.New("无法准备 Claude Code 模型配置")
	}
	tools := ""
	if edit {
		tools = "Read,Grep,Glob,Edit,Write"
	}
	args := []string{"--print", "--safe-mode", "--restricted", "--strict-mcp-config", "--no-session-persistence",
		"--permission-prompts", "none", "--permission-mode", "acceptEdits", "--settings", string(inline),
		"--tools", tools, "--max-turns", "32", "--output-format", "json"}
	if schema != "" {
		args = append(args, "--json-schema", schema)
	}
	out, err := command(ctx, path, dir, env, strings.NewReader(prompt), args...)
	if err != nil {
		return nil, errors.New("Claude Code 执行失败，请检查 CLI 登录、模型配置和版本")
	}
	var result struct {
		Type       string          `json:"type"`
		Subtype    string          `json:"subtype"`
		IsError    bool            `json:"is_error"`
		Structured json.RawMessage `json:"structured_output"`
		Result     string          `json:"result"`
	}
	if json.Unmarshal(out, &result) != nil || result.Type != "result" || result.Subtype != "success" || result.IsError {
		return nil, errors.New("Claude Code 没有成功返回结果，请检查登录和模型配置")
	}
	if schema != "" {
		return result.Structured, nil
	}
	return []byte(result.Result), nil
}

func readModelFile(path string) ([]byte, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, errors.New("Codex 没有返回结果")
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, maxOutput+1))
	if err != nil || len(data) > maxOutput {
		return nil, errors.New("无法读取 Codex 结果或结果过大")
	}
	return data, nil
}
