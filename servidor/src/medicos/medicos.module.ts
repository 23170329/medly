import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicosService } from './medicos.service';
import { MedicosController } from './medicos.controller';
import { Medico } from './entities/medico.entity'; // <-- Importa tu entidad
import { Calificacion } from './entities/calificacion.entity';

@Module({
  // Tienes que agregar esta línea en los imports:
  imports: [TypeOrmModule.forFeature([Medico, Calificacion])], 
  controllers: [MedicosController],
  providers: [MedicosService],
  exports: [MedicosService], // Exportarlo es buena idea por si el módulo de Citas necesita buscar médicos
})
export class MedicosModule {}