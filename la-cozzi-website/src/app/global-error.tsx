'use client';

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>網站暫時發生問題 | La Cozzi 拉釦子樂團</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: '24px',
          minHeight: '100vh',
          backgroundColor: '#0c0a09',
          color: '#fafaf9',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <main
          style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            backgroundColor: '#1c1917',
            border: '1px solid #292524',
            borderRadius: '16px',
            padding: '36px 24px',
            boxSizing: 'border-box',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              fontSize: '24px',
              fontWeight: 'bold',
              lineHeight: '56px',
              margin: '0 auto 20px',
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            !
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#f5f5f4',
              margin: '0 0 12px',
              letterSpacing: '-0.025em',
            }}
          >
            網站暫時發生問題
          </h1>
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: '#a8a29e',
              margin: '0 0 28px',
            }}
          >
            我們正在努力恢復服務，請稍後再試。
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#f59e0b',
                color: '#0c0a09',
                fontWeight: 600,
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              重新嘗試
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: '#292524',
                color: '#e7e5e4',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              回到首頁
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
