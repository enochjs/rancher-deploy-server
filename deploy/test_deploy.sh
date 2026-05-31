#!/bin/bash
# 容器内排查 / 测试脚本
#
# 说明：部署最终是在 cli 容器内执行 deploy.sh。
#   - 有配 vpn 的平台跑在 vpn_${projectName} 容器里；
#   - 没配 vpn 的平台会回退到 docker-default-cli 容器；
#   - deploy.sh 收到的平台参数是去掉 vpn_ 前缀的名字（如 vpn_tangshi -> tangshi）。
#
# 下面变量按需修改后整段执行即可；也可用环境变量覆盖，例如：
#   CLI=vpn_xxx PLATFORM=tangshi ENV=prod bash deploy/test_deploy.sh

# ===== 改这里 =====
CLI=${CLI:-docker-default-cli}   # 有 vpn 就填 vpn_xxx，没 vpn 填 docker-default-cli
PLATFORM=${PLATFORM:-tangshi}    # deploy.sh 用的平台名（不带 vpn_ 前缀）
ENV=${ENV:-prod}                 # prod / test
KEY=${KEY:-scm-saas}             # deployment 名称
IMAGE=${IMAGE:-registry.cn-hangzhou.aliyuncs.com/uf-scm/scm-tangshi-web:lm-scm-tangshi-web-2026-05-31-1_1}
NS=${NS:-web-cloud}              # namespace，prod 默认 web-cloud / test 默认 web-cloud-test
KCFG=${KCFG:-/kubeconfig/${PLATFORM}.${ENV}.yml}
# ==================

echo "===== 1. 确认 cli 容器在跑 ====="
docker ps --format '{{.Names}}'

echo "===== 2. 确认 kubeconfig 与 deploy.sh 存在 ====="
docker exec "$CLI" ls -l "$KCFG" /usr/local/bin/deploy.sh

echo "===== 3. 取出集群地址 host:port ====="
SRV=$(docker exec "$CLI" sh -c "grep server: $KCFG | sed -E 's#.*https?://([^/\"]+).*#\1#'")
HOST=${SRV%%:*}; PORT=${SRV##*:}
echo "集群地址: $HOST:$PORT"

echo "===== 4. 网络连通性：ICMP（能 ping）≠ 端口能连，重点看端口 ====="
docker exec "$CLI" sh -c "ping -c 2 -W 2 $HOST" || echo "ping 不通"
docker exec "$CLI" sh -c "timeout 8 sh -c '</dev/tcp/$HOST/$PORT' && echo '端口可连' || echo '端口不可连(可能需 vpn / 防火墙白名单)'"

echo "===== 5. kubectl 只读连通性测试（不会改动线上）====="
docker exec -e KUBECONFIG="$KCFG" "$CLI" kubectl -n "$NS" get deploy "$KEY"

echo "===== 6. 手动跑一次完整部署（确认无误后再执行，会真正更新镜像）====="
docker exec "$CLI" bash /usr/local/bin/deploy.sh "$PLATFORM" "$ENV" "$KEY" "$IMAGE" "$NS"
