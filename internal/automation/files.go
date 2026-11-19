package automation

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"strings"
	"unicode/utf8"
)

const maxSource = 256 << 10

func excludedPath(name string) bool {
	for _, part := range strings.Split(strings.ToLower(name), "/") {
		switch part {
		case ".git", ".claude", ".codex", "node_modules", "vendor", "id_rsa", "id_ed25519":
			return true
		}
		if strings.HasPrefix(part, ".env") && !strings.HasSuffix(part, ".example") ||
			strings.HasSuffix(part, ".pem") || strings.HasSuffix(part, ".key") {
			return true
		}
	}
	return false
}

func workspacePath(root *os.Root, name string, allowNew bool) error {
	if !fs.ValidPath(name) || name == "." || excludedPath(name) {
		return errors.New("请选择工作副本内的有效相对路径")
	}
	var current string
	for _, part := range strings.Split(name, "/") {
		current = path.Join(current, part)
		info, err := root.Lstat(current)
		if allowNew && errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		if err != nil || info.Mode()&fs.ModeSymlink != 0 {
			return errors.New("路径不存在或包含符号链接")
		}
		if current == name && !info.Mode().IsRegular() {
			return errors.New("请选择普通文本文件")
		}
	}
	return nil
}

func readSource(root *os.Root, name string) (string, error) {
	if err := workspacePath(root, name, false); err != nil {
		return "", err
	}
	file, err := root.Open(name)
	if err != nil {
		return "", err
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, maxSource+1))
	if err != nil || len(data) > maxSource || !utf8.Valid(data) || strings.IndexByte(string(data), 0) >= 0 {
		return "", errors.New("仅支持 256 KB 以内的 UTF-8 文本文件")
	}
	return string(data), nil
}

func inspectFiles(root *os.Root, prefix, query string) (string, error) {
	if prefix == "" {
		prefix = "."
	}
	if !fs.ValidPath(prefix) || excludedPath(prefix) || len(query) > 256 {
		return "", errors.New("请输入有效目录和搜索文本")
	}
	// OpenRoot blocks paths leaving the checkout, including via a symbolic link.
	for current := prefix; current != "."; current = path.Dir(current) {
		if info, err := root.Lstat(current); err != nil || !info.IsDir() {
			return "", errors.New("目录不存在或包含符号链接")
		}
	}
	var result strings.Builder
	files, matches := 0, 0
	err := fs.WalkDir(root.FS(), prefix, func(name string, entry fs.DirEntry, err error) error {
		if err != nil || files >= 4000 || matches >= 180 || result.Len() >= 48<<10 {
			return fs.SkipAll
		}
		if excludedPath(name) && entry.IsDir() {
			return fs.SkipDir
		}
		if !entry.Type().IsRegular() || excludedPath(name) {
			return nil
		}
		files++
		if query == "" {
			fmt.Fprintln(&result, name)
			matches++
			return nil
		}
		body, err := readSource(root, name)
		if err != nil || !strings.Contains(body, query) {
			return nil
		}
		for i, line := range strings.Split(body, "\n") {
			if strings.Contains(line, query) {
				runes := []rune(line)
				fmt.Fprintf(&result, "%s:%d: %s\n", name, i+1, string(runes[:min(len(runes), 240)]))
				matches++
				if matches >= 180 || result.Len() >= 48<<10 {
					return fs.SkipAll
				}
			}
		}
		return nil
	})
	if files >= 4000 || matches >= 180 || result.Len() >= 48<<10 {
		result.WriteString("\n结果已截断，请缩小目录或搜索范围。")
	}
	return result.String(), err
}

func editSource(root *os.Root, name, before, after string) error {
	if len(after) > maxSource || strings.ContainsRune(after, 0) {
		return errors.New("编辑内容超过限制")
	}
	if err := workspacePath(root, name, before == ""); err != nil {
		return err
	}
	if before == "" {
		if err := root.MkdirAll(path.Dir(name), 0755); err != nil {
			return err
		}
		file, err := root.OpenFile(name, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0644)
		if err != nil {
			return errors.New("新文件无法创建，路径可能已存在")
		}
		_, writeErr := io.WriteString(file, after)
		return errors.Join(writeErr, file.Close())
	}
	current, err := readSource(root, name)
	if err != nil {
		return err
	}
	if strings.Count(current, before) != 1 {
		return errors.New("原文必须精确匹配一次，请先读取文件")
	}
	updated := strings.Replace(current, before, after, 1)
	if len(updated) > maxSource {
		return errors.New("修改后的文件超过 256 KB")
	}
	return root.WriteFile(name, []byte(updated), 0644)
}
