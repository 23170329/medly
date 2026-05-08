import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { PagosService } from './pagos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CheckoutSessionDto } from './dto/checkout-session.dto';

@ApiTags('pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post('checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CheckoutSessionDto,
  ) {
    return this.pagosService.crearCheckoutSession(user.sub, dto.citaID);
  }

  @Post('webhook')
  async webhook(@Req() req: Request, @Res() res: Response) {
    await this.pagosService.procesarWebhook(req, res);
  }

  @Get('redirect/exito')
  redirectExito(@Query('session_id') sessionId: string, @Res() res: Response) {
    const html = this.pagosService.redirectExitoHtml(sessionId ?? '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('redirect/cancelado')
  redirectCancelado(
    @Query('cita_id') citaId: string,
    @Res() res: Response,
  ) {
    const html = this.pagosService.redirectCanceladoHtml(citaId ?? '');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
