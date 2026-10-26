import { describe, expect, test } from 'vitest'
import { categoryStyle, MARKER_KINDS_STYLED } from './categoryStyle'

/** WCAG contrast ratio of a #rrggbb colour against white. */
function contrastWithWhite(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
  return 1.05 / (luminance + 0.05)
}

describe('categoryStyle', () => {
  test.each([
    [{ category: 'food', subtype: null }, '#c2410c', '🍽️'],
    [{ category: 'cafe', subtype: null }, '#92400e', '☕'],
    [{ category: 'bar', subtype: null }, '#7c3aed', '🍸'],
    [{ category: 'activity', subtype: null }, '#15803d', '🏞️'],
    [{ category: 'shopping', subtype: null }, '#be185d', '🛍️'],
    [{ category: 'facility', subtype: 'toilet' }, '#1d4ed8', '🚻'],
    [{ category: 'facility', subtype: 'parking' }, '#1d4ed8', '🅿️'],
    [{ category: 'facility', subtype: 'information' }, '#1d4ed8', 'ℹ️'],
    [{ category: 'facility', subtype: 'library' }, '#1d4ed8', '📚'],
    [{ category: 'facility', subtype: 'medical' }, '#1d4ed8', '🏥'],
    [{ category: 'facility', subtype: 'other' }, '#1d4ed8', '📍'],
    ['event', '#0e7490', '🎉'],
    ['notice', '#b91c1c', '⚠️'],
  ] as const)('%j is %s with %s', (kind, color, emoji) => {
    expect(categoryStyle(kind)).toEqual({ color, emoji })
  })

  test('a facility without a subtype still has its colour and a pin', () => {
    expect(categoryStyle({ category: 'facility', subtype: null })).toEqual({ color: '#1d4ed8', emoji: '📍' })
  })

  test('white text is readable on every colour (4.5:1 or more)', () => {
    for (const kind of MARKER_KINDS_STYLED) {
      expect(contrastWithWhite(categoryStyle(kind).color), JSON.stringify(kind)).toBeGreaterThanOrEqual(4.5)
    }
  })
})
