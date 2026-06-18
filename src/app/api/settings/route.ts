import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('match_settings')
    .select('*')
    .order('match_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { match_id, voting_open } = await req.json()
  if (match_id === undefined || voting_open === undefined) {
    return NextResponse.json({ error: '필수 값 누락' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('match_settings')
    .update({ voting_open, updated_at: new Date().toISOString() })
    .eq('match_id', match_id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
