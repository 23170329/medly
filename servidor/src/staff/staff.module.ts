import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaStaff } from './entities/cuenta-staff.entity';
import { StaffService } from './staff.service';

@Module({
  imports: [TypeOrmModule.forFeature([CuentaStaff])],
  providers: [StaffService],
  exports: [StaffService, TypeOrmModule],
})
export class StaffModule {}
