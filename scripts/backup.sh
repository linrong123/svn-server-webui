#!/bin/bash
# SVN Server WebUI 备份脚本

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

echo "开始备份 SVN Server WebUI..."

# 创建备份目录
mkdir -p "$BACKUP_PATH"

# 停止服务（可选，确保数据一致性）
echo "停止服务..."
docker-compose stop

# 备份数据
echo "备份数据文件..."
cp -r ./data "$BACKUP_PATH/"

# 记录备份信息
cat > "$BACKUP_PATH/backup_info.txt" <<EOF
备份时间: $(date)
备份版本: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
包含内容:
- SVN 仓库数据 (repos)
- SVN 配置文件 (conf)
- 应用数据库 (app)
EOF

# 重启服务
echo "重启服务..."
docker-compose start

# 压缩备份（可选）
echo "压缩备份文件..."
tar -czf "$BACKUP_PATH.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP"
rm -rf "$BACKUP_PATH"

echo "✅ 备份完成: $BACKUP_PATH.tar.gz"
echo ""
echo "恢复命令:"
echo "tar -xzf $BACKUP_PATH.tar.gz -C ."
echo "cp -r backup_$TIMESTAMP/data/* ./data/"