jest.mock('sanitize-html', () => {
  const sanitize = (str: string, _opts: unknown) => {
    let result = str;
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    result = result.replace(/<[^>]*>/g, '');
    return result.trim();
  };
  return Object.assign(sanitize, { __esModule: true, default: sanitize });
});

import { SanitizarPipe } from './sanitizar.pipe';

describe('SanitizarPipe', () => {
  let pipe: SanitizarPipe;

  beforeEach(() => {
    pipe = new SanitizarPipe();
  });

  it('strips HTML tags from a string', () => {
    const result = pipe.transform("<script>alert('xss')</script>Hello");
    expect(result).toBe('Hello');
  });

  it('strips all HTML tags', () => {
    const result = pipe.transform('<b>bold</b>');
    expect(result).toBe('bold');
  });

  it('recursively sanitizes object properties', () => {
    const input = { name: '<b>Juan</b>', bio: '<i>texto</i>' };
    const result = pipe.transform(input) as Record<string, string>;
    expect(result.name).toBe('Juan');
    expect(result.bio).toBe('texto');
  });

  it('recursively sanitizes nested objects', () => {
    const input = {
      user: {
        name: '<i>Ana</i>',
        details: { city: '<p>México</p>' },
      },
    };
    const result = pipe.transform(input) as any;
    expect(result.user.name).toBe('Ana');
    expect(result.user.details.city).toBe('México');
  });

  it('sanitizes array elements', () => {
    const input = ['<a>link1</a>', '<b>bold2</b>', '<i>text3</i>'];
    const result = pipe.transform(input) as string[];
    expect(result).toEqual(['link1', 'bold2', 'text3']);
  });

  it('returns non-string primitives unchanged', () => {
    expect(pipe.transform(42)).toBe(42);
    expect(pipe.transform(true)).toBe(true);
    expect(pipe.transform(null)).toBe(null);
    expect(pipe.transform(undefined)).toBe(undefined);
  });

  it('sanitizes deeply nested structures', () => {
    const input = {
      level1: [
        {
          level2: '<b>a</b>',
          items: ['<b>b</b>', '<i>c</i>'],
        },
      ],
    };
    const result = pipe.transform(input) as any;
    expect(result.level1[0].level2).toBe('a');
    expect(result.level1[0].items).toEqual(['b', 'c']);
  });
});
