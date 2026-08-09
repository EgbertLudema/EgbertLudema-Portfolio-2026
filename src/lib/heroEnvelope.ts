/**
 * The envelope that orbits the vault on the homepage hero.
 *
 * Coordinates are the hero's memory-card texture space (256x320), with the
 * envelope occupying a 228x150 box inside it so the drop shadow has room.
 */

export const ENVELOPE_LEFT = 14
export const ENVELOPE_TOP = 82
export const ENVELOPE_WIDTH = 228
export const ENVELOPE_HEIGHT = 150

export type EnvelopeStyle = {
  /** Corner rounding of the sheet. */
  cornerRadius: number
  /** Flap tip position, relative to the envelope's vertical centre. */
  flapTipOffset: number
  /** How far the folded-up bottom panel reaches, relative to centre. */
  bottomApexOffset: number
  /** Half-width of the rounded notch at the flap's tip. */
  flapTipRadius: number

  /** Paper tones. Each pair runs top-left to bottom-right. */
  bodyFrom: string
  bodyTo: string
  panelFrom: string
  panelTo: string
  flapFrom: string
  flapTo: string

  /** Ambient shadow the whole sheet casts. */
  dropShadowColor: string
  dropShadowAlpha: number
  dropShadowBlur: number
  dropShadowOffsetY: number

  /** Shadow the flap casts onto the body, which is what lifts it. */
  flapShadowColor: string
  flapShadowAlpha: number
  flapShadowBlur: number
  flapShadowOffsetY: number

  /** Crease along the folded-up bottom panel. */
  creaseColor: string
  creaseAlpha: number
  creaseWidth: number

  /** The flap's free edge: the crispest line on the envelope. */
  flapEdgeColor: string
  flapEdgeAlpha: number
  flapEdgeWidth: number

  /** Hairline around the sheet, so it holds shape on light backgrounds. */
  outlineColor: string
  outlineAlpha: number
  outlineWidth: number
}

export const DEFAULT_ENVELOPE_STYLE: EnvelopeStyle = {
  cornerRadius: 14,
  flapTipOffset: 6,
  bottomApexOffset: -2,
  flapTipRadius: 7,

  bodyFrom: '#faf7f0',
  bodyTo: '#e6ded0',
  panelFrom: '#f2ebde',
  panelTo: '#ddd3bf',
  flapFrom: '#fffefc',
  flapTo: '#f4eee3',

  dropShadowColor: '#432869',
  dropShadowAlpha: 0.3,
  dropShadowBlur: 20,
  dropShadowOffsetY: 12,

  flapShadowColor: '#5e482c',
  flapShadowAlpha: 0.26,
  flapShadowBlur: 10,
  flapShadowOffsetY: 4,

  creaseColor: '#7e694c',
  creaseAlpha: 0.16,
  creaseWidth: 1.2,

  flapEdgeColor: '#7a6548',
  flapEdgeAlpha: 0.26,
  flapEdgeWidth: 1.3,

  outlineColor: '#786347',
  outlineAlpha: 0.26,
  outlineWidth: 1.2,
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Rounded rectangle with bezier corners, as used by every hero memory card. */
export function drawSquirclePath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const right = x + width
  const bottom = y + height
  const control = radius * 0.62

  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(right - radius, y)
  context.bezierCurveTo(right - control, y, right, y + control, right, y + radius)
  context.lineTo(right, bottom - radius)
  context.bezierCurveTo(right, bottom - control, right - control, bottom, right - radius, bottom)
  context.lineTo(x + radius, bottom)
  context.bezierCurveTo(x + control, bottom, x, bottom - control, x, bottom - radius)
  context.lineTo(x, y + radius)
  context.bezierCurveTo(x, y + control, x + control, y, x + radius, y)
  context.closePath()
}

/**
 * Three layers only: the body, the bottom panel folded up, and the flap over
 * both. Every layer shares one diagonal light direction so they read as
 * stacked paper rather than tinted overlays; only the tone changes, with the
 * flap lightest because it is on top and the folded panel darkest because it
 * is doubled paper.
 */
