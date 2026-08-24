# Toolbox

个人用 HTML 工具箱：纯前端、本地处理，不依赖自建后端。

## 技术栈

- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS
- react-router-dom

## 已有工具

| 工具 | 路径 | 说明 |
|------|------|------|
| JSON 格式化 | `/json-format` | 格式化、压缩与校验 |
| DiceFace | `/diceface` | 字符串生成可复现哈希头像 |
| 外网 IP | `/public-ip` | 查询出口公网 IPv4 / IPv6 |
| 二维码生成 | `/qr-code` | 文本/链接生成本地二维码 |
| OTP 生成器 | `/otp` | 本地 TOTP、绑定二维码 |

## 开发

```bash
pnpm install
pnpm dev
```

构建与预览：

```bash
pnpm build
pnpm preview
```

## 添加工具

1. 在 `src/tools/<id>/` 新建工具组件（默认导出）
2. 在 `src/tools/registry.ts` 注册一项（名称、路径、懒加载等）

侧边导航与路由会自动接入。

## 理念

优先可插拔的纯前端小工具；需要服务端代理的能力（如主流 AI API）暂不纳入本仓库。
