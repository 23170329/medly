import { Controller } from '@nestjs/common';
import { MedicosService } from './medicos.service';

@Controller('medicos')
export class MedicosController {
  constructor(private readonly medicosService: MedicosService) {}
}
