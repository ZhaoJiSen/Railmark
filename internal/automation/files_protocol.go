package automation

import (
	"bufio"
	"encoding/json"
	"errors"
	"io"
	"os"
	"strings"
)

type fileTool struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	InputSchema json.RawMessage `json:"inputSchema"`
}

var fileTools = []fileTool{
	{"find_files", "List source file paths under a relative directory, or search their contents for a case-sensitive literal. Use narrower directories when output is truncated.", json.RawMessage(`{"type":"object","properties":{"path":{"type":"string"},"query":{"type":"string"}},"required":["path","query"],"additionalProperties":false}`)},
	{"read_file", "Read the UTF-8 content of a relative source file in the isolated checkout.", json.RawMessage(`{"type":"object","properties":{"path":{"type":"string"}},"required":["path"],"additionalProperties":false}`)},
	{"edit_file", "Replace a unique exact snippet in a relative file. To create a new file, set before to an empty string and after to the full contents.", json.RawMessage(`{"type":"object","properties":{"path":{"type":"string"},"before":{"type":"string"},"after":{"type":"string"}},"required":["path","before","after"],"additionalProperties":false}`)},
}

type fileRequest struct {
	ID     json.RawMessage `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params"`
}

func ServeFiles(dir string, in io.Reader, out io.Writer) error {
	root, err := os.OpenRoot(dir)
	if err != nil {
		return err
	}
	defer root.Close()
	scanner := bufio.NewScanner(in)
	scanner.Buffer(make([]byte, 65536), 4*maxSource)
	encoder := json.NewEncoder(out)
	for scanner.Scan() {
		var request fileRequest
		if json.Unmarshal(scanner.Bytes(), &request) != nil || len(request.ID) == 0 {
			continue
		}
		response := map[string]any{"jsonrpc": "2.0", "id": request.ID}
		switch request.Method {
		case "initialize":
			var init struct {
				ProtocolVersion string `json:"protocolVersion"`
			}
			_ = json.Unmarshal(request.Params, &init)
			response["result"] = map[string]any{"protocolVersion": init.ProtocolVersion,
				"capabilities": map[string]any{"tools": map[string]any{}}, "serverInfo": map[string]string{"name": "railmark-files", "version": "1"}}
		case "ping":
			response["result"] = map[string]any{}
		case "tools/list":
			response["result"] = map[string]any{"tools": fileTools}
		case "tools/call":
			value, err := callFileTool(root, request.Params)
			if err != nil {
				value = err.Error()
			}
			response["result"] = map[string]any{"isError": err != nil, "content": []map[string]string{{"type": "text", "text": value}}}
		default:
			response["error"] = map[string]any{"code": -32601, "message": "Method not found"}
		}
		if err := encoder.Encode(response); err != nil {
			return err
		}
	}
	return scanner.Err()
}

func callFileTool(root *os.Root, request json.RawMessage) (string, error) {
	var args struct {
		Name      string            `json:"name"`
		Arguments map[string]string `json:"arguments"`
	}
	if json.Unmarshal(request, &args) != nil {
		return "", errors.New("无效的文件操作参数")
	}
	name := args.Arguments["path"]
	switch args.Name {
	case "find_files":
		return inspectFiles(root, name, args.Arguments["query"])
	case "read_file":
		return readSource(root, name)
	case "edit_file":
		before, hasBefore := args.Arguments["before"]
		after, hasAfter := args.Arguments["after"]
		if !hasBefore || !hasAfter || strings.TrimSpace(name) == "" {
			return "", errors.New("请传入 path、before 和 after")
		}
		return "已修改 " + name, editSource(root, name, before, after)
	default:
		return "", errors.New("未知文件操作")
	}
}
