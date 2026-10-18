import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  isValidSlug,
  getYouTubeId,
  getYouTubePlaylistId,
  formatDate,
} from '../../src/lib/utils';

describe('utils: slugify', () => {
  it('將英文大寫轉換為小寫', () => {
    assert.strictEqual(slugify('HELLO WORLD'), 'hello-world');
    assert.strictEqual(slugify('La Cozzi Wedding Band'), 'la-cozzi-wedding-band');
  });

  it('保留中文字元', () => {
    assert.strictEqual(slugify('拉釦子樂團'), '拉釦子樂團');
    assert.strictEqual(slugify('拉釦子樂團 La Cozzi'), '拉釦子樂團-la-cozzi');
    assert.strictEqual(slugify('2026 台北春季音樂祭推薦'), '2026-台北春季音樂祭推薦');
  });

  it('將空白與一般符號轉換為連字號', () => {
    assert.strictEqual(slugify('wedding   music + band'), 'wedding-music-band');
    assert.strictEqual(slugify('pop_rock*live'), 'pop-rock-live');
    assert.strictEqual(slugify('jazz, soul & funk'), 'jazz-soul-funk');
  });

  it('移除危險或不適合網址的特殊字元', () => {
    // 移除 [?#&/\\%'"<>]
    assert.strictEqual(slugify('song?#&/\\%\'\"<>title'), 'songtitle');
    assert.strictEqual(slugify('test<script>alert</script>'), 'testscriptalertscript');
    assert.strictEqual(slugify('a?b#c&d/e\\f%g\'h"i<j>k'), 'abcdefghijk');
  });

  it('開頭與結尾不留下連字號', () => {
    assert.strictEqual(slugify('-prefix-suffix-'), 'prefix-suffix');
    assert.strictEqual(slugify('   hello world   '), 'hello-world');
    assert.strictEqual(slugify('---test-slug---'), 'test-slug');
    assert.strictEqual(slugify('***heading***'), 'heading');
  });

  it('輸出長度不超過既有 80 字元限制', () => {
    const longInput = 'a'.repeat(120);
    const result = slugify(longInput);
    assert.strictEqual(result.length, 80);
    assert.strictEqual(result, 'a'.repeat(80));

    const mixedLong = '拉釦子樂團演出紀錄'.repeat(10);
    const mixedResult = slugify(mixedLong);
    assert.ok(mixedResult.length <= 80);
  });

  it('支援 Unicode NFKC 正規化行為', () => {
    // 全形數字與英文字母轉為半形
    assert.strictEqual(slugify('１２３４５'), '12345');
    assert.strictEqual(slugify('ＷＥＤＤＩＮＧ'), 'wedding');
    // 相容字元分解
    assert.strictEqual(slugify('①②③'), '123');
    // 重音組合字元規範化
    assert.strictEqual(slugify('\u0041\u030a'), 'å');
  });
});

