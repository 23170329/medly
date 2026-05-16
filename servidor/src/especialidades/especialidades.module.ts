import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Especialidad } from './entities/especialidad.entity';
import { EspecialidadesService } from './especialidades.service';
import { EspecialidadesController } from './especialidades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Especialidad])],
  controllers: [EspecialidadesController],
  providers: [EspecialidadesService],
  exports: [EspecialidadesService],
})
export class EspecialidadesModule {}
