import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApprovalController } from "./approval.controller";
import { ApprovalService } from "./approval.service";
import { FlowableClient } from "./flowable.client";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService, FlowableClient],
})
export class AppModule {}
