export type ProtocolContext = 'standard' | 'low_light' | 'gentle'

export interface ProtocolStep {
  id: string
  name: string
  duration_seconds: number
  instructions: string
  type: 'light' | 'breath' | 'movement' | 'hydration'
  breath_cadence?: {
    inhale_seconds: number
    hold_seconds: number
    exhale_seconds: number
    cycles: number
  }
}

export interface Protocol {
  id: string
  name: string
  total_duration_seconds: number
  steps: ProtocolStep[]
}

const LIGHT_STEP_STANDARD: ProtocolStep = {
  id: 'light-standard',
  name: 'Light Exposure',
  duration_seconds: 150, // 2.5 minutes
  instructions: 'Position yourself near a window or step outside. Face the light source (not directly at the sun). Let natural light reach your eyes for the next few minutes. If indoors, turn on bright lights and face them.',
  type: 'light',
}

const LIGHT_STEP_LOW_LIGHT: ProtocolStep = {
  id: 'light-low-light',
  name: 'Indoor Light Exposure',
  duration_seconds: 180, // 3 minutes - longer for indoor
  instructions: 'Turn on the brightest lights in your space. Position yourself close to the light source. If you have a desk lamp, face it directly. The goal is maximum light exposure to signal wakefulness to your brain.',
  type: 'light',
}

const LIGHT_STEP_GENTLE: ProtocolStep = {
  id: 'light-gentle',
  name: 'Gentle Light Exposure',
  duration_seconds: 120, // 2 minutes
  instructions: 'Open your curtains or blinds. Allow soft, natural light into your space. Position yourself comfortably where light can reach you. No need for harsh brightness.',
  type: 'light',
}

const BREATH_STEP_STANDARD: ProtocolStep = {
  id: 'breath-standard',
  name: 'Energizing Breathwork',
  duration_seconds: 180, // 3 minutes
  instructions: 'Follow the breathing pattern: Inhale deeply through your nose, brief hold, then exhale through your mouth. This pattern activates your alertness system.',
  type: 'breath',
  breath_cadence: {
    inhale_seconds: 4,
    hold_seconds: 2,
    exhale_seconds: 4,
    cycles: 18,
  },
}

const BREATH_STEP_GENTLE: ProtocolStep = {
  id: 'breath-gentle',
  name: 'Gentle Breathwork',
  duration_seconds: 180,
  instructions: 'Breathe slowly and naturally. Inhale through your nose, pause briefly, exhale through your mouth. Keep it comfortable and relaxed.',
  type: 'breath',
  breath_cadence: {
    inhale_seconds: 5,
    hold_seconds: 1,
    exhale_seconds: 5,
    cycles: 16,
  },
}

const BREATH_STEP_INTENSE: ProtocolStep = {
  id: 'breath-intense',
  name: 'Energizing Breathwork',
  duration_seconds: 180,
  instructions: 'Follow the breathing pattern with slightly faster cadence: Quick inhale, brief hold, strong exhale. This pattern boosts alertness.',
  type: 'breath',
  breath_cadence: {
    inhale_seconds: 3,
    hold_seconds: 2,
    exhale_seconds: 3,
    cycles: 22,
  },
}

const MOVEMENT_STEP_STANDARD: ProtocolStep = {
  id: 'movement-standard',
  name: 'Micro-Movement',
  duration_seconds: 180, // 3 minutes
  instructions: 'Stand up and perform these simple movements:\n\n1. Arm circles (30 seconds)\n2. Gentle neck rolls (30 seconds)\n3. Shoulder shrugs (30 seconds)\n4. Torso twists (30 seconds)\n5. March in place (60 seconds)\n\nNo equipment needed. Move at your own pace.',
  type: 'movement',
}

const MOVEMENT_STEP_GENTLE: ProtocolStep = {
  id: 'movement-gentle',
  name: 'Gentle Movement',
  duration_seconds: 150,
  instructions: 'While seated or standing:\n\n1. Slowly roll your shoulders (30 seconds)\n2. Gentle neck stretches (30 seconds)\n3. Wiggle your fingers and toes (30 seconds)\n4. Gentle arm stretches (30 seconds)\n5. Deep breaths while stretching (30 seconds)',
  type: 'movement',
}

