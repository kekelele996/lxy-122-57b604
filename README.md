# 游戏战队管理系统

## 快速启动（Docker Compose）

首次启动先复制环境变量文件，然后一条命令启动全部服务：

```bash
cp .env.example .env
docker compose up -d --build
```

访问地址：

- 前端：http://localhost:18122
- 后端：http://localhost:19122
- 健康检查：http://localhost:19122/api/health

## 项目介绍

用于管理战队成员、赛程、比赛和团队资料的后台系统。

## 主要功能

- 提供游戏主题业务页面或服务入口
- 通过 `/api` 统一访问后端接口
- 使用 Docker Compose 一键启动前端、后端和 SQLite 数据卷服务
- 通过 `.env` 调整端口、JWT 密钥和数据库配置

## 本地开发

前端开发：

```bash
cd frontend && npm install && npm run dev
```

后端开发：

```bash
cd backend && npm install && npm run dev
```

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | Vue 3 + Vite + Element Plus |
| 后端 | Node.js + Express + SQLite |
| 数据 | SQLite 文件 + Docker 命名卷 |
| 部署 | Docker Compose + Nginx |

## 项目目录结构

```text
.
├── frontend/           # 前端页面、组件、样式和 Nginx 配置
├── backend/            # 后端接口、业务逻辑和 Dockerfile
├── database/           # SQLite 初始数据或数据脚本
├── docker-compose.yml  # 一键部署编排
├── .env.example        # 环境变量示例
└── README.md
```

## 环境变量说明

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| COMPOSE_PROJECT_NAME | Compose 英文项目名，避免中文目录名启动失败 | gb122 |
| FRONTEND_PORT | 前端宿主机端口 | 18122 |
| BACKEND_PORT | 后端宿主机端口 | 19122 |
| BACKEND_INTERNAL_PORT | 后端容器内端口 | 3000 |
| DB_NAME | 数据库名称标识 | gb122_sqlite |
| DB_USER | 数据库用户标识 | app |
| DB_PASSWORD | 数据库密码占位 | app_pwd |
| DB_ROOT_PASSWORD | 数据库 root 密码占位 | root_pwd |
| DB_PORT | SQLite 项目不映射数据库端口，保留为 0 | 0 |
| JWT_SECRET | JWT 签名密钥 | change_me_to_a_long_random_string_gb122 |

## Docker 部署说明

- `docker-compose.yml` 顶层包含 `name: gb122`，同时 `.env` 提供 `COMPOSE_PROJECT_NAME`，可在中文目录下直接启动。
- 前端 Nginx 监听容器内 `80`，并将 `/api` 反向代理到后端服务名 `backend:3000`。
- SQLite 数据写入 Docker 命名卷 `db_data`，避免绑定挂载中文路径造成兼容问题。
- 如端口冲突，修改 `.env` 中的 `FRONTEND_PORT` 或 `BACKEND_PORT` 后重新执行 `docker compose up -d --build`。

常用命令：

```bash
docker compose ps
docker compose logs -f
docker compose down --remove-orphans
```

## License

MIT
