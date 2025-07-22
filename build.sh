#!/bin/bash
# SVN Server WebUI 构建脚本

IMAGE_NAME="rongdede/svn-server-webui"
VERSION=${1:-latest}

echo "构建 SVN Server WebUI Docker 镜像..."

# 1. 单架构构建（用于本地测试）
build_local() {
    echo "构建本地架构镜像..."
    if [ "${VERSION}" = "latest" ]; then
        docker build -t ${IMAGE_NAME}:latest .
        echo "已标记: ${IMAGE_NAME}:latest"
    else
        docker build -t ${IMAGE_NAME}:${VERSION} -t ${IMAGE_NAME}:latest .
        echo "已标记: ${IMAGE_NAME}:${VERSION} 和 ${IMAGE_NAME}:latest"
    fi
}

# 2. 多架构构建（需要 push 到 registry）
build_multi() {
    echo "构建多架构镜像..."
    
    # 确保 colima 支持多架构
    echo "注意：使用 Colima 时需要确保启用了多架构支持"
    echo "如果出错，请尝试：colima start --arch aarch64 --cpu 4 --memory 8"
    echo ""
    
    # 使用 docker manifest 方式
    # 分别构建两个架构
    docker build --platform linux/amd64 -t ${IMAGE_NAME}:${VERSION}-amd64 .
    docker build --platform linux/arm64 -t ${IMAGE_NAME}:${VERSION}-arm64 .
    
    # 推送到 registry
    docker push ${IMAGE_NAME}:${VERSION}-amd64
    docker push ${IMAGE_NAME}:${VERSION}-arm64
    
    # 创建版本 manifest
    docker manifest create ${IMAGE_NAME}:${VERSION} \
        ${IMAGE_NAME}:${VERSION}-amd64 \
        ${IMAGE_NAME}:${VERSION}-arm64
    
    docker manifest push ${IMAGE_NAME}:${VERSION}
    
    # 创建 latest manifest
    docker manifest create ${IMAGE_NAME}:latest \
        ${IMAGE_NAME}:${VERSION}-amd64 \
        ${IMAGE_NAME}:${VERSION}-arm64
    
    docker manifest push ${IMAGE_NAME}:latest
    
    echo "已推送: ${IMAGE_NAME}:${VERSION} 和 ${IMAGE_NAME}:latest"
}

# 3. 使用 buildx（如果可用）
build_buildx() {
    echo "使用 buildx 构建..."
    
    # 检查 buildx 是否可用
    if ! docker buildx version > /dev/null 2>&1; then
        echo "错误：Docker buildx 未安装或未启用"
        echo ""
        echo "对于 Colima 用户，buildx 可能不可用。"
        echo "建议使用 'multi' 选项来构建多架构镜像："
        echo "  $0 $VERSION multi"
        echo ""
        echo "或安装 Docker Desktop 来获得 buildx 支持。"
        exit 1
    fi
    
    # 创建或使用现有的 builder
    docker buildx create --use --name mybuilder 2>/dev/null || docker buildx use mybuilder
    
    # 构建并推送（同时打上版本标签和 latest 标签）
    if [ "${VERSION}" = "latest" ]; then
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -t ${IMAGE_NAME}:latest \
            --push .
        echo "已推送: ${IMAGE_NAME}:latest"
    else
        docker buildx build \
            --platform linux/amd64,linux/arm64 \
            -t ${IMAGE_NAME}:${VERSION} \
            -t ${IMAGE_NAME}:latest \
            --push .
        echo "已推送: ${IMAGE_NAME}:${VERSION} 和 ${IMAGE_NAME}:latest"
    fi
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