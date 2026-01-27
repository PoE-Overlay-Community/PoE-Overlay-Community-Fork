import { cyrb53 } from './hash'

describe('cyrb53', () => {
  it('returns stable hash for empty string', () => {
    expect(cyrb53('')).toBe(3338908027751811)
  })

  it('returns stable hash for a string with default seed', () => {
    expect(cyrb53('hello')).toBe(4625896200565286)
  })

  it('returns different hashes for different seeds', () => {
    expect(cyrb53('hello', 1)).toBe(6922249475667011)
  })

  it('distinguishes similar strings', () => {
    expect(cyrb53('PoE-Overlay')).toBe(8999423255808001)
    expect(cyrb53('PoE-Overlay-Community')).not.toBe(8999423255808001)
  })
})