export function drawHeroEnvelope(
  context: CanvasRenderingContext2D,
  style: EnvelopeStyle = DEFAULT_ENVELOPE_STYLE,
) {
  const left = ENVELOPE_LEFT
  const top = ENVELOPE_TOP
  const right = left + ENVELOPE_WIDTH
  const bottom = top + ENVELOPE_HEIGHT
  const centerX = left + ENVELOPE_WIDTH / 2
  const centerY = top + ENVELOPE_HEIGHT / 2
  const radius = style.cornerRadius
  const flapTipY = centerY + style.flapTipOffset
  const bottomApexY = centerY + style.bottomApexOffset
  const tip = style.flapTipRadius

  const paperGradient = (from: string, to: string) => {
    const gradient = context.createLinearGradient(left, top, right, bottom)
    gradient.addColorStop(0, from)
    gradient.addColorStop(1, to)
    return gradient
  }

  context.save()
  context.lineCap = 'round'
  context.lineJoin = 'round'

  // Body: warm ivory writing stock.
  context.shadowColor = withAlpha(style.dropShadowColor, style.dropShadowAlpha)
  context.shadowBlur = style.dropShadowBlur
  context.shadowOffsetX = 0
  context.shadowOffsetY = style.dropShadowOffsetY

  context.fillStyle = paperGradient(style.bodyFrom, style.bodyTo)
  drawSquirclePath(context, left, top, ENVELOPE_WIDTH, ENVELOPE_HEIGHT, radius)
  context.fill()

  context.shadowColor = 'transparent'

  // The panels below are further layers of paper lying on the body, so clip
  // them to its outline: the rounded corners then come for free, and each
  // layer can cast a shadow without it spilling past the sheet.
  context.save()
  drawSquirclePath(context, left, top, ENVELOPE_WIDTH, ENVELOPE_HEIGHT, radius)
  context.clip()

  // Bottom panel folded up, apex just under where the flap will seal it.
  context.fillStyle = paperGradient(style.panelFrom, style.panelTo)
  context.beginPath()
  context.moveTo(left, bottom)
  context.lineTo(centerX, bottomApexY)
  context.lineTo(right, bottom)
  context.closePath()
  context.fill()

  context.strokeStyle = withAlpha(style.creaseColor, style.creaseAlpha)
  context.lineWidth = style.creaseWidth
  context.beginPath()
  context.moveTo(left, bottom)
  context.lineTo(centerX, bottomApexY)
  context.lineTo(right, bottom)
  context.stroke()

  // Flap last and lightest, so it reads as the sheet's top layer. Its cast
  // shadow is what separates it, not a difference in tint.
  context.shadowColor = withAlpha(style.flapShadowColor, style.flapShadowAlpha)
  context.shadowBlur = style.flapShadowBlur
  context.shadowOffsetY = style.flapShadowOffsetY

  context.fillStyle = paperGradient(style.flapFrom, style.flapTo)
  context.beginPath()
  context.moveTo(left, top)
  context.lineTo(right, top)
  context.lineTo(centerX + tip, flapTipY)
  context.quadraticCurveTo(centerX, flapTipY + tip, centerX - tip, flapTipY)
  context.closePath()
  context.fill()

  context.shadowColor = 'transparent'

  // Trace the free edge the same way round as the fill above: left corner,
  // down to the near side of the tip, across, then out to the right corner.
  // Reaching for the far side first draws a diagonal across the flap.
  context.strokeStyle = withAlpha(style.flapEdgeColor, style.flapEdgeAlpha)
  context.lineWidth = style.flapEdgeWidth
  context.beginPath()
  context.moveTo(left, top)
  context.lineTo(centerX - tip, flapTipY)
  context.quadraticCurveTo(centerX, flapTipY + tip, centerX + tip, flapTipY)
  context.lineTo(right, top)
  context.stroke()

  context.restore()

  context.strokeStyle = withAlpha(style.outlineColor, style.outlineAlpha)
  context.lineWidth = style.outlineWidth
  drawSquirclePath(context, left, top, ENVELOPE_WIDTH, ENVELOPE_HEIGHT, radius)
  context.stroke()

  context.restore()
}
