import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './entities/user.entity';
import { UserRole } from './enums';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; user: UserResponse }> {
    const { email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName: firstName,
      lastName: lastName,
      role,
    });

    await this.userRepository.save(user);

    // Generate JWT token
    const accessToken = this.generateToken(user);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { accessToken, user: userWithoutPassword };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: UserResponse }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate JWT token
    const accessToken = this.generateToken(user);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return { accessToken, user: userWithoutPassword };
  }

  async validateUser(userId: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private generateToken(user: UserEntity): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  async changeRole(userId: string, newRole: UserRole): Promise<UserResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.role = newRole;
    await this.userRepository.save(user);

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
