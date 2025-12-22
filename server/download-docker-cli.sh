#!/bin/bash
# 下载 docker-cli 二进制文件 并解压到 docker-cli 目录

set -e

DOCKER_CLI_DIR="docker-cli"
DOCKER_VERSION="${DOCKER_VERSION:-25.0.3}"

# 清理并创建目录
rm -rf "$DOCKER_CLI_DIR"
mkdir -p "$DOCKER_CLI_DIR"

# 下载到临时文件（显示进度）
TMP_FILE="/tmp/docker-cli-${DOCKER_VERSION}.tgz"
echo "正在下载 Docker CLI ${DOCKER_VERSION}..."
curl --progress-bar -fSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz" \
    -o "$TMP_FILE"

# 解压，使用 --strip-components=1 去掉 docker 这一层目录
echo "正在解压..."
tar -xz --strip-components=1 -C "$DOCKER_CLI_DIR" -f "$TMP_FILE" docker/docker

# 清理临时文件
rm -f "$TMP_FILE"

# 重命名 docker 二进制文件（可选，如果需要保持原名称可以删除这行）
# mv "$DOCKER_CLI_DIR/docker" "$DOCKER_CLI_DIR/docker"  # 已经是 docker 了

echo "✓ Docker CLI 已下载到 $DOCKER_CLI_DIR/docker"
echo "文件大小: $(du -h "$DOCKER_CLI_DIR/docker" | cut -f1)"