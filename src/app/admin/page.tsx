'use client'

import { useState, useEffect, useCallback } from 'react'
import { matches } from '@/lib/matches'
import { Vote } from '@/lib/supabase'

const ADMIN_PW = 'korea2026'

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

  const uniqueNames = [...new Set(votes.map(v => v.name))]
  const totalVotes = votes.length

  const getVoteCounts = (mid: number) => {
    const counts: Record<string, number> = {}
    votes.filter(v => v.match_id === mid).forEach(v => {
      counts[v.score] = (counts[v.score] || 0) + 1
    })
    return counts
  }

  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const m = matches[activeTab]
  const matchVotes = votes.filter(v => v.match_id === m.id)
  const counts = getVoteCounts(m.id)
  const total = matchVotes.length
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const realKey = m.realScore ? `${m.realScore[0]}-${m.realScore[1]}` : null

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
      <a href="/" className="text-xs flex items-center gap-1 mb-6" style={{ color: '#888' }}>← 투표 페이지로</a>
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-1">📊 월드컵 예측 집계 현황</h1>
        <p className="text-xs" style={{ color: '#888' }}>2026 FIFA 월드컵 · 그룹 A · 대한민국</p>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: '총 참가자', value: `${uniqueNames.length}명` },
          { label: '총 투표 수', value: `${totalVotes}표` },
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

      <div className="card mb-4">
        {/* 경기 헤더 */}
        <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
          <span className="text-2xl">{m.home.flag}</span>
          <div>
            <span className="text-sm font-semibold">{m.home.name} vs {m.away.name}</span>
            <span className="text-xs ml-2" style={{ color: '#999' }}>{m.date}</span>
            {m.realScore && <span className="text-xs ml-2 font-bold" style={{ color: '#1D9E75' }}>실제: {m.realScore[0]}-{m.realScore[1]}</span>}
          </div>
          <span className="text-2xl ml-auto">{m.away.flag}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${m.status === 'done' ? 'badge-done' : 'badge-up'}`}>
            {m.status === 'done' ? '종료' : '예정'}
          </span>
        </div>

        {/* 스코어 분포 */}
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>스코어 분포 ({total}표)</p>
        {total === 0 ? (
          <p className="text-center text-xs py-4" style={{ color: '#999' }}>아직 투표가 없습니다</p>
        ) : (
          top.map(([score, cnt]) => {
            const pct = Math.round(cnt / total * 100)
            const isReal = score === realKey
            return (
              <div key={score} className="flex items-center gap-2 mb-2">
                <span className="text-xs min-w-8 text-right font-semibold" style={{ color: isReal ? '#1D9E75' : '#888' }}>{score}</span>
                <div className="flex-1 h-6 rounded overflow-hidden" style={{ background: '#f0f0ee' }}>
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: isReal ? '#1D9E75' : '#378ADD' }} />
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
                  const pillColor = m.realScore ? (isCorrect ? { bg:'#EAF3DE', text:'#27500A' } : { bg:'#FCEBEB', text:'#791F1F' }) : { bg:'#FAEEDA', text:'#633806' }
                  const isDel = deleting === `${v.name}:${v.match_id}`
                  return (
                    <tr key={v.id} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                      <td className="py-2 font-semibold">👤 {v.name}</td>
                      <td className="py-2 text-center">
                        <span className="px-2 py-0.5 rounded-full font-bold text-xs" style={{ background: pillColor.bg, color: pillColor.text }}>{v.score}</span>
                      </td>
                      <td className="py-2 text-center" style={{ color: '#999' }}>{fmtTime(v.updated_at)}</td>
                      <td className="py-2 text-center">
                        <button
                          disabled={isDel}
                          onClick={() => deleteVote(v.name, v.match_id)}
                          style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, border: '0.5px solid rgba(0,0,0,0.15)', background: isDel ? '#f0f0ee' : '#fff', color: '#E24B4A', cursor: 'pointer', opacity: isDel ? 0.5 : 1 }}
                        >
                          {isDel ? '…' : '삭제'}
                        </button>
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
          <button onClick={fetchVotes} className="text-xs px-2 py-1 rounded" style={{ background: '#f0f0ee', color: '#888' }}>↺ 새로고침</button>
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
  )
}
