# SVN Server WebUI

一个基于 Docker 的 SVN 服务器，提供现代化的 Web 管理界面，支持仓库管理、用户权限控制和代码浏览功能。

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

2. 复制环境变量配置：
```bash
cp .env.example .env
# 编辑 .env 文件，修改必要的配置
```

3. 启动服务：
```bash
docker-compose up -d
```

4. 访问服务：
- Web UI: http://localhost:3000
- SVN Server: http://localhost:8080/svn/

默认管理员账号：
- 用户名：admin
- 密码：admin123

### 使用 Docker

```bash
docker run -d \
  --name svn-server-webui \
  -p 8080:80 \
  -p 3000:5000 \
  -v svn_repos:/svn/repos \
  -v svn_conf:/svn/conf \
  -v svn_data:/app/data \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=admin123 \
  -e JWT_SECRET=your-secret-key \
  ghcr.io/yourusername/svn-server-webui:latest
```

## 环境变量配置

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `PORT` | Web UI 端口 | 5000 |
| `SVN_REPOS_PATH` | SVN 仓库存储路径 | /svn/repos |
| `SVN_CONF_PATH` | SVN 配置文件路径 | /svn/conf |
| `JWT_SECRET` | JWT 密钥（生产环境请修改） | your-secret-key |
| `ADMIN_USERNAME` | 默认管理员用户名 | admin |
| `ADMIN_PASSWORD` | 默认管理员密码 | admin123 |

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
svn checkout http://localhost:8080/svn/your-repo-name

# 提交代码（需要认证）
svn commit -m "Your commit message" --username your-username
```

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

- **前端**: React + TypeScript + Ant Design + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite
- **SVN 服务器**: Apache + mod_dav_svn
- **容器化**: Docker + Docker Compose
- **进程管理**: Supervisor

## 验收测试

1. **基础功能测试**：
```bash
# 运行 Docker 测试脚本
./scripts/test-docker.sh
```

2. **手动测试清单**：
- [ ] 登录系统
- [ ] 创建新仓库
- [ ] 浏览仓库文件
- [ ] 查看提交历史
- [ ] 创建新用户
- [ ] 修改用户权限
- [ ] 使用 SVN 客户端检出和提交代码

## 安全建议

1. **生产环境部署前**：
   - 修改默认的管理员密码
   - 使用强密码策略
   - 修改 JWT_SECRET 为随机字符串
   - 配置 HTTPS 访问

2. **定期维护**：
   - 备份 SVN 仓库数据
   - 更新 Docker 镜像
   - 监控系统日志

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

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License