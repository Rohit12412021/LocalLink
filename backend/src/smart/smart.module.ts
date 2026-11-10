import { Module } from '@nestjs/common';

import { SmartController } from './smart.controller';

@Module({
  controllers: [SmartController],
})
export class SmartModule {}
