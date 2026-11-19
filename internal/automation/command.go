package automation

import (
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

const maxOutput = 4 << 20

func findCLI(name string, home string) string {
	if path, err := exec.LookPath(name); err == nil {
		return path
	}
	paths := []string{
		filepath.Join(home, ".local/bin", name), filepath.Join(home, ".dws/bin", name),
		filepath.Join("/opt/homebrew/bin", name), filepath.Join("/usr/local/bin", name),
	}
	if name == "codex" {
		paths = append(paths, "/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex")
	}
	for _, path := range paths {
		if info, err := os.Stat(path); err == nil && info.Mode().IsRegular() && info.Mode().Perm()&0111 != 0 {
			return path
		}
	}
	return ""
}

// Finder launches have a short PATH. Retain the user's PATH and add common CLI locations.
func cliEnv(home string) []string {
	paths := []string{}
	for _, path := range filepath.SplitList(os.Getenv("PATH")) {
		if filepath.IsAbs(path) {
			paths = append(paths, path)
		}
	}
	paths = append(paths, filepath.Join(home, ".local/bin"), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin")
	return withEnv(os.Environ(), "PATH", strings.Join(paths, string(os.PathListSeparator)))
}

func withEnv(env []string, key, value string) []string {
	for i, entry := range env {
		if strings.HasPrefix(entry, key+"=") {
			env[i] = key + "=" + value
			return env
		}
	}
	return append(env, key+"="+value)
}

type boundedOutput struct {
	bytes.Buffer
	limit     int
	truncated bool
}

func (out *boundedOutput) Write(p []byte) (int, error) {
	if len(p) > out.limit-out.Len() {
		out.truncated = true
	}
	_, _ = out.Buffer.Write(p[:min(len(p), out.limit-out.Len())])
	return len(p), nil
}

func command(ctx context.Context, path, dir string, env []string, stdin io.Reader, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, path, args...)
	cmd.Dir, cmd.Env, cmd.Stdin = dir, env, stdin
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	cmd.Cancel = func() error {
		if err := syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL); err != nil && !errors.Is(err, syscall.ESRCH) {
			return err
		}
		return os.ErrProcessDone
	}
	cmd.WaitDelay = time.Second
	out := &boundedOutput{limit: maxOutput}
	cmd.Stdout = out
	// CLI stderr can contain configuration values, signed URLs or document snippets.
	cmd.Stderr = io.Discard
	if err := cmd.Run(); err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		return out.Bytes(), err
	}
	if out.truncated {
		return nil, errors.New("CLI 输出超过大小限制")
	}
	return out.Bytes(), nil
}
