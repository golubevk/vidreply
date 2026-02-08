import { Controller, Post, Body, UseGuards, Get, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserEntity } from './entities/user.entity';
import { UserRole } from './enums';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  async getProfile(@CurrentUser() user: UserEntity) {
    // Remove password hash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async changeUserRole(@Param('id') userId: string, @Body('role') role: UserRole) {
    return this.authService.changeRole(userId, role);
  }
}
