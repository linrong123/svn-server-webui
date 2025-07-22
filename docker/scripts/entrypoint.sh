#!/bin/sh
set -e

# 创建数据目录结构
mkdir -p /data/repos /data/conf /data/app

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

# 设置权限
chown -R apache:apache /data
chmod -R 755 /data

# 启动应用
exec "$@"