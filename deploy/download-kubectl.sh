## 国外源下载很慢，先下载到本地然后copy过去
 1. 设置版本
export KUBECTL_VERSION=v1.28.3

# 2. 下载 kubectl 二进制 到 当前目录
echo "正在下载 kubectl ${KUBECTL_VERSION}..."
curl --progress-bar -fSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" -o "kubectl"

# 建议使用迅雷下载，复制到当前目录
https://dl.k8s.io/release/v1.28.3/bin/linux/amd64/kubectl

# 3. 添加执行权限
chmod +x kubectl
