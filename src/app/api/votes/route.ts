import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get('match_id')
  let query = supabase.from('votes').select('*').order('updated_at', { ascending: false })
  if (matchId !== null) query = query.eq('match_id', Number(matchId))
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, match_id, home_goals, away_goals } = body
  if (!name || match_id === undefined || home_goals === undefined || away_goals === undefined) {
    return NextResponse.json({ error: '필수 값 누락' }, { status: 400 })
  }
  const score = `${home_goals}-${away_goals}`
  const { data, error } = await supabase
    .from('votes')
    .upsert(
      { name, match_id, home_goals, away_goals, score, updated_at: new Date().toISOString() },
      { onConflict: 'name,match_id' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  const matchId = req.nextUrl.searchParams.get('match_id')
  if (!name || matchId === null) return NextResponse.json({ error: '필수 값 누락' }, { status: 400 })
  const { error } = await supabase
    .from('votes')
    .delete()
    .eq('name', name)
    .eq('match_id', Number(matchId))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
