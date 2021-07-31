import { MathUtils } from './math-utils.class'

const MAX_RGB = 255

export interface Color {
  r: number
  g: number
  b: number
  a: number
}

export abstract class ColorUtils {
  public static create(r: number, g: number, b: number, a?: number): Color {
    return {
      r: MathUtils.clamp(r, 0, MAX_RGB),
      g: MathUtils.clamp(g, 0, MAX_RGB),
      b: MathUtils.clamp(b, 0, MAX_RGB),
      a: MathUtils.clamp(!a && a !== 0 ? 1 : a, 0, 1),
    }
  }

  public static update(color: Color, input: string): void {
    const newColor = ColorUtils.fromString(input)
    color.r = newColor.r
    color.g = newColor.g
    color.b = newColor.b
    color.a = newColor.a
  }

  public static toRGBA(color: Color): string {
    if (color.a === 1) {
      return `rgb(${color.r},${color.g},${color.b})`
    } else {
      return `rgba(${color.r},${color.g},${color.b},${color.a})`
    }
  }

  public static fromArray(array: number[]): Color {
    return {
      r: array[0],
      g: array[1],
      b: array[2],
      a: array.length === 4 ? array[3] : 1,
    }
  }

  // A magical function copied from here: https://stackoverflow.com/a/21966100
  public static fromString(input: string): Color {
    if (input.substr(0, 1) === '#') {
      const collen = (input.length - 1) / 3
      const fact = [17, 1, 0.062272][collen - 1]
      return ColorUtils.fromArray([
        Math.round(parseInt(input.substr(1, collen), 16) * fact),
        Math.round(parseInt(input.substr(1 + collen, collen), 16) * fact),
        Math.round(parseInt(input.substr(1 + 2 * collen, collen), 16) * fact),
      ])
    } else {
      const colors = input
        .split('(')[1]
        .split(')')[0]
        .split(',')
        .map((x) => +x)
      return ColorUtils.fromArray(colors)
    }
  }
}

export abstract class Colors {
  public static get transparent(): Color {
    return ColorUtils.create(0, 0, 0, 0)
  }
  public static get yellow(): Color {
    return ColorUtils.create(255, 255, 0)
  }
  public static get black(): Color {
    return ColorUtils.create(0, 0, 0)
  }
}
