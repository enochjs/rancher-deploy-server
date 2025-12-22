import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DockerService } from './docker.service';
import { DeployDto } from './dto/deploy.dto';
import { PingDto } from './dto/ping.dto';

@Controller()
export class AppController {
  constructor(private readonly dockerService: DockerService) {}

  @Post('deploy')
  async deploy(@Body() deployDto: DeployDto) {
    const { platform, env, key, image, namespace } = deployDto;

    if (!platform || !env || !key || !image) {
      throw new BadRequestException({
        error: 'missing required fields: platform, env, key, image',
      });
    }

    const result = await this.dockerService.deployVpn(
      platform,
      env,
      key,
      image,
      namespace,
    );

    if (!result.success) {
      // 容器不存在返回 400，部署失败返回 500
      if (result.error?.includes('not running')) {
        throw new BadRequestException({
          error: result.error,
        });
      }
      throw new InternalServerErrorException({
        success: false,
        error: result.error,
      });
    }

    return {
      success: true,
      output: result.output,
    };
  }

  @Post('ping')
  async ping(@Body() pingDto: PingDto) {
    const { platform } = pingDto;

    if (!platform) {
      throw new BadRequestException({
        error: 'missing platform',
      });
    }

    const result = await this.dockerService.pingVpn(platform);

    // 容器不存在返回 400，其他情况返回 200（根据原 Python 代码逻辑）
    if (!result.success && result.error?.includes('not running')) {
      throw new BadRequestException({
        success: false,
        error: result.error,
      });
    }

    // 解析错误返回 500
    if (!result.success && result.error?.includes('cannot parse')) {
      throw new InternalServerErrorException({
        success: false,
        error: result.error,
      });
    }

    // 其他情况返回 200，包含 ok 和可能的 server/error 字段
    return {
      success: result.success,
      ...(result.server && { server: result.server }),
      ...(result.error && { error: result.error }),
    };
  }

  @Get('health')
  health() {
    return 'ok';
  }
}
