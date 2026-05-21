import { Module } from '@nestjs/common';
import { MedicoPanelController } from './medico-panel.controller';
import { CitasModule } from '../citas/citas.module';
import { HorariosModule } from '../horarios/horarios.module';
import { ConsultasModule } from '../consultas/consultas.module';
import { AuthModule } from '../auth/auth.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    CitasModule,
    HorariosModule,
    ConsultasModule,
    AuthModule,
    AuditoriaModule,
  ],
  controllers: [MedicoPanelController],
})
export class MedicoPanelModule {}
