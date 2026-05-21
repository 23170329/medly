import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  it('acepta CURP en el campo correo', async () => {
    const dto = plainToInstance(LoginDto, {
      correo: 'PELJ900101HDFRRN07',
      contrasena: 'Password123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.correo).toBe('PELJ900101HDFRRN07');
  });

  it('acepta teléfono', async () => {
    const dto = plainToInstance(LoginDto, {
      correo: '55-1234-5678',
      contrasena: 'Password123',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.correo).toBe('5512345678');
  });

  it('rechaza valor vacío', async () => {
    const dto = plainToInstance(LoginDto, {
      correo: '   ',
      contrasena: 'x',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
