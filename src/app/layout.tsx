import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '2026 월드컵 한국 경기 예측',
  description: '2026 FIFA 월드컵 그룹 A 한국 경기 스코어 예측 투표',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        {children}
      </body>
    </html>
  )
}
