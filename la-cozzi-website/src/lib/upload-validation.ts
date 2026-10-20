export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

export const ALLOWED_UPLOAD_FOLDERS = new Set(['articles', 'covers', 'partners']);

function matches(buffer: Uint8Array, offset: number, bytes: number[]) {
  return bytes.every((byte, index) => buffer[offset + index] === byte);
}

function ascii(buffer: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...buffer.slice(offset, offset + length));
}

export function hasValidImageSignature(contentType: string, buffer: Uint8Array) {
  if (contentType === 'image/jpeg') {
    return buffer.length >= 3 && matches(buffer, 0, [0xff, 0xd8, 0xff]);
  }

  if (contentType === 'image/png') {
    return buffer.length >= 8 && matches(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  }

  if (contentType === 'image/gif') {
    if (buffer.length < 6) return false;
    const header = ascii(buffer, 0, 6);
    return header === 'GIF87a' || header === 'GIF89a';
  }

  if (contentType === 'image/webp') {
    return buffer.length >= 12 && ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 4) === 'WEBP';
  }

  if (contentType === 'image/avif') {
    if (buffer.length < 16 || ascii(buffer, 4, 4) !== 'ftyp') return false;
    const brands = ascii(buffer, 8, Math.min(buffer.length - 8, 32));
    return brands.includes('avif') || brands.includes('avis');
  }

  return false;
}
