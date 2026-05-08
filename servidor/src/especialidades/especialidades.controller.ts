import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EspecialidadesService } from './especialidades.service';

@ApiTags('especialidades')
@Controller('especialidades')
export class EspecialidadesController {
  constructor(private readonly svc: EspecialidadesService) {}

  @Get()
  listar() {
    return this.svc.listar();
  }
}
