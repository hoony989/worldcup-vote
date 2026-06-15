'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

const TARGET_URL = 'https://worldcup-vote-ochre.vercel.app'

const COLORS: Record<number, string | null> = {
  0: null,
  1: '#1a0000',
  2: '#CC0000',
  4: '#ffffff',
  5: '#FFD700',
}

const DEVIL = [
  [0,0,0,1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,0],
  [0,0,1,2,2,1,0,0,0,0,0,0,0,1,2,2,1,0,0],
  [0,1,2,2,2,2,1,0,0,0,0,0,1,2,2,2,2,1,0],
  [1,2,2,2,2,2,2,1,0,0,0,1,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,1,1,1,2,2,2,2,2,2,2,1,1,1,2,2,1],
  [1,2,2,1,5,1,2,2,2,2,2,2,2,1,5,1,2,2,1],
  [1,2,2,1,1,1,2,2,2,2,2,2,2,1,1,1,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,1,2,1,2,1,2,1,2,1,2,1,2,2,2,1],
  [1,2,2,2,1,4,1,4,1,4,1,4,1,4,1,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
  [0,0,1,2,2,2,2,2,2,2,2,2,2,2,2,2,1,0,0],
  [0,0,0,1,2,2,2,2,2,2,2,2,2,2,2,1,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
]

export default function QrPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = 280

    QRCode.toDataURL(TARGET_URL, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: size,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    }).then((dataUrl) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size)
        const rows = DEVIL.length
        const cols = DEVIL[0].length
        const ps = 6
        const dw = cols * ps
        const dh = rows * ps
        const sx = Math.floor((size - dw) / 2)
        const sy = Math.floor((size - dh) / 2)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(sx - ps, sy - ps, dw + ps * 2, dh + ps * 2)
        DEVIL.forEach((row, y) => {
          row.forEach((p, x) => {
            const color = COLORS[p]
            if (color) {
              ctx.fillStyle = color
              ctx.fillRect(sx + x * ps, sy + y * ps, ps, ps)
            }
          })
        })
      }
      img.src = dataUrl
    })
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(TARGET_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--background)' }}>
      <div className="card" style={{ maxWidth: 340, width: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#CC0000', padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>
            2026 FIFA 월드컵 — 한국 경기 예측 투표
          </p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '4px 0 0' }}>
            QR 코드를 스캔하면 바로 참여할 수 있어요
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: 20, background: '#fff' }}>
          <canvas ref={canvasRef} width={280} height={280} style={{ display: 'block' }} />
        </div>

        <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '0.5px solid rgba(0,0,0,0.1)' }}>
          <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px', wordBreak: 'break-all' }}>
            worldcup-vote-ochre.vercel.app
          </p>
          <button
            onClick={handleCopy}
            style={{
              fontSize: 12,
              padding: '6px 16px',
              borderRadius: 8,
              border: '0.5px solid rgba(0,0,0,0.2)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {copied ? '복사됨!' : '링크 복사'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
        <a href="/" style={{ color: '#CC0000', textDecoration: 'none' }}>← 투표 페이지로 돌아가기</a>
      </p>
    </main>
  )
}
