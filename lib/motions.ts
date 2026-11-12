/** The fixed motion library. Each id needs a driving clip at public/motions/<id>.mp4. */
export const MOTIONS = [
  { id: 'turn', label: '360', name: 'Turn 360°' },
  { id: 'walk', label: 'Walk', name: 'Walk toward camera' },
  { id: 'arms', label: 'Arms', name: 'Arms up' },
  { id: 'sit', label: 'Sit', name: 'Sit down' },
] as const

export type MotionId = (typeof MOTIONS)[number]['id']
