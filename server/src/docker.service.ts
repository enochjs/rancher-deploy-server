import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

@Injectable()
export class DockerService {
  /**
   * 获取当前运行的容器列表
   */
  async listContainers(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(
        'docker ps --format "{{.Names}}"',
        { maxBuffer: 1024 * 1024 }
      );
      return stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch (error) {
      return [];
    }
  }

  async getVpn(platform: string): Promise<any> {
    const configPath = join(__dirname, 'config.json');
    const config = readFileSync(configPath, 'utf8');
    const configData = JSON.parse(config);
    const vpn = configData.vpns.find((v: any) => v.name === platform);
    return vpn;
  }

  /**
   * 执行部署命令
   */
  async deployVpn(
    platform: string,
    deployEnv: string,
    deployKey: string,
    imageVersion: string,
    namespace: string,
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    const vpn = await this.getVpn(platform);
    const dockerName = vpn ? platform : 'docker-default-cli';

    const platformName = platform.replace('vpn_', '');
    const cmd = [
      'docker',
      'exec',
      dockerName,
      'bash',
      '/usr/local/bin/deploy.sh',
      platformName,
      deployEnv,
      deployKey,
      imageVersion,
      namespace,
    ].join(' ');

    try {
      const { stdout } = await execAsync(cmd, {
        maxBuffer: 10 * 1024 * 1024, // 10MB
        timeout: 1200000, // 20 minutes
      });
      return {
        success: true,
        output: stdout,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.stdout || error.stderr || error.message || 'deploy failed',
      };
    }
  }

  /**
   * Ping VPN 容器
   */
  async pingVpn(platform: string): Promise<{
    success: boolean;
    server?: string;
    error?: string;
  }> {
    const containers = await this.listContainers();
    if (!containers.includes(platform)) {
      return {
        success: false,
        error: `container ${platform} not running`,
      };
    }

    try {
      // 根据 platform 从config.json 中读取server
      const vpn = await this.getVpn(platform);
      if (!vpn) {
        return {
          success: false,
          error: `vpn ${platform} not found`,
        };
      }

      const vpnServer = vpn.server;
      const vpnHost = vpnServer.split(':')[0];
      // 在容器内部 ping VPN 地址
      try {
        await execAsync(
          `docker exec ${platform} ping -c 2 -W 2 ${vpnHost}`,
          { maxBuffer: 1024 * 1024 }
        );
        return {
          success: true,
          server: vpnServer,
        };
      } catch (pingError) {
        return {
          success: false,
          server: vpnServer,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }
}