describe('utils: isValidSlug', () => {
  it('合法的英文網址代稱應通過驗證', () => {
    assert.strictEqual(isValidSlug('valid-slug-123'), true);
    assert.strictEqual(isValidSlug('wedding-band-live-performance'), true);
    assert.strictEqual(isValidSlug('a'), true);
  });

  it('合法的中文網址代稱應通過驗證', () => {
    assert.strictEqual(isValidSlug('拉釦子樂團'), true);
    assert.strictEqual(isValidSlug('婚禮樂團-2026'), true);
    assert.strictEqual(isValidSlug('專業現場演出-經典爵士'), true);
  });

  it('空字串應驗證失敗', () => {
    assert.strictEqual(isValidSlug(''), false);
  });

  it('含有空白字元應驗證失敗', () => {
    assert.strictEqual(isValidSlug('invalid slug'), false);
    assert.strictEqual(isValidSlug(' '), false);
    assert.strictEqual(isValidSlug(' leading-space'), false);
    assert.strictEqual(isValidSlug('trailing-space '), false);
    assert.strictEqual(isValidSlug('inner\tspace'), false);
  });

  it('含有危險或非代稱字元（/、?、#、%、引號、角括號等）應驗證失敗', () => {
    assert.strictEqual(isValidSlug('slug/test'), false);
    assert.strictEqual(isValidSlug('slug\\test'), false);
    assert.strictEqual(isValidSlug('slug?query'), false);
    assert.strictEqual(isValidSlug('slug#anchor'), false);
    assert.strictEqual(isValidSlug('slug%20encoded'), false);
    assert.strictEqual(isValidSlug('slug"quote'), false);
    assert.strictEqual(isValidSlug("slug'quote"), false);
    assert.strictEqual(isValidSlug('slug<tag>'), false);
    assert.strictEqual(isValidSlug('slug&param'), false);
  });

  it('長度超過 100 字元應驗證失敗', () => {
    assert.strictEqual(isValidSlug('a'.repeat(100)), true);
    assert.strictEqual(isValidSlug('a'.repeat(101)), false);
  });
});

