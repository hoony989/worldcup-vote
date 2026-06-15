import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Vote = {
  id: string
  name: string
  match_id: number
  home_goals: number
  away_goals: number
  score: string
  created_at: string
  updated_at: string
}
