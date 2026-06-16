'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { matches } from '@/lib/matches'
import { Vote } from '@/lib/supabase'

const QR_URL = 'https://worldcup-vote-ochre.vercel.app'
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

const ADMIN_PW = 'korea2026'

type Mood = 'celebration' | 'hopeful' | 'neutral' | 'tense' | 'angry'

const MOOD_CFG: Record<Mood, {
  gradient: string
  emojis: string
  label: string
  sublabel: string
  textColor: string
  subColor: string
  accent: string
  barColorWin: string
}> = {
  celebration: {
    gradient: 'linear-gradient(135deg, #CC0000 0%, #FF6B35 55%, #FFD700 100%)',
    emojis: '🎉🏆⚡🔥',
    label: '붉은악마 파이팅!',
    sublabel: '다수가 한국 승리를 예측 중이에요!',
    textColor: '#fff',
    subColor: 'rgba(255,255,200,0.9)',
    accent: '#FFD700',
    barColorWin: '#FFD700',
  },
  hopeful: {
    gradient: 'linear-gradient(135deg, #CC0000 0%, #8B1A1A 100%)',
    emojis: '🙏💪🇰🇷⚽',
    label: '한국 파이팅!',
    sublabel: '한국 승리 예측이 앞서고 있어요',
    textColor: '#fff',
    subColor: 'rgba(255,200,200,0.85)',
    accent: '#FF9999',
    barColorWin: '#FF8C8C',
  },
  neutral: {
    gradient: 'linear-gradient(135deg, #3a3a3a 0%, #5a5a5a 100%)',
    emojis: '⚽🏟️🎯📊',
    label: '팽팽한 접전!',
    sublabel: '예측이 고르게 나뉘고 있어요',
    textColor: '#fff',
    subColor: 'rgba(255,255,255,0.7)',
    accent: '#ccc',
    barColorWin: '#378ADD',
  },
  tense: {
    gradient: 'linear-gradient(135deg, #1c2b3a 0%, #2c4a6a 100%)',
    emojis: '😰💦🤞😬',
    label: '긴장되는 상황...',
    sublabel: '한국 패배 예측이 늘어나고 있어요',
    textColor: '#d0e8ff',
    subColor: 'rgba(180,210,255,0.8)',
    accent: '#6a9fd8',
    barColorWin: '#378ADD',
  },
  angry: {
    gradient: 'linear-gradient(135deg, #1a0000 0%, #5c0000 55%, #900000 100%)',
    emojis: '😤💢🔥⚡',
    label: '역전을 만들자!',
    sublabel: '대다수가 한국 패배를 예측... 불꽃이 필요해요!',
    textColor: '#ffbbbb',
    subColor: 'rgba(255,160,160,0.85)',
    accent: '#ff5555',
    barColorWin: '#ff5555',
  },
}

function calcMood(matchVotes: Vote[], match: typeof matches[0]): Mood {
  if (match.status === 'done' && match.realScore) {
    const koIsHome = match.home.name === '대한민국'
    const kg = koIsHome ? match.realScore[0] : match.realScore[1]
    const og = koIsHome ? match.realScore[1] : match.realScore[0]
    return kg > og ? 'celebration' : kg < og ? 'angry' : 'neutral'
  }
  if (matchVotes.length === 0) return 'neutral'
  const koIsHome = match.home.name === '대한민국'
  let wins = 0, losses = 0
  matchVotes.forEach(v => {
    const [h, a] = v.score.split('-').map(Number)
    const kg = koIsHome ? h : a, og = koIsHome ? a : h
    if (kg > og) wins++; else if (kg < og) losses++
  })
  const total = matchVotes.length
  if (wins / total >= 0.6) return 'celebration'
  if (wins / total >= 0.4) return 'hopeful'
  if (losses / total >= 0.6) return 'angry'
  if (losses / total >= 0.4) return 'tense'
  return 'neutral'
}

function getWDL(matchVotes: Vote[], match: typeof matches[0]) {
  const koIsHome = match.home.name === '대한민국'
  let w = 0, d = 0, l = 0
  matchVotes.forEach(v => {
    const [h, a] = v.score.split('-').map(Number)
    const kg = koIsHome ? h : a, og = koIsHome ? a : h
    if (kg > og) w++; else if (kg === og) d++; else l++
  })
  const total = matchVotes.length || 1
  return {
    w, d, l,
    wPct: Math.round(w / total * 100),
    dPct: Math.round(d / total * 100),
    lPct: Math.round(l / total * 100),
  }
}

