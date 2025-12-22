FROM bitnami/kubectl:latest

USER root

# ===== kubeconfig & deploy 脚本 =====
RUN mkdir -p /kubeconfig
VOLUME ["/kubeconfig"]
COPY deploy/deploy.sh /usr/local/bin/deploy.sh
RUN chmod +x /usr/local/bin/deploy.sh

ENTRYPOINT ["/bin/bash"]
CMD ["-c", "sleep infinity"]