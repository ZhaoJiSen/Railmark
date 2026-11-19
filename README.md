# Railmark

Railmark 是 macOS 上的本地版本与需求工作台。创建需求时选择至少一个项目目录，在前端和后端分组里维护交付进度、预期开发分支和目标合入分支。

从任一项目行打开 Git 核对窗口。它可以读取当前分支、工作区、跟踪上游和相对目标分支的提交，并提醒当前分支与预期不符或有跨版本重复绑定。Git 检查读取本地信息。需求说明、修改日志和最近查看的版本保存在本机 SQLite 数据库。

## 开发

需要 macOS、Go 1.27.3 或更新版本、Node.js 22 或更新版本和本机 Git。

```sh
npm ci
npm run generate
npm run dev
```

`npm run ci` 会检查源码文件行数（每个最多 300 行）、TypeScript 类型和 Go 测试。

## 打包

```sh
npm run build
```

Apple Silicon 安装镜像生成在 `build/darwin-arm64/`。打开 DMG，把 `Railmark.app` 拖到「应用程序」。

## 文档导入与 CLI 自动化

- 新建需求时点击标题栏的「AI 解析文档」，读取钉钉文档或粘贴正文，再用 Codex 或 Claude Code 生成草稿。预览后点击「填入空白字段」返回表单，选择版本与本地项目后创建需求。
- 读取 `alidocs.dingtalk.com/i/nodes/…` 等在线文字文档链接需要安装 [钉钉 DWS](https://github.com/DingTalk-Real-AI/dingtalk-workspace-cli)，并在终端执行 `dws auth login --device`。用 `dws auth status` 核对当前组织。账号需要文档查看权限。
- 顶部「AI 设置」可以检测本机 CLI，并设置文档导入和代码自动化共用的默认工具。默认使用已登录的 [Codex CLI](https://learn.chatgpt.com/docs/non-interactive-mode)。[Claude Code](https://code.claude.com/docs/en/settings) 沿用用户配置中的模型和 `ANTHROPIC_*` 网关配置。通过 Finder 启动时会检测 Homebrew、`~/.local/bin` 以及 ChatGPT.app 自带的 Codex。
- 需求保存后，从详情页打开「CLI 自动化」，选择一个已绑定本地开发分支的关联项目。CLI 读取已保存的需求，用文件工具修改独立副本。结果页显示基准提交和变更文件，可在 Finder 中打开副本进行核查。测试、提交和推送由你在核查后执行。

## 界面组件

界面采用 HeroUI v3 官方默认主题。按钮、表单、表格、状态标签、菜单、弹窗和抽屉优先组合 HeroUI 组件，使用其公开的 variant 和 size。页面只负责布局与信息结构，不覆盖组件圆角、颜色、字体尺寸和交互状态。Git Diff 与可拖拽分割面板保留对应领域组件。
