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

# 初始化SVN认证文件
if [ ! -f /svn/conf/svn-auth-file ]; then
    touch /svn/conf/svn-auth-file
    # 创建默认管理员账户
    if [ -n "$ADMIN_USERNAME" ] && [ -n "$ADMIN_PASSWORD" ]; then
        htpasswd -b /svn/conf/svn-auth-file "$ADMIN_USERNAME" "$ADMIN_PASSWORD"
    fi
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