export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export function getCurrentHour(): number {
  return new Date().getHours()
}

// Evening: after 20:00 (default)
export const EVENING_START = 20
// Morning: before 7:00 (default)
export const MORNING_END = 7

export function isEvening(eveningStartHour: number = EVENING_START): boolean {
  return getCurrentHour() >= eveningStartHour
}

export function isMorning(morningEndHour: number = MORNING_END): boolean {
  return getCurrentHour() < morningEndHour
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
