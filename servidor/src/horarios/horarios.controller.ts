import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HorariosService } from './horarios.service';

@ApiTags('horarios')
@Controller('horarios')
export class HorariosController {
  constructor(private readonly svc: HorariosService) {}

  @Get('disponibles')
  async disponibles(
    @Query('medicoId') medicoId: string,
    @Query('sucursalId') sucursalId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const mid = parseInt(medicoId, 10);
    const sid = parseInt(sucursalId, 10);
    if (!mid || !sid) {
      throw new BadRequestException('medicoId y sucursalId son obligatorios');
    }
    const d = desde ? new Date(desde) : undefined;
    const h = hasta ? new Date(hasta) : undefined;
    return this.svc.disponiblesRangoQuery({
      medicoId: mid,
      sucursalId: sid,
      desde: d,
      hasta: h,
    });
  }
}
