package railmark

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"time"
)

type GitChangedFile struct {
	Path    string `json:"path"`
	OldPath string `json:"oldPath"`
	Status  string `json:"status"`
}

type GitCommitFiles struct {
	Parent string           `json:"parent"`
	Files  []GitChangedFile `json:"files"`
}

type GitFilePatch struct {
	Patch string `json:"patch"`
	Issue string `json:"issue"`
}

const gitFileListLimit = 1 << 20
const gitPatchLimit = 256 << 10

var errGitOutputLimit = errors.New("Git 输出超过预览大小")

func ReadGitCommitFiles(ctx context.Context, d Directory, hash string) (GitCommitFiles, error) {
	if !validGitObjectID(hash) {
		return GitCommitFiles{}, errors.New("请选择有效的提交")
	}
	if issue := gitDirectoryIssue(ctx, d.Path); issue != "" {
		return GitCommitFiles{}, errors.New(issue)
	}
	out, err := boundedGitOutput(ctx, d.Path, gitFileListLimit,
		"show", "--no-patch", "--format=raw", "--no-color", "--no-notes", "--no-show-signature", hash, "--")
	header, _, _ := strings.Cut(out, "\n\n")
	firstLine, rest, _ := strings.Cut(header, "\n")
	if err != nil || !strings.EqualFold(firstLine, "commit "+hash) {
		return GitCommitFiles{}, errors.New("本地找不到该提交")
	}

	parent := ""
	for line := range strings.SplitSeq(rest, "\n") {
		if value, ok := strings.CutPrefix(line, "parent "); ok {
			parent = value
			break
		}
	}
	args := commitDiffArgs(hash, parent, "--name-status", "-z")
	output, err := boundedGitOutput(ctx, d.Path, gitFileListLimit, args...)
	if errors.Is(err, errGitOutputLimit) {
		return GitCommitFiles{}, errors.New("改动文件过多，请在本地 Git 工具中查看")
	}
	if err != nil {
		if parent != "" {
			if _, parentErr := git(ctx, d.Path, "cat-file", "-e", parent+"^{commit}"); parentErr != nil {
				return GitCommitFiles{}, errors.New("本地缺少父提交，无法查看此提交的差异")
			}
		}
		return GitCommitFiles{}, errors.New("无法读取该提交的改动文件")
	}
	files, err := parseChangedFiles(output)
	return GitCommitFiles{Parent: parent, Files: files}, err
}

func ReadGitFilePatch(ctx context.Context, d Directory, hash string, index int) (GitFilePatch, error) {
	detail, err := ReadGitCommitFiles(ctx, d, hash)
	if err != nil {
		return GitFilePatch{}, err
	}
	if index < 0 || index >= len(detail.Files) {
		return GitFilePatch{}, errors.New("该提交中找不到所选文件")
	}
	file := detail.Files[index]
	args := commitDiffArgs(hash, detail.Parent, "--patch", "--unified=3", "--src-prefix=a/", "--dst-prefix=b/")
	args = append(args, exactGitPathspec(file.Path))
	if file.OldPath != "" {
		args = append(args, exactGitPathspec(file.OldPath))
	}
	patch, err := boundedGitOutput(ctx, d.Path, gitPatchLimit, args...)
	if errors.Is(err, errGitOutputLimit) || strings.Count(patch, "\n") > 3000 {
		return GitFilePatch{Issue: "此文件改动过大，请在本地 Git 工具中查看"}, nil
	}
	if err != nil {
		return GitFilePatch{}, errors.New("无法读取文件差异")
	}
	return GitFilePatch{Patch: patch}, nil
}

func commitDiffArgs(hash, parent string, format ...string) []string {
	args := []string{"-c", "core.quotePath=false", "diff-tree", "--root", "-r", "--no-commit-id",
		"--no-relative", "--no-color", "--no-ext-diff", "--no-textconv", "--ignore-submodules=none",
		"--submodule=short", "-M", "-O/dev/null"}
	args = append(args, format...)
	if parent != "" {
		args = append(args, parent)
	}
	return append(args, hash, "--")
}

func parseChangedFiles(output string) ([]GitChangedFile, error) {
	files := []GitChangedFile{}
	fields := strings.Split(strings.TrimSuffix(output, "\x00"), "\x00")
	for i := 0; i < len(fields) && fields[i] != ""; i += 2 {
		if i+1 >= len(fields) || fields[i+1] == "" {
			return nil, errors.New("无法解析提交的文件列表")
		}
		file := GitChangedFile{Status: fields[i][:1], Path: fields[i+1]}
		if file.Status == "R" || file.Status == "C" {
			if i+2 >= len(fields) || fields[i+2] == "" {
				return nil, errors.New("无法解析重命名的文件路径")
			}
			file.OldPath, file.Path = file.Path, fields[i+2]
			i++
		}
		files = append(files, file)
	}
	return files, nil
}

var gitPathGlobEscapes = strings.NewReplacer("\\", "\\\\", "*", "\\*", "?", "\\?", "[", "\\[", "]", "\\]")

func exactGitPathspec(path string) string {
	// A single-byte character class makes Git match exactly, even when an old
	// file path has become a directory. Git's pathspec matcher operates on bytes.
	escape := ""
	if strings.ContainsRune("\\]-^!", rune(path[0])) {
		escape = "\\"
	}
	return ":(top,glob)[" + escape + path[:1] + "]" + gitPathGlobEscapes.Replace(path[1:])
}

type gitOutputBuffer struct {
	buffer   bytes.Buffer
	limit    int
	exceeded bool
}

func (output *gitOutputBuffer) Write(p []byte) (int, error) {
	if len(p) > output.limit-output.buffer.Len() {
		output.exceeded = true
		return 0, errGitOutputLimit
	}
	return output.buffer.Write(p)
}

func boundedGitOutput(ctx context.Context, path string, limit int, args ...string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 4*time.Second)
	defer cancel()
	output := &gitOutputBuffer{limit: limit}
	cmd := gitCommand(ctx, path, args...)
	cmd.Stdout = output
	err := cmd.Run()
	if output.exceeded {
		return "", errGitOutputLimit
	}
	return output.buffer.String(), err
}
