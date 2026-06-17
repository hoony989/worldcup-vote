export type Match = {
  id: number
  date: string
  venue: string
  home: { name: string; flag: string }
  away: { name: string; flag: string }
  status: 'done' | 'upcoming'
  realScore: [number, number] | null
}

export const matches: Match[] = [
  {
    id: 0,
    date: '6월 11일 (수) 22:00',
    venue: 'AT&T 스타디움, 달라스',
    home: { name: '대한민국', flag: '🇰🇷' },
    away: { name: '체코', flag: '🇨🇿' },
    status: 'done',
    realScore: [2, 1],
  },
  {
    id: 1,
    date: '6월 19일 (금) 오전 10:00 KST',
    venue: '에스타디오 아크론, 과달라하라',
    home: { name: '멕시코', flag: '🇲🇽' },
    away: { name: '대한민국', flag: '🇰🇷' },
    status: 'upcoming',
    realScore: null,
  },
  {
    id: 2,
    date: '6월 25일 (목) 오전 10:00 KST',
    venue: '에스타디오 BBVA, 몬테레이',
    home: { name: '남아공', flag: '🇿🇦' },
    away: { name: '대한민국', flag: '🇰🇷' },
    status: 'upcoming',
    realScore: null,
  },
]
