import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALLOWED_UPLOAD_FOLDERS,
  ALLOWED_UPLOAD_TYPES,
  hasValidImageSignature,
} from '../../src/lib/upload-validation';

const bytes = (value: string) => new Uint8Array([...value].map((char) => char.charCodeAt(0)));

describe('上傳圖片內容驗證', () => {
  it('僅允許後台實際使用的資料夾', () => {
    assert.deepEqual([...ALLOWED_UPLOAD_FOLDERS].sort(), ['articles', 'covers', 'partners']);
  });

  it('不允許可執行腳本的 SVG 格式', () => {
    assert.equal(ALLOWED_UPLOAD_TYPES.has('image/svg+xml'), false);
    assert.equal(hasValidImageSignature('image/svg+xml', bytes('<svg></svg>')), false);
  });

  it('辨識 JPEG、PNG、GIF、WebP 與 AVIF 的檔頭', () => {
    assert.equal(hasValidImageSignature('image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), true);
    assert.equal(
      hasValidImageSignature('image/png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      true
    );
    assert.equal(hasValidImageSignature('image/gif', bytes('GIF89a')), true);
    assert.equal(hasValidImageSignature('image/webp', bytes('RIFF0000WEBP')), true);
    assert.equal(hasValidImageSignature('image/avif', bytes('0000ftypavif0000')), true);
  });

  it('拒絕 MIME 宣告與實際內容不符的檔案', () => {
    const fakeImage = bytes('<script>alert(1)</script>');
    for (const type of ALLOWED_UPLOAD_TYPES) {
      assert.equal(hasValidImageSignature(type, fakeImage), false);
    }
  });
});
