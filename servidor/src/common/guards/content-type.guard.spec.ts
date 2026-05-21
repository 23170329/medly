import { BadRequestException, ExecutionContext } from '@nestjs/common';
import { ContentTypeGuard } from './content-type.guard';

describe('ContentTypeGuard', () => {
  let guard: ContentTypeGuard;

  beforeEach(() => {
    guard = new ContentTypeGuard();
  });

  function createMockContext(method: string, contentType?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          headers: { 'content-type': contentType },
        }),
      }),
    } as ExecutionContext;
  }

  describe('GET / DELETE (no content-type check)', () => {
    it('GET request without Content-Type returns true', () => {
      const ctx = createMockContext('GET');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('DELETE request without Content-Type returns true', () => {
      const ctx = createMockContext('DELETE');
      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('POST', () => {
    it('POST with application/json returns true', () => {
      const ctx = createMockContext('POST', 'application/json');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('POST without application/json throws BadRequestException', () => {
      const ctx = createMockContext('POST', 'text/plain');
      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('PATCH', () => {
    it('PATCH with application/json returns true', () => {
      const ctx = createMockContext('PATCH', 'application/json');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('PATCH without application/json throws BadRequestException', () => {
      const ctx = createMockContext('PATCH', 'text/plain');
      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });

  describe('PUT', () => {
    it('PUT with application/json returns true', () => {
      const ctx = createMockContext('PUT', 'application/json');
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('PUT without application/json throws BadRequestException', () => {
      const ctx = createMockContext('PUT', 'text/plain');
      expect(() => guard.canActivate(ctx)).toThrow(BadRequestException);
    });
  });
});
