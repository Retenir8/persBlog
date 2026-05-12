# UI 与交互更新记录

本文档记录近期对「个人博客」前端与音乐模块的改动，便于回顾与发布说明。

---

## 1. 字体体系

**目标**：全站正文与 `layout` 中已加载的 Geist 字体一致，不再被全局 CSS 覆盖为 Arial。

**改动要点**：

- `src/app/globals.css`：`body` 去掉 `font-family: Arial, Helvetica, sans-serif`，避免与 Next 注入的 `--font-geist-sans` 冲突。
- `src/app/layout.tsx`：在 `<body>` 上增加 `font-sans`，使用 `@theme` 中配置的 `--font-sans`（即 Geist Sans）。
- `src/app/globals.css`：`.post-content code` 使用 `var(--font-geist-mono)`，与 Geist Mono 变量对齐。

---

## 2. 正文阅读体验

**目标**：文章详情页长文更易读，代码块与链接风格与全站 zinc 灰阶协调。

**改动要点**：

- `src/app/(blog)/posts/[id]/page.tsx`：正文容器增加 `mx-auto max-w-[65ch]`，控制行长；标题区仍占满 `max-w-3xl` 栏宽。
- `src/app/globals.css`：扩展 `.post-content` 样式，主要包括：
  - 正文字号约 1.0625rem、行高 1.75，正文色 zinc-800 / 深色 zinc-200。
  - 文内 `h1`～`h6` 字号与间距层级、首块元素 `margin-top: 0`。
  - 列表 `li` 间距、嵌套列表、`blockquote`、`hr`、`img`（自适应宽度 + 圆角）。
  - 链接改为 zinc 系 + 下划线偏移，替代纯蓝。
  - `pre` 代码块：内边距、横向滚动、圆角与边框；`pre code` 取消行内 code 的双重背景。

---

## 3. 音乐模块提示

**目标**：在添加网易云链接处说明链接格式限制，语气与现有表单辅助文案一致。

**改动要点**：

- `src/components/music/MusicBrowseManage.tsx`：在「链接」输入框下方增加小号灰色提示：**仅网页版链接可用**（`text-xs` + `text-zinc-500` / `dark:text-zinc-400`）。

---

## 4. 涉及文件一览

| 文件 | 说明 |
|------|------|
| `src/app/layout.tsx` | `body` 增加 `font-sans` |
| `src/app/globals.css` | 字体与 `.post-content` 阅读样式 |
| `src/app/(blog)/posts/[id]/page.tsx` | 正文区域 `max-w-[65ch]` 等 |
| `src/components/music/MusicBrowseManage.tsx` | 网易云链接提示语 |

---

## 5. 推送到 GitHub

当前仓库已配置远程 `origin`（示例：`https://github.com/Retenir8/persBlog.git`）。在仓库根目录执行以下步骤即可把本地提交推送到 GitHub。

### 5.1 查看改动

```powershell
cd C:\Users\MI\Desktop\persBlog
git status
```

### 5.2 暂存文件

仅提交本次 UI 相关文件（可按需增删路径）：

```powershell
git add src/app/layout.tsx src/app/globals.css "src/app/(blog)/posts/[id]/page.tsx" src/components/music/MusicBrowseManage.tsx docs/UI-更新记录.md
```

若你希望**同一批提交**里包含当前工作区里其它已修改文件（例如 `package-lock.json`、Prisma 迁移），可改用：

```powershell
git add -A
```

### 5.3 提交

```powershell
git commit -m "feat(ui): 字体与正文阅读优化，音乐页网易云链接提示"
```

可按团队习惯修改提交说明；若使用英文约定，也可写成 `docs: add UI changelog` 等并拆成多次提交。

### 5.4 推送到远程

当前分支为 `main` 时：

```powershell
git push origin main
```

若你本地分支名不是 `main`，把 `main` 换成你的分支名即可。

### 5.5 首次推送或新建仓库时

若尚未添加远程地址，需要先关联（将 URL 换成你的仓库地址）：

```powershell
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

### 5.6 身份验证（HTTPS）

使用 `https://github.com/...` 推送时，GitHub 已不再接受账户密码，需要：

- **个人访问令牌（PAT）**：在 GitHub → Settings → Developer settings → Personal access tokens 创建，推送时密码处粘贴令牌；或  
- **SSH**：改用 `git@github.com:用户名/仓库.git` 远程地址并配置本机 SSH 密钥。

按 GitHub 网页提示完成登录或令牌配置后，再次执行 `git push` 即可。

---

## 6. 可选后续

- 将设计令牌（accent / muted）集中到 `@theme`，进一步统一导航与正文链接色。  
- 为 `.post-content a` 增加 `focus-visible` 焦点环，提升键盘可达性。
