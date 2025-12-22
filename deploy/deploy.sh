#!/bin/bash
set -e

# 传入参数
PLATFORM=$1          # xinhee / shanshan
DEPLOY_ENV=$2        # test / prod
DEPLOY_KEY=$3        # deployment 名称
IMAGE_VERSION=$4     # 镜像 tag 比如 registry/app:v1
DEPLOY_NAMESPACE=$5  # 默认 web-cloud-test

if [ -z "$PLATFORM" ] || [ -z "$DEPLOY_ENV" ] || [ -z "$DEPLOY_KEY" ] || [ -z "$IMAGE_VERSION" ]; then
  echo "参数不足，需要：PLATFORM DEPLOY_ENV DEPLOY_KEY IMAGE_VERSION"
  exit 1
fi

# 如何deploy_env = main prod pre 则 使用 prod 对应的 kubeconfig
if [ "$DEPLOY_ENV" = "main" ] || [ "$DEPLOY_ENV" = "prod" ]; then
  DEPLOY_ENV="prod"
fi

# 如何deploy_env = test stage dev  则 使用 test 对应的 kubeconfig
if [ "$DEPLOY_ENV" = "test" ] || [ "$DEPLOY_ENV" = "stage" ]; then
  DEPLOY_ENV="test"
fi

# 如果 DEPLOY_NAMESPACE 没传，
if [ -z "$DEPLOY_NAMESPACE" ]; then
  if [ "$DEPLOY_ENV" = "prod" ]; then
    DEPLOY_NAMESPACE="web-cloud"
  elif [ "$DEPLOY_ENV" = "test" ]; then
    DEPLOY_NAMESPACE="web-cloud-test"
  fi
fi

# 动态选 kubeconfig
KCFG="/kubeconfig/${PLATFORM}.${DEPLOY_ENV}.yml"

if [ ! -f "$KCFG" ]; then
  echo "kubeconfig 不存在: $KCFG"
  exit 1
fi

export KUBECONFIG="$KCFG"

echo "使用 kubeconfig：$KCFG"
echo "部署：deployment/$DEPLOY_KEY"
echo "镜像：$IMAGE_VERSION"
echo "部署 namespace：$DEPLOY_NAMESPACE"

# 更新镜像
kubectl -n "$DEPLOY_NAMESPACE" set image deployment/"$DEPLOY_KEY" \
  "$DEPLOY_KEY"="$IMAGE_VERSION" --record

# 查看 rollout 过程
kubectl -n "$DEPLOY_NAMESPACE" rollout status deployment/"$DEPLOY_KEY"
