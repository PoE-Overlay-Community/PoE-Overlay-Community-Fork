export abstract class ObjectUtils {
  public static deepCopy(item: any): any {
    return this.merge({}, item)
  }

  public static merge(left: any, right: any): any {
    return Object.keys(right).reduce((result, currentKey) => {
      const rightValue = right[currentKey]
      const leftValue = result[currentKey]
      const rightValueType = typeof rightValue
      const leftValueType = typeof leftValue
      if (leftValue && rightValue && (leftValueType != rightValueType || Array.isArray(leftValue) != Array.isArray(rightValue))) {
        result[currentKey] = leftValue
        return result
      }
      if (rightValue && Array.isArray(rightValue)) {
        if (leftValue) {
          const merged = [...leftValue]
          rightValue.forEach((value, index) => {
            switch (typeof value) {
              case 'object':
                merged[index] = this.merge(leftValue[index], value)
                break

              default:
                merged[index] = value
                break
            }
          })
          result[currentKey] = merged
        } else {
          result[currentKey] = rightValue
        }
      } else {
        switch (rightValueType) {
          case 'object':
            result[currentKey] = this.merge(leftValue, rightValue)
            break

          default:
            result[currentKey] = rightValue
            break
        }
      }
      return result
    }, { ...left })
  }
}
