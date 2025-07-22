#!/bin/bash

# Docker构建脚本
set -e

echo "🚀 开始构建 SVN Server WebUI Docker 镜像..."

# 检查是否安装了 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：未安装 Docker"
    exit 1
fi

# 构建 Docker 镜像（包含自动构建前后端）
echo "🐳 构建 Docker 镜像..."
docker build -t svn-server-webui:latest .

echo "✅ 构建完成！"
echo ""
echo "运行容器："
echo "  docker-compose up -d"
echo ""
echo "或使用 Docker 命令："
echo "  docker run -d --name svn-server-webui -p 80:80 -p 5000:5000 -v \$(pwd)/data:/data svn-server-webui:latest"