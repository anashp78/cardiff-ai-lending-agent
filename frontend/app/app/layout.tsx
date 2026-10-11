import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cardiff Demo Agent',
  description: 'AI-native loan review agent — Snowflake + Salesforce + Gmail + Slack + Zoom',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0f1e;
            color: #e2e8f0;
            min-height: 100vh;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
