'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'

export const QR_URL = 'https://worldcup-vote-ochre.vercel.app'

const QR_COLORS: Record<number, string | null> = {
  0: null, 1: '#1a0000', 2: '#CC0000', 4: '#ffffff', 5: '#FFD700',
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

const CANVAS_SIZE = 282
const PS = 6

export default function QrSidebar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [onlineCount, setOnlineCount] = useState(1)
  const presenceKey = useRef(Math.random().toString(36).slice(2, 10))

  // QR + 붉은악마 캔버스
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    QRCode.toDataURL(QR_URL, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: CANVAS_SIZE,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    }).then((dataUrl) => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
        const rows = DEVIL.length, cols = DEVIL[0].length
        const dw = cols * PS, dh = rows * PS
        const sx = Math.floor((CANVAS_SIZE - dw) / 2)
        const sy = Math.floor((CANVAS_SIZE - dh) / 2)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(sx - PS, sy - PS, dw + PS * 2, dh + PS * 2)
        DEVIL.forEach((row, y) => {
          row.forEach((p, x) => {
            const color = QR_COLORS[p]
            if (color) {
              ctx.fillStyle = color
              ctx.fillRect(sx + x * PS, sy + y * PS, PS, PS)
            }
          })
        })
      }
      img.src = dataUrl
    })
  }, [])

  // Supabase Presence — 전체 페이지 접속자 수 실시간 추적
  useEffect(() => {
    const channel = supabase.channel('site-presence')
    channel
      .on('presence', { event: 'sync' }, () => {
        const count = Object.keys(channel.presenceState()).length
        setOnlineCount(Math.max(1, count))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ uid: presenceKey.current })
        }
      })
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(QR_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // 붉은악마 얼굴 중앙 좌표
  const devilCols = DEVIL[0].length, devilRows = DEVIL.length
  const devilCenterX = Math.floor((CANVAS_SIZE - devilCols * PS) / 2) + Math.floor((devilCols * PS) / 2)
  const devilCenterY = Math.floor((CANVAS_SIZE - devilRows * PS) / 2) + Math.floor((devilRows * PS) / 2)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ background: '#CC0000', padding: '10px 12px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 12, margin: 0 }}>친구 초대하기</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: '2px 0 0' }}>QR 스캔으로 바로 참여</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 14px 10px', background: '#fff', position: 'relative' }}>
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ display: 'block' }} />

        {/* 접속자 수 — 붉은악마 얼굴 중앙에 오버레이 */}
        <div style={{
          position: 'absolute',
          left: 14 + devilCenterX,
          top: 14 + devilCenterY,
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.93)',
          border: '2px solid #CC0000',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 1px 8px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#CC0000', lineHeight: 1 }}>{onlineCount}</span>
          <span style={{ fontSize: 7, color: '#888', lineHeight: 1, marginTop: 1 }}>접속중</span>
        </div>
      </div>

      <div style={{ padding: '10px 12px', textAlign: 'center', borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 10, color: '#999', margin: '0 0 8px', wordBreak: 'break-all', lineHeight: 1.4 }}>
          worldcup-vote-ochre.vercel.app
        </p>
        <button
          onClick={handleCopy}
          style={{
            fontSize: 11, padding: '5px 14px', borderRadius: 7,
            border: '0.5px solid rgba(0,0,0,0.18)', background: '#fff', cursor: 'pointer', width: '100%',
          }}
        >
          {copied ? '복사됨 ✓' : '링크 복사'}
        </button>
      </div>
    </div>
  )
}