const MOVEMENT_STEP_EXTENDED: ProtocolStep = {
  id: 'movement-extended',
  name: 'Active Movement',
  duration_seconds: 210, // 3.5 minutes
  instructions: 'Stand up and energize:\n\n1. Arm circles (30 seconds)\n2. Jumping jacks or high knees (45 seconds)\n3. Torso twists (30 seconds)\n4. Squats (30 seconds)\n5. March in place with arm swings (45 seconds)',
  type: 'movement',
}

const HYDRATION_STEP: ProtocolStep = {
  id: 'hydration',
  name: 'Hydration',
  duration_seconds: 90, // 1.5 minutes
  instructions: 'Drink a full glass of water (8-16 oz). Your body has been without water for hours. Hydration helps:\n\n- Boost energy levels\n- Improve cognitive function\n- Kickstart metabolism\n\nSip steadily, no need to rush.',
  type: 'hydration',
}

export function getProtocol(
  context: ProtocolContext,
  dayIndex: number,
  recentDeltas: number[] = []
): Protocol {
  // Determine if we need to adapt based on recent performance
  const needsGentler = recentDeltas.length >= 3 &&
    recentDeltas.slice(-3).every(d => d <= 0)

  const needsIntense = recentDeltas.length >= 3 &&
    recentDeltas.slice(-3).every(d => d > 5)

  let lightStep: ProtocolStep
  let breathStep: ProtocolStep
  let movementStep: ProtocolStep

  // Context-based selection
  switch (context) {
    case 'low_light':
      lightStep = LIGHT_STEP_LOW_LIGHT
      breathStep = needsGentler ? BREATH_STEP_GENTLE : BREATH_STEP_STANDARD
      movementStep = needsIntense ? MOVEMENT_STEP_EXTENDED : MOVEMENT_STEP_STANDARD
      break
    case 'gentle':
      lightStep = LIGHT_STEP_GENTLE
      breathStep = BREATH_STEP_GENTLE
      movementStep = MOVEMENT_STEP_GENTLE
      break
    default: // standard
      lightStep = LIGHT_STEP_STANDARD
      breathStep = needsGentler ? BREATH_STEP_GENTLE :
                   needsIntense ? BREATH_STEP_INTENSE : BREATH_STEP_STANDARD
      movementStep = needsIntense ? MOVEMENT_STEP_EXTENDED : MOVEMENT_STEP_STANDARD
  }

  const steps = [lightStep, breathStep, movementStep, HYDRATION_STEP]
  const totalDuration = steps.reduce((sum, step) => sum + step.duration_seconds, 0)

  const adaptationSuffix = needsGentler ? '-gentle' : needsIntense ? '-intense' : ''

  return {
    id: `${context}-day${dayIndex}${adaptationSuffix}`,
    name: `Day ${dayIndex + 1} Protocol`,
    total_duration_seconds: totalDuration,
    steps,
  }
}

export function getMaintenanceProtocol(context: ProtocolContext): Protocol {
  // Shortened 3-minute protocol for Day 4+ free users
  const lightStep: ProtocolStep = {
    id: 'light-maintenance',
    name: 'Quick Light',
    duration_seconds: 60,
    instructions: 'Get near a light source. Face the light for one minute.',
    type: 'light',
  }

  const breathStep: ProtocolStep = {
    id: 'breath-maintenance',
    name: 'Quick Breath',
    duration_seconds: 60,
    instructions: 'Take 6 deep breaths. Inhale 4 seconds, exhale 4 seconds.',
    type: 'breath',
    breath_cadence: {
      inhale_seconds: 4,
      hold_seconds: 0,
      exhale_seconds: 4,
      cycles: 6,
    },
  }

  const hydrationStep: ProtocolStep = {
    id: 'hydration-maintenance',
    name: 'Hydrate',
    duration_seconds: 60,
    instructions: 'Drink a glass of water.',
    type: 'hydration',
  }

  return {
    id: `maintenance-${context}`,
    name: 'Maintenance Protocol',
    total_duration_seconds: 180,
    steps: [lightStep, breathStep, hydrationStep],
  }
}
