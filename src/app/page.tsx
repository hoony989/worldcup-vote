'use client'

import { useState, useEffect, useCallback } from 'react'
import { matches, Match } from '@/lib/matches'
import { Vote } from '@/lib/supabase'

const MAX_SCORE = 10

export default function HomePage() {
  const [name, setName] = useState('')
  const [confirmedName, setConfirmedName] = useState('')
  const [votes, setVotes] = useState<Vote[]>([])
  const [scores, setScores] = useState<Record<number, { home: number; away: number }>>({
    0: { home: 0, away: 0 },
    1: { home: 0, away: 0 },
    2: { home: 0, away: 0 },
  })
  const [loading, setLoading] = useState(false)
  const [votingMatch, setVotingMatch] = useState<number | null>(null)

  const fetchVotes = useCallback(async () => {
    const res = await fetch('/api/votes')
    if (res.ok) setVotes(await res.json())
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('wc2026_name')
    if (saved) setConfirmedName(saved)
    fetchVotes()
    const interval = setInterval(fetchVotes, 10000)
    return () => clearInterval(interval)
  }, [fetchVotes])

  const setNameConfirmed = () => {
    const n = name.trim()
    if (!n) return
    setConfirmedName(n)
    localStorage.setItem('wc2026_name', n)
  }

  const changeScore = (mid: number, side: 'home' | 'away', delta: number) => {
    setScores(prev => ({
      ...prev,
      [mid]: {
        ...prev[mid],
        [side]: Math.max(0, Math.min(MAX_SCORE, prev[mid][side] + delta)),
      },
    }))
  }

  const submitVote = async (mid: number) => {
    if (!confirmedName) return
    setVotingMatch(mid)
    setLoading(true)
    await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: confirmedName,
        match_id: mid,
        home_goals: scores[mid].home,
        away_goals: scores[mid].away,
      }),
    })
    await fetchVotes()
    setLoading(false)
    setVotingMatch(null)
  }

  const resetVote = async (mid: number) => {
    const res = await fetch(`/api/votes?match_id=${mid}&name=${encodeURIComponent(confirmedName)}`, { method: 'DELETE' })
    if (res.ok) await fetchVotes()
  }

  const getMyVote = (mid: number) => votes.find(v => v.name === confirmedName && v.match_id === mid)

  const getVoteCounts = (mid: number) => {
    const counts: Record<string, number> = {}
    votes.filter(v => v.match_id === mid).forEach(v => {
      counts[v.score] = (counts[v.score] || 0) + 1
    })
    return counts
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8 pb-16">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-xl font-semibold mb-1">2026 FIFA 월드컵 — 한국 경기 예측</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted, #888)' }}>그룹 A · 대한민국 · 체코 · 멕시코 · 남아프리카공화국</p>
      </div>

      {/* 이름 카드 */}
      <div className="card mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#888' }}>참가자 이름</label>
        {confirmedName ? (
          <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: '#EAF3DE', color: '#27500A' }}>
            <span>✓</span>
            <span><strong>{confirmedName}</strong> 님으로 참가 중</span>
            <button className="ml-auto text-xs underline" style={{ color: '#888' }} onClick={() => { setConfirmedName(''); localStorage.removeItem('wc2026_name') }}>변경</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ background: '#f0f0ee', border: '0.5px solid rgba(0,0,0,0.15)' }}
              placeholder="이름을 입력하세요"
              value={name}
              maxLength={20}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setNameConfirmed()}
            />
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#378ADD' }}
              onClick={setNameConfirmed}
            >확인</button>
          </div>
        )}
      </div>

      {/* 그룹 순위 */}
      <div className="card mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>그룹 A 순위</p>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(0,0,0,0.1)' }}>
              {['팀','경기','승','무','패','득실','승점'].map(h => (
                <th key={h} className={`pb-2 font-semibold ${h==='팀'?'text-left':'text-center'}`} style={{ color: '#999' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { flag:'🇰🇷', name:'대한민국', p:1,w:1,d:0,l:0,gd:'+1',pts:3, kr:true },
              { flag:'🇲🇽', name:'멕시코',   p:1,w:1,d:0,l:0,gd:'+1',pts:3, kr:false },
              { flag:'🇿🇦', name:'남아공',   p:1,w:0,d:0,l:1,gd:'-1',pts:0, kr:false },
              { flag:'🇨🇿', name:'체코',     p:1,w:0,d:0,l:1,gd:'-1',pts:0, kr:false },
            ].map(row => (
              <tr key={row.name} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.07)' }}>
                <td className="py-2 font-medium" style={{ color: row.kr ? '#185FA5' : undefined }}>{row.flag} {row.name}</td>
                {[row.p,row.w,row.d,row.l,row.gd,row.pts].map((v,i) => (
                  <td key={i} className="py-2 text-center" style={{ color: row.kr ? '#185FA5' : '#888', fontWeight: row.kr ? 700 : undefined }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 경기 카드들 */}
      {matches.map(m => (
        <MatchCard
          key={m.id}
          match={m}
          myVote={getMyVote(m.id)}
          voteCounts={getVoteCounts(m.id)}
          totalVoters={votes.filter(v => v.match_id === m.id).length}
          scores={scores[m.id]}
          onChangeScore={changeScore}
          onVote={submitVote}
          onReset={resetVote}
          hasName={!!confirmedName}
          isVoting={loading && votingMatch === m.id}
        />
      ))}

      <div className="text-center mt-8">
        <a href="/admin" className="text-xs" style={{ color: '#999' }}>⚙ 관리자 페이지</a>
      </div>
    </main>
  )
}

function MatchCard({
  match, myVote, voteCounts, totalVoters, scores,
  onChangeScore, onVote, onReset, hasName, isVoting
}: {
  match: Match
  myVote: Vote | undefined
  voteCounts: Record<string, number>
  totalVoters: number
  scores: { home: number; away: number }
  onChangeScore: (mid: number, side: 'home' | 'away', delta: number) => void
  onVote: (mid: number) => void
  onReset: (mid: number) => void
  hasName: boolean
  isVoting: boolean
}) {
  const isDone = match.status === 'done'
  const dispScore = isDone
    ? `${match.realScore![0]} : ${match.realScore![1]}`
    : myVote ? myVote.score.replace('-', ' : ') : '? : ?'

  return (
    <div className="card mb-4">
      <span className={`inline-block text-xs px-3 py-0.5 rounded-full font-semibold mb-3 ${isDone ? 'badge-done' : 'badge-up'}`}>
        {isDone ? '경기 종료' : '예정'}
      </span>

      {/* 팀 & 스코어 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-4xl">{match.home.flag}</span>
          <span className="text-xs font-semibold">{match.home.name}</span>
        </div>
        <div className="text-center min-w-20">
          <div className="text-3xl font-bold tracking-widest">{dispScore}</div>
          <div className="text-xs mt-0.5" style={{ color: '#999' }}>{match.date}</div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-4xl">{match.away.flag}</span>
          <span className="text-xs font-semibold">{match.away.name}</span>
        </div>
      </div>
      <p className="text-center text-xs mb-4" style={{ color: '#888' }}>📍 {match.venue}</p>

      <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
        {isDone && (
          <div className="text-center text-sm px-3 py-2 rounded-lg mb-3" style={{ background: '#f0f0ee' }}>
            🏁 최종 스코어 <strong>{match.realScore![0]} : {match.realScore![1]}</strong>
          </div>
        )}

        {/* 투표 현황 */}
        {totalVoters === 0 ? (
          <p className="text-center text-xs py-4" style={{ color: '#999' }}>아직 투표한 사람이 없어요</p>
        ) : (
          <VoteBars voteCounts={voteCounts} totalVoters={totalVoters} myVote={myVote?.score} realScore={match.realScore} />
        )}

        {/* 종료 경기: 정답 여부 */}
        {isDone && myVote && (
          <div className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-semibold mt-2 ${
            myVote.score === `${match.realScore![0]}-${match.realScore![1]}` ? 'badge-correct' : 'badge-wrong'
          }`}>
            {myVote.score === `${match.realScore![0]}-${match.realScore![1]}` ? '✓ 정답!' : '✗ 아쉽게 틀렸어요'} ({myVote.score})
          </div>
        )}
        {isDone && !myVote && (
          <p className="text-xs mt-2" style={{ color: '#999' }}>이미 종료된 경기입니다</p>
        )}

        {/* 예정 경기: 피커 또는 내 예측 */}
        {!isDone && !myVote && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#888' }}>스코어 예측</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-xs font-semibold w-14 text-center">{match.home.name}</span>
              <ScorePicker value={scores.home} onChange={d => onChangeScore(match.id, 'home', d)} />
              <span className="text-xl font-bold" style={{ color: '#999' }}>:</span>
              <ScorePicker value={scores.away} onChange={d => onChangeScore(match.id, 'away', d)} />
              <span className="text-xs font-semibold w-14 text-center">{match.away.name}</span>
            </div>
            <button
              disabled={!hasName || isVoting}
              onClick={() => onVote(match.id)}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: '#378ADD' }}
            >
              {isVoting ? '투표 중...' : '✓ 예측 투표하기'}
            </button>
            {!hasName && <p className="text-xs text-center mt-2" style={{ color: '#999' }}>이름을 입력하면 투표할 수 있어요</p>}
          </>
        )}

        {!isDone && myVote && (() => {
          const [hs, as] = myVote.score.split('-').map(Number)
          const koIsHome = match.home.name === '대한민국'
          const kg = koIsHome ? hs : as, og = koIsHome ? as : hs
          const tag = kg > og ? '한국 승 예측' : kg < og ? '한국 패 예측' : '무승부 예측'
          const color = kg > og ? '#1D9E75' : kg < og ? '#E24B4A' : '#888'
          return (
            <>
              <div className="text-center text-sm px-3 py-2 rounded-lg mb-3" style={{ background: '#f0f0ee' }}>
                내 예측 <strong>{myVote.score}</strong>
                <span className="ml-2 font-bold text-xs" style={{ color }}>{tag}</span>
              </div>
              <button
                onClick={() => onReset(match.id)}
                className="w-full py-2 rounded-lg text-xs font-semibold"
                style={{ background: '#f0f0ee', color: '#888' }}
              >↺ 예측 다시 하기</button>
            </>
          )
        })()}
      </div>
    </div>
  )
}

function ScorePicker({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded-lg" style={{ border: '0.5px solid rgba(0,0,0,0.2)' }}>
      <button
        disabled={value <= 0}
        onClick={() => onChange(-1)}
        className="w-10 h-11 flex items-center justify-center text-lg font-bold disabled:opacity-30"
        style={{ background: '#f0f0ee' }}
      >−</button>
      <span className="w-12 h-11 flex items-center justify-center text-xl font-bold"
        style={{ borderLeft: '0.5px solid rgba(0,0,0,0.1)', borderRight: '0.5px solid rgba(0,0,0,0.1)' }}>
        {value}
      </span>
      <button
        disabled={value >= MAX_SCORE}
        onClick={() => onChange(1)}
        className="w-10 h-11 flex items-center justify-center text-lg font-bold disabled:opacity-30"
        style={{ background: '#f0f0ee' }}
      >+</button>
    </div>
  )
}

function VoteBars({ voteCounts, totalVoters, myVote, realScore }: {
  voteCounts: Record<string, number>
  totalVoters: number
  myVote?: string
  realScore: [number, number] | null
}) {
  const realKey = realScore ? `${realScore[0]}-${realScore[1]}` : null
  const top = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#888' }}>
        예측 현황 <span className="font-normal" style={{ color: '#bbb' }}>({totalVoters}명)</span>
      </p>
      {top.map(([score, cnt]) => {
        const pct = Math.round(cnt / totalVoters * 100)
        const isReal = score === realKey
        const isUser = score === myVote
        return (
          <div key={score} className="flex items-center gap-2 mb-1.5">
            <span className="text-xs min-w-8 text-right font-medium"
              style={{ color: isReal ? '#1D9E75' : isUser ? '#185FA5' : '#888', fontWeight: isReal || isUser ? 700 : undefined }}>
              {score}
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: '#f0f0ee' }}>
              <div className="h-full rounded transition-all duration-500"
                style={{ width: `${pct}%`, background: isReal ? '#1D9E75' : '#378ADD' }} />
            </div>
            <span className="text-xs min-w-16 text-right" style={{ color: '#999' }}>{cnt}명 · {pct}%</span>
          </div>
        )
      })}
    </div>
  )
}
