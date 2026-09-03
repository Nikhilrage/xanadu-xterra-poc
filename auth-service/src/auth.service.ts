import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './database/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  generateToken(user: any) {
    return this.jwtService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }

  getUserProfile(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async register(data: any) {
    const existingUser = await this.userRepository.findOne({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      return {
        message: 'User already exists',
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.userRepository.save({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    const accessToken = this.generateToken(user);

    return {
      message: 'User registered successfully',
      accessToken,
      user: this.getUserProfile(user),
    };
  }

  async login(data: any) {
    const user = await this.userRepository.findOne({
      where: {
        email: data.email,
      },
    });

    if (!user) {
      return {
        message: 'Invalid email or password',
      };
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      return {
        message: 'Invalid email or password',
      };
    }

    const accessToken = this.generateToken(user);

    return {
      message: 'Login successful',
      accessToken,
      user: this.getUserProfile(user),
    };
  }

  async getUsers() {
    return this.userRepository.find();
  }

  async removeRegisteredUser(userId: string) {
    await this.userRepository.delete(userId);

    return {
      message: 'Registered user removed successfully',
    };
  }

  async getUserProfiles(userIds: string[]) {
    if (!userIds?.length) {
      return [];
    }

    const users = await this.userRepository.findBy({
      id: In(userIds),
    });

    return users.map((user) => this.getUserProfile(user));
  }
}