export default function AdminPage() {
  const [pw, setPw] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState(false)
  const [votes, setVotes] = useState<Vote[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchVotes = useCallback(async () => {
    const res = await fetch('/api/votes')
    if (res.ok) setVotes(await res.json())
  }, [])

  useEffect(() => {
    if (authed) { fetchVotes(); const t = setInterval(fetchVotes, 5000); return () => clearInterval(t) }
  }, [authed, fetchVotes])

  const login = () => {
    if (pw === ADMIN_PW) { setAuthed(true); setError(false) }
    else { setError(true); setPw('') }
  }

  const deleteVote = async (name: string, matchId: number) => {
    const key = `${name}:${matchId}`
    setDeleting(key)
    const res = await fetch(`/api/votes?name=${encodeURIComponent(name)}&match_id=${matchId}`, { method: 'DELETE' })
    if (res.ok) await fetchVotes()
    setDeleting(null)
  }

  if (!authed) {
    return (
      <main className="flex items-center justify-center min-h-screen px-4">
        <div className="card w-full max-w-sm text-center">
          <h2 className="text-base font-semibold mb-1">관리자 로그인</h2>
          <p className="text-xs mb-5" style={{ color: '#888' }}>관리자 비밀번호를 입력하세요</p>
          <input
            type="password"
            className="w-full px-3 py-2 rounded-lg text-center text-base tracking-widest outline-none mb-2"
            style={{ background: '#f0f0ee', border: '0.5px solid rgba(0,0,0,0.15)' }}
            placeholder="••••••"
            value={pw}
            maxLength={20}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
          />
          {error && <p className="text-xs mb-2" style={{ color: '#E24B4A' }}>비밀번호가 틀렸습니다</p>}
          <button
            onClick={login}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: '#378ADD' }}
          >🔓 입장</button>
        </div>
      </main>
    )
  }

  const m = matches[activeTab]
  const matchVotes = votes.filter(v => v.match_id === m.id)
  const mood = calcMood(matchVotes, m)
  const cfg = MOOD_CFG[mood]
  const wdl = getWDL(matchVotes, m)
  const uniqueNames = [...new Set(votes.map(v => v.name))]

  const getVoteCounts = (mid: number) => {
    const counts: Record<string, number> = {}
    votes.filter(v => v.match_id === mid).forEach(v => {
      counts[v.score] = (counts[v.score] || 0) + 1
    })
    return counts
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

  const counts = getVoteCounts(m.id)
  const total = matchVotes.length
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const realKey = m.realScore ? `${m.realScore[0]}-${m.realScore[1]}` : null

  return (
    <>
      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes moodIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .mood-banner { animation: moodIn 0.5s ease; }
        .live-dot { animation: livePulse 1.4s infinite; }
      `}</style>

      {/* LIVE 뱃지 */}
      <div style={{
        position: 'fixed', top: 14, right: 16, zIndex: 100,
        background: '#E24B4A', color: '#fff',
        fontSize: 11, fontWeight: 800, padding: '4px 10px',
        borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5,
        boxShadow: '0 2px 8px rgba(226,75,74,0.4)',
      }}>
        <span className="live-dot" style={{ width: 6, height: 6, background: '#fff', borderRadius: '50%', display: 'inline-block' }} />
        LIVE
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <main style={{ flex: 1, minWidth: 0, paddingBottom: '4rem' }}>
        <a href="/" className="text-xs flex items-center gap-1 mb-5" style={{ color: '#888' }}>← 투표 페이지로</a>
        <div className="text-center mb-5">
          <h1 className="text-xl font-semibold mb-1">📊 월드컵 예측 집계 현황</h1>
          <p className="text-xs" style={{ color: '#888' }}>2026 FIFA 월드컵 · 그룹 A · 대한민국</p>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '총 참가자', value: `${uniqueNames.length}명` },
            { label: '총 투표 수', value: `${votes.length}표` },
            { label: '완료 경기', value: '1 / 3' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <p className="text-xs mb-1 font-semibold uppercase tracking-wide" style={{ color: '#999' }}>{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* 경기별 탭 */}
        <div className="flex gap-1 p-1 rounded-lg mb-4" style={{ background: '#f0f0ee' }}>
          {['1차전 vs 체코', '2차전 vs 멕시코', '3차전 vs 남아공'].map((label, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === i ? 'bg-white shadow-sm' : ''}`}
              style={{ color: activeTab === i ? 'var(--foreground)' : '#888' }}
            >{label}</button>
          ))}
        </div>

        {/* ── 분위기 배너 ── */}
        <div
          key={`${activeTab}-${mood}`}
          className="mood-banner"
          style={{
            background: cfg.gradient,
            borderRadius: 16,
            padding: '20px 22px 18px',
            marginBottom: 12,
            transition: 'background 0.8s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ fontSize: 38, lineHeight: 1.1, letterSpacing: -2 }}>{cfg.emojis}</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: cfg.textColor, fontWeight: 800, fontSize: 18, margin: '0 0 3px', lineHeight: 1.2 }}>
                {cfg.label}
              </p>
              <p style={{ color: cfg.subColor, fontSize: 12, margin: '0 0 12px' }}>{cfg.sublabel}</p>

              {/* 승/무/패 비율 바 */}
              {total > 0 && (
                <>
                  <div style={{
                    height: 7, borderRadius: 4, overflow: 'hidden',
                    display: 'flex', background: 'rgba(0,0,0,0.25)', marginBottom: 6,
                  }}>
                    <div style={{ width: `${wdl.wPct}%`, background: cfg.accent, transition: 'width 0.6s ease' }} />
                    <div style={{ width: `${wdl.dPct}%`, background: 'rgba(255,255,255,0.35)' }} />
                    <div style={{ width: `${wdl.lPct}%`, background: 'rgba(255,80,80,0.6)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: cfg.subColor }}>
                    <span>🇰🇷 승 {wdl.wPct}%</span>
                    <span>· 무 {wdl.dPct}%</span>
                    <span>· 패 {wdl.lPct}%</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{total}명 참여</span>
                  </div>
                </>
              )}
              {total === 0 && (
                <p style={{ fontSize: 12, color: cfg.subColor, opacity: 0.7 }}>아직 투표가 없어요</p>
              )}
            </div>
          </div>
        </div>

        {/* 경기 카드 */}
        <div className="card mb-4">
          <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
            <span className="text-2xl">{m.home.flag}</span>
            <div>
              <span className="text-sm font-semibold">{m.home.name} vs {m.away.name}</span>
              <span className="text-xs ml-2" style={{ color: '#999' }}>{m.date}</span>
              {m.realScore && (
                <span className="text-xs ml-2 font-bold" style={{ color: '#1D9E75' }}>
                  실제: {m.realScore[0]}-{m.realScore[1]}
                </span>
              )}
            </div>
            <span className="text-2xl ml-auto">{m.away.flag}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'done' ? 'badge-done' : 'badge-up'}`}>
              {m.status === 'done' ? '종료' : '예정'}
            </span>
          </div>

          {/* 스코어 분포 */}
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>
            스코어 분포 <span style={{ color: '#bbb', fontWeight: 400 }}>({total}표)</span>
          </p>
          {total === 0 ? (
            <p className="text-center text-xs py-4" style={{ color: '#999' }}>아직 투표가 없습니다</p>
          ) : (
            top.map(([score, cnt]) => {
              const pct = Math.round(cnt / total * 100)
              const isReal = score === realKey
              const koIsHome = m.home.name === '대한민국'
              const [h, a] = score.split('-').map(Number)
              const kg = koIsHome ? h : a, og = koIsHome ? a : h
              const isKoWin = kg > og
              const barColor = isReal ? '#1D9E75' : (isKoWin ? cfg.barColorWin : '#E24B4A')
              return (
                <div key={score} className="flex items-center gap-2 mb-2">
                  <span className="text-xs min-w-8 text-right font-semibold" style={{ color: isReal ? '#1D9E75' : '#888' }}>
                    {score}
                  </span>
                  <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: '#f0f0ee' }}>
                    <div className="h-full rounded transition-all duration-500"
                      style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                  <span className="text-xs min-w-20 text-right" style={{ color: '#999' }}>{cnt}명 · {pct}%</span>
                </div>
              )
            })
          )}

          {/* 개별 투표 내역 */}
          <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.1)', marginTop: '1rem', paddingTop: '1rem' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>개별 투표 내역</p>
            {matchVotes.length === 0 ? (
              <p className="text-center text-xs py-2" style={{ color: '#999' }}>투표 없음</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                    {['이름', '예측 스코어', '투표 시간', ''].map(h => (
                      <th key={h} className={`pb-2 font-semibold ${h==='이름'?'text-left':'text-center'}`} style={{ color: '#999' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matchVotes.map(v => {
                    const isCorrect = m.realScore && v.score === realKey
                    const pillColor = m.realScore
                      ? (isCorrect ? { bg:'#EAF3DE', text:'#27500A' } : { bg:'#FCEBEB', text:'#791F1F' })
                      : { bg:'#FAEEDA', text:'#633806' }
                    const isDel = deleting === `${v.name}:${v.match_id}`
                    return (
                      <tr key={v.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                        <td className="py-2 font-semibold">👤 {v.name}</td>
                        <td className="py-2 text-center">
                          <span className="px-2 py-0.5 rounded-full font-bold text-xs"
                            style={{ background: pillColor.bg, color: pillColor.text }}>
                            {v.score}
                          </span>
                        </td>
                        <td className="py-2 text-center" style={{ color: '#999' }}>{fmtTime(v.updated_at)}</td>
                        <td className="py-2 text-center">
                          <button
                            disabled={!!isDel}
                            onClick={() => deleteVote(v.name, v.match_id)}
                            style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 5,
                              border: '0.5px solid rgba(0,0,0,0.15)',
                              background: isDel ? '#f0f0ee' : '#fff',
                              color: '#E24B4A', cursor: isDel ? 'default' : 'pointer',
                              opacity: isDel ? 0.5 : 1,
                            }}
                          >{isDel ? '…' : '삭제'}</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 전체 참가자 */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">전체 참가자 목록</p>
            <button onClick={fetchVotes} className="text-xs px-2 py-1 rounded" style={{ background: '#f0f0ee', color: '#888' }}>
              ↺ 새로고침
            </button>
          </div>
          {uniqueNames.length === 0 ? (
            <p className="text-center text-xs py-4" style={{ color: '#999' }}>아직 참가자가 없습니다</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
                  {['이름','vs 체코','vs 멕시코','vs 남아공','정답'].map(h => (
                    <th key={h} className={`pb-2 font-semibold ${h==='이름'?'text-left':'text-center'}`} style={{ color: '#999' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uniqueNames.map(name => {
                  const myVotes = votes.filter(v => v.name === name)
                  const correct = myVotes.filter(v => {
                    const m2 = matches[v.match_id]
                    return m2.realScore && v.score === `${m2.realScore[0]}-${m2.realScore[1]}`
                  }).length
                  const played = matches.filter(m2 => m2.realScore).length
                  return (
                    <tr key={name} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                      <td className="py-2 font-semibold">👤 {name}</td>
                      {matches.map(m2 => {
                        const v = myVotes.find(v2 => v2.match_id === m2.id)
                        if (!v) return <td key={m2.id} className="py-2 text-center" style={{ color: '#ccc' }}>-</td>
                        const isCorrect = m2.realScore && v.score === `${m2.realScore[0]}-${m2.realScore[1]}`
                        const bg = m2.realScore ? (isCorrect ? '#EAF3DE' : '#FCEBEB') : '#FAEEDA'
                        const color = m2.realScore ? (isCorrect ? '#27500A' : '#791F1F') : '#633806'
                        return (
                          <td key={m2.id} className="py-2 text-center">
                            <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: bg, color }}>{v.score}</span>
                          </td>
                        )
                      })}
                      <td className="py-2 text-center">
                        <span className="font-bold" style={{ color: '#1D9E75' }}>{correct}</span>
                        <span style={{ color: '#999' }}>/{played}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        </main>

        {/* QR 사이드바 */}
        <aside id="admin-qr-sidebar" style={{ width: 220, flexShrink: 0, position: 'sticky', top: '2rem' }}>
          <style>{`@media (max-width: 899px) { #admin-qr-sidebar { display: none; } }`}</style>
          <QrSidebar />
        </aside>

        </div>
      </div>
    </>
  )
}

function QrSidebar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = 188
    QRCode.toDataURL(QR_URL, {
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
        const rows = DEVIL.length, cols = DEVIL[0].length
        const ps = 4
        const dw = cols * ps, dh = rows * ps
        const sx = Math.floor((size - dw) / 2)
        const sy = Math.floor((size - dh) / 2)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(sx - ps, sy - ps, dw + ps * 2, dh + ps * 2)
        DEVIL.forEach((row, y) => {
          row.forEach((p, x) => {
            const color = QR_COLORS[p]
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
    navigator.clipboard.writeText(QR_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ background: '#CC0000', padding: '10px 12px', textAlign: 'center' }}>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 12, margin: 0 }}>친구 초대하기</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, margin: '2px 0 0' }}>QR 스캔으로 바로 참여</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 14px 10px', background: '#fff' }}>
        <canvas ref={canvasRef} width={188} height={188} style={{ display: 'block' }} />
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
