# SVN Server WebUI

一个基于 Docker 的 SVN 服务器，提供现代化的 Web 管理界面，支持仓库管理、用户权限控制和代码浏览功能。

> ⚠️ **安全提示**：本项目包含的默认密码（admin/admin123）仅用于开发和演示。**生产环境部署前必须修改默认密码！**

## 功能特性

- 🚀 **现代化 Web UI** - 基于 React + TypeScript + Ant Design 的管理界面
- 📦 **仓库管理** - 创建、删除、浏览 SVN 仓库
- 👥 **用户管理** - 用户创建、权限分配、角色管理
- 📝 **代码浏览** - 在线浏览仓库文件和提交历史
- 🔐 **权限控制** - 基于角色的访问控制（RBAC）
- 🐳 **容器化部署** - 支持 Docker 一键部署
- 🌍 **多架构支持** - 支持 amd64 和 arm64 架构

## 快速开始

### 使用 Docker Compose（推荐）

1. 克隆仓库：

```bash
git clone https://github.com/yourusername/svn-server-webui.git
cd svn-server-webui
```

2. 构建镜像：

```bash
# 必须先构建镜像
./build-docker.sh
```

3. 启动服务：

```bash
docker-compose up -d
```

或者，如果你想要自动构建（开发模式）：

```bash
docker-compose -f docker-compose.build.yml up -d
```

4. 访问服务：

- Web UI: http://localhost:5000
- SVN Server: http://localhost/svn/

默认管理员账号：

- 用户名：admin
- 密码：admin123

### 使用 Docker

```bash
docker run -d \
  --name svn-server-webui \
  -p 80:80 \
  -p 5000:5000 \
  -v $(pwd)/data:/data \
  svn-server-webui:latest
```

> 注：数据将保存在当前目录的 `data` 文件夹中

## 环境变量配置

| 变量名           | 描述                               | 默认值     |
| ---------------- | ---------------------------------- | ---------- |
| `PORT`           | Web UI 端口                        | 5000       |
| `ADMIN_USERNAME` | 默认管理员用户名（仅首次启动有效） | admin      |
| `ADMIN_PASSWORD` | 默认管理员密码（仅首次启动有效）   | admin123   |
| `NODE_ENV`       | 运行环境                           | production |

注：其他配置如 JWT_SECRET 会在容器启动时自动生成，SVN 路径等已内置配置。

## 数据持久化

默认情况下，所有数据保存在当前目录的 `./data` 文件夹中。您可以修改 `docker-compose.yml` 来挂载到其他位置：

```yaml
volumes:
  - /your/custom/path:/data  # 修改为您想要的路径
```

或使用 Docker 命令时指定：

```bash
docker run -v /your/data/path:/data ...
```

**数据目录结构**：

```
data/
├── repos/      # SVN 仓库数据（代码和历史记录）
├── conf/       # SVN 用户认证文件
│   ├── svn-auth-file    # 用户密码
│   └── svn-access-file  # 访问权限
└── app/        # Web UI 数据库
    └── svn-webui.db     # 用户信息、仓库元数据、权限设置
```

**备份**：直接复制您挂载的数据目录即可。

**数据库说明**：

- 数据库仅保存 Web UI 相关信息（用户、仓库描述、权限）
- 删除数据库不会影响 SVN 仓库数据
- 删除数据库后会重建默认管理员账号，但需要重新创建其他用户

**⚠️ 重要警告**：

- 数据库和 SVN 认证是分离的两个系统
- 如果只删除数据库，SVN 认证文件中的用户仍然存在
- 建议：如需重置，同时删除 `data/app/svn-webui.db` 和 `data/conf/svn-auth-file`

**注意事项**：

- 环境变量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 仅在首次启动时生效
- 已有数据时，所有密码修改都应通过 Web UI 进行（会自动同步到 SVN）

## 使用指南

### 创建仓库

1. 登录 Web UI
2. 进入 "Repositories" 页面
3. 点击 "Create Repository" 按钮
4. 输入仓库名称和描述
5. 点击 "Create" 创建仓库

### 管理用户

1. 进入 "Users" 页面（需要管理员权限）
2. 点击 "Create User" 创建新用户
3. 设置用户名、密码和角色
4. 在用户列表中可以编辑或删除用户

### 访问 SVN 仓库

使用 SVN 客户端访问仓库：

