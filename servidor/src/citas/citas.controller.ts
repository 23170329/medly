import { Controller } from '@nestjs/common';
import { CitasService } from './citas.service';

@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}
}
