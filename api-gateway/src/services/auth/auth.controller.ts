import {
  Body,
  Controller,
  Post,
  Inject,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('AUTH_SERVICE')
    private readonly authClient: ClientProxy,
  ) {}

  @Post('login')
  login(@Body() dto: any) {
    return this.authClient.send('login', dto);
  }

  @Post('register')
  register(@Body() dto: any) {
    return this.authClient.send('register', dto);
  }
  @Get('getAllUsers')
  @UseGuards(JwtAuthGuard)
  getAllUsers(@Req() req: any) {
    console.log(req.user.userId);
    console.log(req.user.role);
    return this.authClient.send('get_all_users', {});
  }

  @Post('register_developer')
  @UseGuards(JwtAuthGuard)
  register_developer(@Body() dto: any) {
    return this.authClient.send('register_developer', dto);
  }
}
