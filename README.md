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
