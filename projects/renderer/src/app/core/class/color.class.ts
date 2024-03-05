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
      a: MathUtils.clamp(!a && a !== 0 ? 1 : (Math.abs(a) < 1e-10 ? 0 : a), 0, 1),
    }
  }

  public static copy(color: Color): Color {
    return ColorUtils.create(color.r, color.g, color.b, color.a)
  }

  public static update(color: Color, input: string): void {
    const newColor = ColorUtils.fromString(input)
    color.r = newColor.r
    color.g = newColor.g
    color.b = newColor.b
    color.a = newColor.a
  }

  public static toRGBA(color: Color): string {
    if (!color) {
      console.log(`[Color] toRGBA input color is invalid! (using backup color)\n${(new Error()).stack}`)
      color = Colors.magenta
    }
    if (color.a === 1) {
      return `rgb(${color.r},${color.g},${color.b})`
    } else {
      return `rgba(${color.r},${color.g},${color.b},${color.a})`
    }
  }

  public static fromArray(array: number[]): Color {
    return ColorUtils.create(array[0], array[1], array[2], array.length === 4 ? array[3] : undefined)
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
  public static get white(): Color {
    return ColorUtils.create(255, 255, 255)
  }
  public static get black(): Color {
    return ColorUtils.create(0, 0, 0)
  }
  public static get red(): Color {
    return ColorUtils.create(255, 0, 0)
  }
  public static get green(): Color {
    return ColorUtils.create(0, 255, 0)
  }
  public static get blue(): Color {
    return ColorUtils.create(0, 0, 255)
  }
  public static get cyan(): Color {
    return ColorUtils.create(0, 255, 255)
  }
  public static get magenta(): Color {
    return ColorUtils.create(255, 0, 255)
  }
  public static get lightgreen(): Color {
    return ColorUtils.create(144, 238, 144)
  }
  public static get royalblue(): Color {
    return ColorUtils.create(65, 105, 225)
  }
  public static get lightSeaGreen(): Color {
    return ColorUtils.create(32, 178, 170)
  }
  public static get chocolate(): Color {
    return ColorUtils.create(210, 105, 30)
  }
}
