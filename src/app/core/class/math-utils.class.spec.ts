import { MathUtils } from './math-utils.class'

describe('MathUtils', () => {
  describe('clamp', () => {
    it('returns min when value is below range', () => {
      expect(MathUtils.clamp(-5, 0, 10)).toBe(0)
    })

    it('returns max when value is above range', () => {
      expect(MathUtils.clamp(15, 0, 10)).toBe(10)
    })

    it('returns value when within range', () => {
      expect(MathUtils.clamp(5, 0, 10)).toBe(5)
    })
  })

  describe('significantDecimalCount', () => {
    it('accounts for numerator and denominator length', () => {
      expect(MathUtils.significantDecimalCount(1, 100)).toBe(5)
    })

    it('handles larger numerator values', () => {
      expect(MathUtils.significantDecimalCount(100, 1)).toBe(1)
    })
  })

  describe('floor', () => {
    it('floors to the requested decimal count', () => {
      expect(MathUtils.floor(1.239, 2)).toBe(1.23)
    })

    it('floors to whole numbers when decimal count is zero', () => {
      expect(MathUtils.floor(1.9, 0)).toBe(1)
    })

    it('floors negative values correctly', () => {
      expect(MathUtils.floor(-1.234, 2)).toBe(-1.24)
    })
  })
})
