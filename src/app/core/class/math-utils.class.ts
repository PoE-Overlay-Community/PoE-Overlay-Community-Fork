export abstract class MathUtils {
  public static clamp(value: number, min: number, max: number): number {
    if (value < min) {
      value = min
    } else if (value > max) {
      value = max
    }
    return value
  }

  public static significantDecimalCount(numerator: number, denominator: number): number {
    return (denominator.toString().length - numerator.toString().length + 3)
  }

  public static floor(value: number, numDecimals: number): number {
    const decimals = Math.pow(10, numDecimals)
    return Math.floor(value * decimals) / decimals
  }
}
