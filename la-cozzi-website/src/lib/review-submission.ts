export const MAX_REVIEW_BODY_BYTES = 16 * 1024;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ReviewSubmission = {
  name: string;
  email: string | null;
  tag: string;
  stars: number;
  comment: string;
  website: string;
};

type ValidationResult =
  | { ok: true; value: ReviewSubmission }
  | { ok: false; error: string };

export function validateReviewSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: '送出內容格式不正確' };
  }

  const body = input as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  const tag = typeof body.tag === 'string' ? body.tag.trim() : '婚禮晚宴';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const website = typeof body.website === 'string' ? body.website.trim() : '';

  if (!name) return { ok: false, error: '請填寫您的稱呼' };
  if (name.length > 50) return { ok: false, error: '稱呼長度過長' };
  if (!comment) return { ok: false, error: '請填寫您的回饋心得' };
  if (comment.length > 2000) return { ok: false, error: '評論長度超出限制' };
  if (!tag || tag.length > 50) return { ok: false, error: '演出場合格式不正確' };

  if (!Number.isInteger(body.stars) || Number(body.stars) < 1 || Number(body.stars) > 5) {
    return { ok: false, error: '星等必須介於 1 到 5 顆星' };
  }

  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    return { ok: false, error: '電子郵件格式不正確' };
  }

  return {
    ok: true,
    value: {
      name,
      email: email || null,
      tag,
      stars: Number(body.stars),
      comment,
      website,
    },
  };
}
