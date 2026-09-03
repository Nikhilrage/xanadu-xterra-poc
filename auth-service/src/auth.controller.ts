import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('login')
  login(@Payload() dto: any) {
    return this.authService.login(dto);
  }

  @MessagePattern('register')
  register(@Payload() dto: any) {
    return this.authService.register(dto);
  }

  @MessagePattern('get_all_users')
  getUsers() {
    return this.authService.getUsers();
  }

  @MessagePattern('register_developer')
  registerDeveloper() {
    return 'this.authService.registerDeveloper(dto);';
  }

  @MessagePattern('remove_registered_user')
  removeRegisteredUser(@Payload() dto: any) {
    return this.authService.removeRegisteredUser(dto.userId);
  }

  @MessagePattern('get_user_profiles')
  getUserProfiles(@Payload() dto: any) {
    return this.authService.getUserProfiles(dto.userIds);
  }
}