```bash
# 检出仓库
svn checkout http://localhost/svn/your-repo-name

# 提交代码（需要认证）
svn commit -m "Your commit message" --username your-username
```

**智能地址显示**：
- Web UI 会根据你访问的地址自动显示正确的 SVN URL
- 支持一键复制 SVN 地址和检出命令
- 自动处理端口映射（如 Web UI 7001 端口对应 SVN 8090 端口）

### 权限管理

系统支持两种角色：

- **Admin**: 完全控制权限，可以管理仓库和用户
- **User**: 普通用户，可以访问授权的仓库

## 开发指南

### 本地开发环境

1. 安装依赖：

```bash
npm install
```

2. 启动后端服务：

```bash
npm run dev:server
```

3. 启动前端开发服务器：

```bash
npm run dev:client
```

### 构建项目

```bash
# 构建前后端
npm run build

# 构建 Docker 镜像（多架构）
npm run docker:build
```

### 构建脚本说明

项目提供了以下构建脚本和配置文件：

1. **build-docker.sh** - 本地 Docker 镜像构建

   ```bash
   ./build-docker.sh
   # 构建本地使用的 Docker 镜像 (svn-server-webui:latest)
   ```

2. **build.sh** - 发布到 Docker Hub

   ```bash
   # 本地构建（默认）
   ./build.sh v1.0.0

   # 构建并推送多架构镜像
   ./build.sh v1.0.0 multi

   # 使用 buildx 构建，同时更新版本 tag 和 latest tag
   ./build.sh v1.0.0 buildx
   ```

3. **scripts/test-docker.sh** - Docker 测试脚本

   ```bash
   ./scripts/test-docker.sh
   # 自动测试 Docker 容器的基础功能
   ```

4. **Docker Compose 配置文件**
   - `docker-compose.yml` - 默认配置，使用预构建镜像（需要先运行 build-docker.sh）
   - `docker-compose.build.yml` - 自动构建配置，会在启动时构建镜像
   - `docker-compose.prod.example.yml` - 生产环境示例配置

### 项目结构

```
svn-server-webui/
├── client/          # React 前端应用
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
├── server/          # Node.js 后端服务
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
├── docker/          # Docker 相关配置
│   ├── apache/
│   ├── scripts/
│   └── supervisor/
└── docker-compose.yml
```

## 技术栈

- **前端**: React 18 + TypeScript + Ant Design 5 + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: @tanstack/react-query v5
- **路由**: React Router v6
- **SVN 服务器**: Apache + mod_dav_svn
- **容器化**: Docker + Docker Compose
- **进程管理**: Supervisor

## 生产环境部署

参考 `docker-compose.prod.example.yml` 配置文件，主要注意事项：

1. **安全配置**：

   - 使用环境变量设置密码，避免硬编码
   - 配置 HTTPS（通过反向代理）
   - 修改默认端口
   - 设置资源限制

2. **推荐的反向代理配置**（Nginx 示例）：

```nginx
server {
    listen 443 ssl http2;
    server_name svn.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /svn {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 安全建议

1. **生产环境部署前**：

   - 修改默认的管理员密码
   - 使用强密码策略
   - 配置 HTTPS 访问
   - 限制访问 IP（防火墙规则）

2. **定期维护**：
   - 备份数据目录
   - 更新 Docker 镜像
   - 监控系统日志
   - 审计用户访问记录

## 故障排除

### Web UI 无法访问

- 检查容器是否正常运行：`docker-compose ps`
- 查看容器日志：`docker-compose logs`

### SVN 认证失败

- 确认用户名和密码正确
- 检查 Apache 配置文件权限

### 仓库创建失败

- 检查磁盘空间
- 确认容器有写入权限

### 权限错误（macOS/Windows）

在 macOS 或 Windows 上使用 Docker 时，可能会看到权限相关的警告：

```
Warning: Cannot change ownership of /data (running on non-Linux host?)
```

这是正常现象，因为：

- Docker Desktop 在虚拟机中运行，文件权限由主机系统管理
- 容器仍然可以正常读写文件
- 这些警告不会影响功能

### 用户认证不一致

如果 Web UI 和 SVN 用户不同步：

1. 停止容器：`docker-compose down`
2. 删除认证文件：`rm data/app/svn-webui.db data/conf/svn-auth-file`
3. 重启容器：`docker-compose up -d`
4. 重新创建所有用户

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

