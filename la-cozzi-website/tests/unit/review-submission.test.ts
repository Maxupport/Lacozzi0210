import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateReviewSubmission } from '../../src/lib/review-submission';

const validSubmission = {
  name: '陳小姐',
  email: 'guest@example.com',
  tag: '婚禮晚宴',
  stars: 5,
  comment: '當天的演出氣氛非常好，謝謝你們！',
  website: '',
};

describe('公開評價送出驗證', () => {
  it('接受合法內容並清除前後空白', () => {
    const result = validateReviewSubmission({ ...validSubmission, name: '  陳小姐  ' });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.name, '陳小姐');
  });

  it('拒絕缺少必要欄位與超長內容', () => {
    assert.equal(validateReviewSubmission({ ...validSubmission, name: '' }).ok, false);
    assert.equal(validateReviewSubmission({ ...validSubmission, comment: '' }).ok, false);
    assert.equal(validateReviewSubmission({ ...validSubmission, comment: '字'.repeat(2001) }).ok, false);
    assert.equal(validateReviewSubmission({ ...validSubmission, tag: '字'.repeat(51) }).ok, false);
  });

  it('拒絕非整數或範圍外星等', () => {
    for (const stars of [0, 6, 4.5, '5', null]) {
      assert.equal(validateReviewSubmission({ ...validSubmission, stars }).ok, false);
    }
  });

  it('拒絕不合法電子郵件並允許空白選填值', () => {
    assert.equal(validateReviewSubmission({ ...validSubmission, email: 'not-an-email' }).ok, false);
    const result = validateReviewSubmission({ ...validSubmission, email: '' });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.email, null);
  });

  it('保留蜜罐欄位供路由判斷', () => {
    const result = validateReviewSubmission({ ...validSubmission, website: 'https://spam.example' });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.website, 'https://spam.example');
  });
});
