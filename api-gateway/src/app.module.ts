import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './services/auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt/jwt.strategy';
import { ConfigModule } from '@nestjs/config';
import { OrgModule } from './services/org/org.module';
import { ProjectModule } from './services/project/project.module';
import { AgentModule } from './services/agent/agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    AuthModule,
    OrgModule,
    ProjectModule,
    AgentModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
