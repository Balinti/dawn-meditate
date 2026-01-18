import type { ReactionEvent } from './storage'

export interface ReactionTestResult {
  events: ReactionEvent[]
  score: number
  median_ms: number
  mean_ms: number
  best_ms: number
  worst_ms: number
}

export function computeReactionScore(events: ReactionEvent[]): ReactionTestResult {
  if (events.length === 0) {
    return {
      events: [],
      score: 0,
      median_ms: 0,
      mean_ms: 0,
      best_ms: 0,
      worst_ms: 0,
    }
  }

  const reactionTimes = events.map(e => e.reaction_time_ms).filter(t => t > 0)

  if (reactionTimes.length === 0) {
    return {
      events,
      score: 0,
      median_ms: 0,
      mean_ms: 0,
      best_ms: 0,
      worst_ms: 0,
    }
  }

  const sorted = [...reactionTimes].sort((a, b) => a - b)
  const median_ms = sorted[Math.floor(sorted.length / 2)]
  const mean_ms = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
  const best_ms = sorted[0]
  const worst_ms = sorted[sorted.length - 1]

  // Score: higher is better, normalized around typical reaction times
  // 200ms = excellent, 400ms = average, 600ms+ = slow
  // Score formula: 1000 / median_ms * 200 (normalized so 200ms = 1000 points)
  const score = Math.round((1000 / median_ms) * 200)

  return {
    events,
    score,
    median_ms: Math.round(median_ms),
    mean_ms: Math.round(mean_ms),
    best_ms: Math.round(best_ms),
    worst_ms: Math.round(worst_ms),
  }
}

export function computeImprovement(preScore: number, postScore: number): {
  delta: number
  percentChange: number
  improved: boolean
} {
  const delta = postScore - preScore
  const percentChange = preScore > 0 ? Math.round((delta / preScore) * 100) : 0
  const improved = delta > 0

  return {
    delta,
    percentChange,
    improved,
  }
}

export function estimateMinutesSaved(
  preScore: number,
  postScore: number,
  dayIndex: number
): number {
  // Estimate based on improvement
  // Baseline: without protocol, grogginess lasts ~30-60 minutes
  // With protocol: reduce by percentage improvement

  const improvement = computeImprovement(preScore, postScore)

  if (!improvement.improved) {
    return 0
  }

  // Base minutes that would typically be groggy
  const baseGroggyMinutes = 45

  // Improvement factor (capped at 50% reduction)
  const improvementFactor = Math.min(improvement.percentChange / 100, 0.5)

  // Day multiplier - more consistent users see better results
  const dayMultiplier = Math.min(1 + (dayIndex * 0.05), 1.5)

  const minutesSaved = Math.round(baseGroggyMinutes * improvementFactor * dayMultiplier)

  return Math.max(0, Math.min(minutesSaved, 30)) // Cap at 30 minutes
}

export function getRecentDeltas(
  sessions: Array<{ reaction_pre_score: number | null; reaction_post_score: number | null }>
): number[] {
  return sessions
    .filter(s => s.reaction_pre_score !== null && s.reaction_post_score !== null)
    .map(s => (s.reaction_post_score || 0) - (s.reaction_pre_score || 0))
}
