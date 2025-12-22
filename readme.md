
### 添加kubeconfig配置
1. 登录rancher 找到对应的project 右上角 copy kubeConfig clipboard
2. 文件命名规范，projectName.env.yml

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