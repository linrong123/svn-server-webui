#!/bin/sh
set -e

# 创建数据目录结构
mkdir -p /data/repos /data/conf /data/app

# 处理符号链接
# 如果 /svn/repos 存在但不是符号链接，移动内容到 /data/repos
if [ -d /svn/repos ] && [ ! -L /svn/repos ]; then
    echo "Moving existing repos to /data/repos..."
    if [ "$(ls -A /svn/repos 2>/dev/null)" ]; then
        cp -a /svn/repos/. /data/repos/
    fi
    rm -rf /svn/repos
fi

# 如果 /svn/conf 存在但不是符号链接，移动内容到 /data/conf
if [ -d /svn/conf ] && [ ! -L /svn/conf ]; then
    echo "Moving existing conf to /data/conf..."
    if [ "$(ls -A /svn/conf 2>/dev/null)" ]; then
        cp -a /svn/conf/. /data/conf/
    fi
    rm -rf /svn/conf
fi

# 创建符号链接（如果不存在）
[ ! -e /svn/repos ] && ln -s /data/repos /svn/repos
[ ! -e /svn/conf ] && ln -s /data/conf /svn/conf
[ ! -e /app/data ] && ln -s /data/app /app/data

# 自动生成 JWT_SECRET（如果未设置）
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(head -c 32 /dev/urandom | base64)
    echo "Generated JWT_SECRET automatically"
fi

# 检查是否需要初始化（数据库或认证文件不存在）
NEED_INIT=false
if [ ! -f /app/data/svn-webui.db ] || [ ! -f /svn/conf/svn-auth-file ]; then
    NEED_INIT=true
fi

# 初始化SVN认证文件
if [ ! -f /svn/conf/svn-auth-file ]; then
    touch /svn/conf/svn-auth-file
fi

# 如果需要初始化，设置管理员密码
if [ "$NEED_INIT" = true ] && [ -n "$ADMIN_USERNAME" ] && [ -n "$ADMIN_PASSWORD" ]; then
    htpasswd -b /svn/conf/svn-auth-file "$ADMIN_USERNAME" "$ADMIN_PASSWORD"
    echo "Initialized admin password for $ADMIN_USERNAME"
fi

# 初始化SVN访问控制文件
if [ ! -f /svn/conf/svn-access-file ]; then
    cat > /svn/conf/svn-access-file <<EOF
[groups]
admin = ${ADMIN_USERNAME:-admin}

[/]
@admin = rw
* = r
EOF
fi

# 设置权限（仅对容器内的目录）
# 注意：在某些环境下（如 macOS），可能无法修改挂载目录的权限
if [ -w /data ]; then
    chown -R apache:apache /data 2>/dev/null || true
    chmod -R 755 /data 2>/dev/null || true
else
    echo "Warning: Cannot change ownership of /data (running on non-Linux host?)"
fi

# 确保 Apache 用户可以访问必要的目录
chown -R apache:apache /svn 2>/dev/null || true
chown -R apache:apache /app/data 2>/dev/null || true

# 启动后自动同步仓库的函数
sync_repositories() {
    echo "Waiting for server to start..."
    sleep 15  # 给服务器启动时间
    
    # 获取管理员 token
    TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"${ADMIN_USERNAME:-admin}\",\"password\":\"${ADMIN_PASSWORD:-admin123}\"}" \
        | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$TOKEN" ]; then
        echo "Syncing repositories from file system..."
        SYNC_RESULT=$(curl -s -X POST http://localhost:5000/api/repositories/sync \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json")
        echo "Sync result: $SYNC_RESULT"
    else
        echo "Could not sync repositories - failed to authenticate"
    fi
}

# 在后台运行同步
(sync_repositories) &

# 启动应用
exec "$@"