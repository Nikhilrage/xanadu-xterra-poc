import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectCpAssignment } from './database/project-cp-assignment.entity';
import { Project } from './database/project.entity';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [Project, ProjectCpAssignment],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Project, ProjectCpAssignment]),
    ClientsModule.register([
      {
        name: 'AUTHORIZATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3003,
        },
      },
      {
        name: 'ORG_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3002,
        },
      },
      {
        name: 'AGENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3007,
        },
      },
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class AppModule {}
