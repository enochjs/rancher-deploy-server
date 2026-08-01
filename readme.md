
### 添加kubeconfig配置
1. 登录rancher 找到对应的project 右上角 copy kubeConfig clipboard
2. 文件命名规范，projectName.env.yml
3. 设置insecure-skip-tls-verify: true;如下

```yml
apiVersion: v1
kind: Config
clusters:
- name: "local"
  cluster:
    server: "https://114.55.130.93:31684/k8s/clusters/local"
    insecure-skip-tls-verify: true
```

### 添加vpn 配置 如果需要vpn的话, 支持多个vpn, 不需要vpn则不用配
1. 添加格式如: config.help.json
  ```
  {
    "name": "vpn_${projectName}",
    "server": "${vpn_server}",
    "user": "${vpn_user}",
    "pass": "${vpn_pass}",
    "ec_ver": "7.6.7"
  }
  ```

### 下载 kubectl-cli 放到 deploy 目录下 命名为kubectl
参考download-kubectl.sh

### 下载 docker-cli 放到server目录下 docker-cli/docker
参考 download-docker-cli.sh

###  安装docker-compose依赖
cd docker-compose
yarn install
sh start.sh

### docker 使用的是主机的docker，所以需要你的主机安装docker


### 测试网络是否正常
curl -X POST http://localhost:9090/ping \
     -H "Content-Type: application/json" \
     -d '{"platform": "vpn_projectName"}'

返回success true则为正常
### 发布
curl -X POST http://localhost:9090/deploy -H "Content-Type: application/json" -d '{
  "platform": "vpn_projectName",
  "env": "test",
  "key": "scm-saas",
  "image": "your_image_name"
}'

kubectl -n "$DEPLOY_NAMESPACE" set image deployment/"$DEPLOY_KEY" \
  "$DEPLOY_KEY"="$IMAGE_VERSION" --record

### 容器内排查 / 测试

> 说明：部署最终是在 cli 容器内执行 `deploy.sh`。
> 有配 vpn 的平台跑在 `vpn_${projectName}` 容器里；没配 vpn 的平台会回退到 `docker-default-cli` 容器。
> deploy.sh 收到的平台参数是去掉 `vpn_` 前缀的名字（如 `vpn_tangshi` -> `tangshi`）。

下面变量按需修改后整段执行即可：

```bash
# ===== 改这里 =====
CLI=docker-default-cli   # 有 vpn 就填 vpn_xxx，没 vpn 填 docker-default-cli
PLATFORM=tangshi         # deploy.sh 用的平台名（不带 vpn_ 前缀）
ENV=prod                 # prod / test
KEY=scm-saas             # deployment 名称
IMAGE=registry.cn-hangzhou.aliyuncs.com/uf-scm/scm-tangshi-web:lm-scm-tangshi-web-2026-05-31-1_1
NS=web-cloud             # namespace，prod 默认 web-cloud / test 默认 web-cloud-test
KCFG=/kubeconfig/${PLATFORM}.${ENV}.yml
# ==================

# 1. 确认 cli 容器在跑
docker ps --format '{{.Names}}'

# 2. 确认 kubeconfig 与 deploy.sh 存在
docker exec $CLI ls -l $KCFG /usr/local/bin/deploy.sh

# 3. 取出集群地址 host:port
SRV=$(docker exec $CLI sh -c "grep server: $KCFG | sed -E 's#.*https?://([^/\"]+).*#\1#'")
HOST=${SRV%%:*}; PORT=${SRV##*:}
echo "集群地址: $HOST:$PORT"

# 4. 网络连通性：ICMP（能 ping）≠ 端口能连，重点看端口
docker exec $CLI sh -c "ping -c 2 -W 2 $HOST" || echo "ping 不通"
docker exec $CLI sh -c "timeout 8 sh -c '</dev/tcp/$HOST/$PORT' && echo '端口可连' || echo '端口不可连(可能需 vpn / 防火墙白名单)'"

# 5. kubectl 只读连通性测试（不会改动线上）
docker exec -e KUBECONFIG=$KCFG $CLI kubectl -n $NS get deploy $KEY

# 6. 手动跑一次完整部署（确认无误后再执行，会真正更新镜像）
docker exec $CLI bash /usr/local/bin/deploy.sh $PLATFORM $ENV $KEY $IMAGE $NS
```
