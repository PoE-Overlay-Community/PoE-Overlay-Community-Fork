export abstract class DirectiveUtils {
  /** Gets the closest ancestor of an element that matches a selector. */
  public static getClosestMatchingAncestor(element: HTMLElement, selector: string): HTMLElement {
    let currentElement = element.parentElement as HTMLElement | null

    while (currentElement) {
      // IE doesn't support `matches` so we have to fall back to `msMatchesSelector`.
      if (
        currentElement.matches
          ? currentElement.matches(selector)
          : (currentElement as any).msMatchesSelector(selector)
      ) {
        return currentElement
      }

      currentElement = currentElement.parentElement
    }

    return null
  }
}
