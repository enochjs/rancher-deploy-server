#!/bin/bash
set -e

# 检查是否传入了 amd 参数
USE_PLATFORM=""
if [ "$1" = "amd" ]; then
    USE_PLATFORM="--platform linux/amd64"
    node generate_compose.js amd
else
    node generate_compose.js
fi

echo "build docker-easyconnect-cli start" ${USE_PLATFORM}
cd ..
if [ -n "$USE_PLATFORM" ]; then
    docker build $USE_PLATFORM -f deploy/vpn/Dockerfile -t docker-easyconnect-cli .
else
    docker build -f deploy/vpn/Dockerfile -t docker-easyconnect-cli .
fi
echo "build docker-easyconnect-cli done" ${USE_PLATFORM}

echo "build docker-default-cli start" ${USE_PLATFORM}
if [ -n "$USE_PLATFORM" ]; then
    docker build $USE_PLATFORM -f deploy/default/Dockerfile -t docker-default-cli .
else
    docker build -f deploy/default/Dockerfile -t docker-default-cli .
fi
echo "build docker-default-cli done" ${USE_PLATFORM}

echo "build docker-deploy-server start" ${USE_PLATFORM}
if [ -n "$USE_PLATFORM" ]; then
    docker build $USE_PLATFORM -f server/Dockerfile -t docker-deploy-server .
else
    docker build -f server/Dockerfile -t docker-deploy-server .
fi
echo "build docker-deploy-server done" ${USE_PLATFORM}

cd docker-compose
docker-compose up -d --build 

echo "启动完成：VPN 容器 + deploy_api 已启动"