describe('utils: getYouTubeId', () => {
  const dummyId = 'dummyVid123';

  it('正確解析 youtube.com/watch?v= 網址', () => {
    assert.strictEqual(getYouTubeId(`https://youtube.com/watch?v=${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`http://youtube.com/watch?v=${dummyId}&t=30s`), dummyId);
  });

  it('正確解析 youtu.be/ 短網址', () => {
    assert.strictEqual(getYouTubeId(`https://youtu.be/${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://youtu.be/${dummyId}?t=15`), dummyId);
  });

  it('正確解析 youtube.com/embed/ 內嵌網址', () => {
    assert.strictEqual(getYouTubeId(`https://youtube.com/embed/${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://youtube.com/embed/${dummyId}?autoplay=1`), dummyId);
  });

  it('正確解析 youtube.com/shorts/ 短影音網址', () => {
    assert.strictEqual(getYouTubeId(`https://youtube.com/shorts/${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://youtube.com/shorts/${dummyId}?feature=share`), dummyId);
  });

  it('正確解析 youtube.com/live/ 直播網址', () => {
    assert.strictEqual(getYouTubeId(`https://youtube.com/live/${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://youtube.com/live/${dummyId}?feature=share`), dummyId);
  });

  it('正確解析 youtube-nocookie.com/embed/ 隱私強化內嵌網址', () => {
    assert.strictEqual(getYouTubeId(`https://youtube-nocookie.com/embed/${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://youtube-nocookie.com/embed/${dummyId}?rel=0`), dummyId);
  });

  it('正確支援 www.youtube.com 與 m.youtube.com 子網域', () => {
    assert.strictEqual(getYouTubeId(`https://www.youtube.com/watch?v=${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://m.youtube.com/watch?v=${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://www.youtube.com/embed/${dummyId}`), dummyId);
    assert.strictEqual(getYouTubeId(`https://m.youtube.com/shorts/${dummyId}`), dummyId);
  });

  it('處理空值與純空白字串回傳空字串', () => {
    assert.strictEqual(getYouTubeId(''), '');
    assert.strictEqual(getYouTubeId(null), '');
    assert.strictEqual(getYouTubeId(undefined), '');
    assert.strictEqual(getYouTubeId('   '), '');
  });

  it('處理無效網址回傳空字串', () => {
    assert.strictEqual(getYouTubeId('not-a-valid-url'), '');
    assert.strictEqual(getYouTubeId('http://'), '');
    assert.strictEqual(getYouTubeId('https:///watch?v=123'), '');
  });

  it('非 YouTube 網域回傳空字串', () => {
    assert.strictEqual(getYouTubeId(`https://vimeo.com/${dummyId}`), '');
    assert.strictEqual(getYouTubeId(`https://example.com/watch?v=${dummyId}`), '');
    assert.strictEqual(getYouTubeId(`https://dailymotion.com/video/${dummyId}`), '');
  });

  it('外觀類似但非 YouTube 官方網域不得被接受', () => {
    assert.strictEqual(getYouTubeId(`https://notyoutube.com/watch?v=${dummyId}`), '');
    assert.strictEqual(getYouTubeId(`https://youtube.com.attacker.com/watch?v=${dummyId}`), '');
    assert.strictEqual(getYouTubeId(`https://fake-youtube.com/embed/${dummyId}`), '');
    assert.strictEqual(getYouTubeId(`https://myoutube.com/watch?v=${dummyId}`), '');
    assert.strictEqual(getYouTubeId(`https://fakeno-cookie.com/embed/${dummyId}`), '');
  });
});

describe('utils: getYouTubePlaylistId', () => {
  const dummyListId = 'PLtestPlaylist1234567890';

  it('傳入原始播放清單 ID 直接回傳', () => {
    assert.strictEqual(getYouTubePlaylistId(dummyListId), dummyListId);
    assert.strictEqual(getYouTubePlaylistId(`  ${dummyListId}  `), dummyListId);
  });

  it('從 YouTube 播放清單網址解析 list 參數', () => {
    assert.strictEqual(
      getYouTubePlaylistId(`https://www.youtube.com/playlist?list=${dummyListId}`),
      dummyListId
    );
  });

  it('從 Watch 播放網址解析 list 參數', () => {
    assert.strictEqual(
      getYouTubePlaylistId(`https://www.youtube.com/watch?v=dummyVid123&list=${dummyListId}`),
      dummyListId
    );
  });

  it('空值回傳空字串', () => {
    assert.strictEqual(getYouTubePlaylistId(''), '');
    assert.strictEqual(getYouTubePlaylistId(null), '');
    assert.strictEqual(getYouTubePlaylistId(undefined), '');
  });

  it('無效網址回傳空字串', () => {
    assert.strictEqual(getYouTubePlaylistId('https://:invalid-port/test'), '');
    assert.strictEqual(getYouTubePlaylistId('http://bad url with spaces'), '');
  });

  it('沒有 list 參數的網址回傳空字串', () => {
    assert.strictEqual(
      getYouTubePlaylistId('https://www.youtube.com/watch?v=dummyVid123'),
      ''
    );
    assert.strictEqual(
      getYouTubePlaylistId('https://www.youtube.com/playlist'),
      ''
    );
  });
});

describe('utils: formatDate', () => {
  it('傳入空值或無效值回傳空字串', () => {
    assert.strictEqual(formatDate(''), '');
    assert.strictEqual(formatDate(null), '');
    assert.strictEqual(formatDate(undefined), '');
  });

  it('正確格式化 ISO 時間字串', () => {
    // 台北時區固定時間測試
    assert.strictEqual(formatDate('2026-05-20T10:00:00.000Z'), '2026/05/20');
  });

  it('正確格式化 Date 物件', () => {
    const testDate = new Date('2026-05-20T10:00:00.000Z');
    assert.strictEqual(formatDate(testDate), '2026/05/20');
  });

  it('嚴格以 Asia/Taipei 時區處理日期換日，不受主機本地時區影響', () => {
    // UTC 2026-05-20 18:00:00 在 Asia/Taipei (UTC+8) 為 2026-05-21 02:00:00
    assert.strictEqual(formatDate('2026-05-20T18:00:00.000Z'), '2026/05/21');

    // UTC 2026-12-31 20:00:00 在 Asia/Taipei (UTC+8) 為 2027-01-01 04:00:00
    assert.strictEqual(formatDate('2026-12-31T20:00:00.000Z'), '2027/01/01');

    // UTC 2026-06-01 00:00:00 在 Asia/Taipei 為 2026-06-01 08:00:00
    assert.strictEqual(formatDate('2026-06-01T00:00:00.000Z'), '2026/06/01');
  });
});
