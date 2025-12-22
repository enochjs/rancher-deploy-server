# 基于 CLI 镜像
FROM hagb/docker-easyconnect:cli

USER root

# 安装基础工具
RUN apt-get update && \
    apt-get install -y \
      iputils-ping \
      iproute2 \
      net-tools \
      iptables \
      jq \
      procps \
      ca-certificates \
      bash \
    && rm -rf /var/lib/apt/lists/*

# ===== COPY 本地 kubectl 到镜像 =====
COPY deploy/kubectl /usr/local/bin/kubectl
RUN chmod +x /usr/local/bin/kubectl
# 注意：kubectl version 检查在跨架构构建时会失败，实际运行时再验证

# ===== kubeconfig & deploy 脚本 =====
RUN mkdir -p /kubeconfig
COPY configs/kubeconfig/ /kubeconfig/
COPY deploy/deploy.sh /usr/local/bin/deploy.sh
RUN chmod +x /usr/local/bin/deploy.sh

# ⚠️ 不要加 ENTRYPOINT / CMD，会导致 docker-easyconnect:cli 登录失败
