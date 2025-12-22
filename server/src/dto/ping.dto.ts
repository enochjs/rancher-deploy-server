import { IsString, IsNotEmpty } from 'class-validator';

export class PingDto {
  @IsString()
  @IsNotEmpty()
  platform: string;
}
