#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_FILE = path.join(__dirname, '../configs/config.json');
const OUTPUT_FILE = path.join(__dirname, 'docker-compose.yml');

// 实现类似 Python shlex.quote 的功能，安全转义 shell 参数
// 注意：这里返回的是用于 shell 命令的转义字符串
function shellQuote(str) {
  if (str === '') {
    return "''";
  }
  // 如果字符串只包含安全字符（字母、数字、连字符、下划线、点、斜杠），不需要引号
  if (/^[a-zA-Z0-9._/:@-]+$/.test(str)) {
    return str;
  }
  // 否则用单引号包裹，并将内部的单引号转义为 '\''
  // 这样在 shell 中执行时，单引号内的内容会被正确解析
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

function main() {
  // 检查是否传入了 cmd 参数
  const usePlatform = process.argv.length > 2 && process.argv[2] === 'amd';
  
  // 读取配置文件
  const configPath = CONFIG_FILE;
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const vpns = cfg.vpns || [];

  const services = {};
  const vpnServiceNames = [];

  for (const v of vpns) {
    const name = v.name;
    const serviceName = name;
    vpnServiceNames.push(serviceName);

    const server = v.server;
    const user = v.user;
    const pwd = v.pass;
    const ecVer = v.ec_ver || '7.6.7';

    // 对密码做安全转义，防止特殊字符被 shell 解析
    // 注意：这里转义后的字符串会作为环境变量的值
    // 当容器内程序读取环境变量时，会得到转义后的字符串，然后可以安全地传递给 shell
    const pwdEscaped = shellQuote(pwd);
    const cliOpts = `-d ${server} -u ${user} -p ${pwdEscaped}`;

    const serviceConfig = {
      image: 'docker-easyconnect-cli', // 使用镜像，不 build
      container_name: serviceName,
      privileged: true,
      devices: ['/dev/net/tun'],
      cap_add: ['NET_ADMIN'],
      volumes: ['../configs/kubeconfig:/kubeconfig'],
      environment: {
        EC_VER: ecVer,
        CLI_OPTS: cliOpts
      },
      networks: ['net']
    };
    
    if (usePlatform) {
      serviceConfig.platform = 'linux/amd64';
    }
    services[serviceName] = serviceConfig;
  }

  // default 无需vpn时，使用的cli
  const defaultConfig = {
    image: 'docker-default-cli',
    container_name: 'docker-default-cli',
    privileged: true,
    devices: ['/dev/net/tun'],
    cap_add: ['NET_ADMIN'],
    volumes: ['../configs/kubeconfig:/kubeconfig'],
    networks: ['net']
  };
  
  if (usePlatform) {
    defaultConfig.platform = 'linux/amd64';
  }
  services.default = defaultConfig;

  // Python deploy_api 服务，使用宿主机 Docker Socket
  const deployApiConfig = {
    image: 'docker-deploy-server', // 使用镜像，不 build
    container_name: 'deploy_api',
    ports: ['9090:9090'], // 修改端口映射
    volumes: ['/var/run/docker.sock:/var/run/docker.sock'], // 挂载宿主机 Docker
    depends_on: vpnServiceNames,
    networks: ['net']
  };
  
  if (usePlatform) {
    deployApiConfig.platform = 'linux/amd64';
  }
  services.deploy_api = deployApiConfig;

  const compose = {
    version: '3.9',
    name: 'docker-deploy-server',
    services: services,
    networks: { net: { driver: 'bridge' } }
  };

  // 生成 YAML，然后手动处理 CLI_OPTS 的格式
  // 使用 quotingType: '"' 和 forceQuotes: false 来避免不必要的引号
  let yamlStr = yaml.dump(compose, { 
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
    lineWidth: -1  // 不限制行宽
  });
  
  // 替换 CLI_OPTS 的格式，将引号包裹的格式改为直接输出
  // 匹配模式: CLI_OPTS: '...' 或 CLI_OPTS: "..."
  // 替换为: CLI_OPTS: ... (去掉外层引号，但保留内部的单引号)
  yamlStr = yamlStr.replace(
    /(\s+CLI_OPTS:\s+)(['"])(.*?)\2/g,
    (match, prefix, quote, content) => {
      // 将 YAML 转义的单引号 '' 还原为单个 '
      const unescaped = content.replace(/''/g, "'");
      return prefix + unescaped;
    }
  );
  
  fs.writeFileSync(OUTPUT_FILE, yamlStr, 'utf8');
  console.log(`生成 ${OUTPUT_FILE} 完成：包含 ${vpns.length} 个 VPN 服务 + deploy_api`);
}

if (require.main === module) {
  main();
}
