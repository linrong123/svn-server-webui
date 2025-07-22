#!/bin/bash
# SVN Server WebUI 构建脚本

IMAGE_NAME="rongdede/svn-server-webui"
VERSION=${1:-latest}

echo "构建 SVN Server WebUI Docker 镜像..."

# 1. 单架构构建（用于本地测试）
build_local() {
    echo "构建本地架构镜像..."
    docker build -t ${IMAGE_NAME}:${VERSION} .
}

# 2. 多架构构建（需要 push 到 registry）
build_multi() {
    echo "构建多架构镜像..."
    
    # 确保 colima 支持多架构
    echo "请确保 Colima 已启用多架构支持："
    echo "colima start --arch aarch64 --cpu 4 --memory 8"
    
    # 使用 docker manifest 方式
    # 分别构建两个架构
    docker build --platform linux/amd64 -t ${IMAGE_NAME}:${VERSION}-amd64 .
    docker build --platform linux/arm64 -t ${IMAGE_NAME}:${VERSION}-arm64 .
    
    # 推送到 registry
    docker push ${IMAGE_NAME}:${VERSION}-amd64
    docker push ${IMAGE_NAME}:${VERSION}-arm64
    
    # 创建 manifest
    docker manifest create ${IMAGE_NAME}:${VERSION} \
        ${IMAGE_NAME}:${VERSION}-amd64 \
        ${IMAGE_NAME}:${VERSION}-arm64
    
    docker manifest push ${IMAGE_NAME}:${VERSION}
}

# 3. 使用 buildx（如果可用）
build_buildx() {
    echo "使用 buildx 构建..."
    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        -t ${IMAGE_NAME}:${VERSION} \
        --push .
}

# 主菜单
case "${2:-local}" in
    "local")
        build_local
        ;;
    "multi")
        build_multi
        ;;
    "buildx")
        build_buildx
        ;;
    *)
        echo "用法: $0 [版本] [local|multi|buildx]"
        echo "  local  - 构建本地架构（默认）"
        echo "  multi  - 构建多架构（需要 push 权限）"
        echo "  buildx - 使用 buildx（需要安装）"
        exit 1
        ;;
esac

echo "构建完成！"