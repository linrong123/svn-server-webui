# Claude Development Notes

## 项目概述
这是一个基于 Docker 的 SVN 服务器，提供现代化的 Web 管理界面。

## 主要技术决策

### 前端
- 使用 React 18 + TypeScript + Ant Design 5
- 使用 @tanstack/react-query v5 进行数据获取（注意：不是旧版的 react-query）
- 路由使用 React Router v6
- 构建工具使用 Vite

### 后端
- Node.js + Express + TypeScript
- 使用 better-sqlite3 作为数据库
- JWT 认证
- API 路由必须在静态文件服务之前定义（重要！）

### Docker
- 多阶段构建优化镜像大小
- 使用 Alpine Linux 作为基础镜像
- Supervisor 管理多个进程
- 自动生成 JWT_SECRET

## 常见问题和解决方案

### 1. 前端空白页错误
**问题**: React Query 版本不兼容
**解决**: 必须使用 @tanstack/react-query v5，不能使用旧版 react-query v3

### 2. API 返回 HTML 而不是 JSON
**问题**: Express 中间件顺序错误
**解决**: API 路由必须在 `express.static` 之前定义

### 3. useNavigate 错误
**问题**: AuthProvider 在 Router 外部使用了 useNavigate
**解决**: 将 AuthProvider 放在 BrowserRouter 内部

### 4. macOS 端口 5000 被占用
**问题**: AirPlay 服务占用端口 5000
**解决**: 修改 docker-compose.yml 使用其他端口，如 3000

## 开发命令

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 构建 Docker 镜像
./build-docker.sh

# 运行测试
npm test

# 代码检查
npm run lint
npm run typecheck
```

## 数据结构

### 数据库表
- users: 用户信息（id, username, password, email, role）
- repositories: 仓库信息（id, name, description, created_at）
- permissions: 权限信息（id, user_id, repository_id, permission）

### 文件结构
```
data/
├── repos/      # SVN 仓库
├── conf/       # SVN 认证文件
│   ├── svn-auth-file
│   └── svn-access-file
└── app/        # SQLite 数据库
    └── svn-webui.db
```

## 部署注意事项

1. **JWT_SECRET**: 自动生成，无需手动设置
2. **管理员账号**: 仅在首次启动时创建
3. **数据持久化**: 所有数据映射到 /data 目录
4. **权限问题**: macOS/Windows 上的权限警告可以忽略
5. **SVN 访问地址**: 内网环境直接使用 IP 访问，无需配置域名

## 维护指南

### 更新依赖
```bash
# 检查过时的包
npm outdated

# 更新包（谨慎操作）
npm update
```

### 调试
1. 查看容器日志: `docker logs svn-server-webui`
2. 进入容器: `docker exec -it svn-server-webui sh`
3. 检查进程: `docker exec svn-server-webui supervisorctl status`

### 性能优化
- 前端代码已经过大（约1.8MB），考虑代码分割
- 可以启用 Gzip 压缩
- 考虑使用 CDN 加载大型依赖

## 安全考虑
- 生产环境必须修改默认密码
- 建议使用 HTTPS
- 定期更新依赖包
- 考虑添加速率限制