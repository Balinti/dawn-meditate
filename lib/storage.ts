import { v4 as uuidv4 } from 'uuid'

export interface LocalSession {
  id: string
  device_id: string
  started_at: string
  wake_time_reported: string | null
  context: 'standard' | 'low_light' | 'gentle'
  protocol_id: string
  day_index: number
  completed_at: string | null
  reaction_pre_score: number | null
  reaction_post_score: number | null
  energy_pre: number | null
  energy_post: number | null
  minutes_saved_est: number | null
  reaction_pre_events: ReactionEvent[] | null
  reaction_post_events: ReactionEvent[] | null
}

export interface ReactionEvent {
  timestamp: number
  stimulus_shown_at: number
  reaction_time_ms: number
}

export interface LocalStorage {
  device_id: string
  sessions: LocalSession[]
  day_index: number
  entitlement: 'free' | 'plus' | 'pro'
  migrated: boolean
  soft_prompt_shown: boolean
  soft_prompt_dismissed_at: string | null
}

const STORAGE_KEY = 'dawn_meditate_data'

export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''

  const data = getLocalData()
  return data.device_id
}

export function getLocalData(): LocalStorage {
  if (typeof window === 'undefined') {
    return createDefaultData()
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as LocalStorage
      // Ensure all fields exist
      return {
        ...createDefaultData(),
        ...data,
      }
    }
  } catch (e) {
    console.error('Error reading localStorage:', e)
  }

  const defaultData = createDefaultData()
  saveLocalData(defaultData)
  return defaultData
}

function createDefaultData(): LocalStorage {
  return {
    device_id: uuidv4(),
    sessions: [],
    day_index: 0,
    entitlement: 'free',
    migrated: false,
    soft_prompt_shown: false,
    soft_prompt_dismissed_at: null,
  }
}

export function saveLocalData(data: LocalStorage): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

export function createLocalSession(
  context: 'standard' | 'low_light' | 'gentle',
  protocolId: string,
  dayIndex: number,
  wakeTime: string | null
): LocalSession {
  const data = getLocalData()

  const session: LocalSession = {
    id: uuidv4(),
    device_id: data.device_id,
    started_at: new Date().toISOString(),
    wake_time_reported: wakeTime,
    context,
    protocol_id: protocolId,
    day_index: dayIndex,
    completed_at: null,
    reaction_pre_score: null,
    reaction_post_score: null,
    energy_pre: null,
    energy_post: null,
    minutes_saved_est: null,
    reaction_pre_events: null,
    reaction_post_events: null,
  }

  return session
}

export function saveSession(session: LocalSession): void {
  const data = getLocalData()

  // Find existing session or add new
  const existingIndex = data.sessions.findIndex(s => s.id === session.id)
  if (existingIndex >= 0) {
    data.sessions[existingIndex] = session
  } else {
    data.sessions.push(session)
  }

  // Update day index if session completed
  if (session.completed_at && session.day_index >= data.day_index) {
    data.day_index = session.day_index + 1
  }

  saveLocalData(data)
}

export function getCompletedSessions(): LocalSession[] {
  const data = getLocalData()
  return data.sessions.filter(s => s.completed_at !== null)
}

export function getLastNSessions(n: number): LocalSession[] {
  const completed = getCompletedSessions()
  return completed.slice(-n)
}

export function getDayIndex(): number {
  const data = getLocalData()
  return data.day_index
}

export function shouldShowSoftPrompt(): boolean {
  const data = getLocalData()

  // Already shown and dismissed recently
  if (data.soft_prompt_dismissed_at) {
    const dismissedAt = new Date(data.soft_prompt_dismissed_at)
    const hoursSinceDismissed = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceDismissed < 24) {
      return false
    }
  }

  // Show after at least one completed session
  const completedSessions = getCompletedSessions()
  return completedSessions.length >= 1 && !data.migrated
}

export function markSoftPromptDismissed(): void {
  const data = getLocalData()
  data.soft_prompt_shown = true
  data.soft_prompt_dismissed_at = new Date().toISOString()
  saveLocalData(data)
}

export function markMigrated(): void {
  const data = getLocalData()
  data.migrated = true
  saveLocalData(data)
}

export function getSessionsForMigration(): LocalSession[] {
  const data = getLocalData()
  if (data.migrated) return []
  return data.sessions
}

export function clearLocalSessions(): void {
  const data = getLocalData()
  data.sessions = []
  data.day_index = 0
  saveLocalData(data)
}
