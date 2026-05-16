import { IsInt, Min } from 'class-validator';

export class CheckoutSessionDto {
  @IsInt()
  @Min(1)
  citaID!: number;
}
