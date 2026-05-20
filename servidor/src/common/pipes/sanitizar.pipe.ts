import { PipeTransform, Injectable } from '@nestjs/common';
import * as sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  stripIgnoreAll: true,
  disallowedTagsMode: 'discard',
};

@Injectable()
export class SanitizarPipe implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value === 'string') {
      return sanitizeHtml(value, SANITIZE_OPTS).trim();
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.transform(v));
    }
    if (value !== null && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeHtml(obj[key] as string, SANITIZE_OPTS).trim();
        } else if (obj[key] !== null && typeof obj[key] === 'object') {
          obj[key] = this.transform(obj[key]);
        }
      }
    }
    return value;
  }
}
