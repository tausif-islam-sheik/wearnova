import { BadRequestException } from '@nestjs/common';

/** URL-safe slug: lowercase, ascii letters/digits separated by single dashes. */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Trims and validates a required text field, returning the clean value. */
export function requireText(value: unknown, label: string, max: number): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) throw new BadRequestException(`${label} is required`);
  if (text.length > max) throw new BadRequestException(`${label} must be at most ${max} characters`);
  return text;
}
