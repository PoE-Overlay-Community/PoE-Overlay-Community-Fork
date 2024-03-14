import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core'
import { Point } from '@app/type'
import type { Rectangle } from 'electron' //renderer
import { DirectiveUtils } from './directive-utils.directive'

enum Status {
  OFF = 0,
  RESIZE = 1,
  RESIZING = 2,
  MOVE = 3,
  MOVING = 4,
}

enum ResizeDir {
  NONE = 0,
  WIDTH = 1 << 0,
  HEIGHT = 1 << 1,
  BOTH = WIDTH | HEIGHT,
}

interface AppliedBounds {
  x: boolean
  y: boolean
  width: boolean
  height: boolean
}

@Directive({
  selector: '[appResizeDrag]',
})
export class ResizeDragDirective implements OnInit, OnChanges, OnDestroy {
  private element: HTMLElement
  private resizeAnchorContainer: HTMLElement
  private resizeAnchorWidth: HTMLElement
  private resizeAnchorHeight: HTMLElement
  private resizeAnchorBoth: HTMLElement
  private dragAreaExtension: HTMLElement

  private status: Status = Status.OFF
  private resizeDir: ResizeDir = ResizeDir.NONE

  private mouseDownPosition: Point
  private mouseDownBounds: Rectangle

  @Input('appResizeDrag')
  public rootElementSelector: string

  // tslint:disable-next-line:no-input-rename
  @Input('ardDisabled')
  public disabled: boolean

  // tslint:disable-next-line:no-input-rename
  @Input('ardInteractionsDisabled')
  public interactionsDisabled: boolean

  // tslint:disable-next-line:no-input-rename
  @Input('ardAllowResize')
  public allowResize: boolean

  // tslint:disable-next-line:no-input-rename
  @Input('ardExtendDragArea')
  public extendDragArea: boolean

  // tslint:disable-next-line:no-input-rename
  @Input('ardBounds')
  public bounds: Rectangle

  // tslint:disable-next-line:no-input-rename
  @Input('ardDragThreshold')
  public resizeDragThreshold = 5

  // tslint:disable-next-line:no-input-rename
  @Input('ardResizeWidth')
  public resizeWidth = 8

  // tslint:disable-next-line:no-input-rename
  @Input('ardAppliedBounds')
  public appliedBounds: AppliedBounds = { x: true, y: true, width: true, height: true }

  // tslint:disable-next-line:no-input-rename
  @Input('ardAppliedBounds.x')
  public set appliedBoundsX(val: boolean) {
    this.appliedBounds.x = val
  }

  // tslint:disable-next-line:no-input-rename
  @Input('ardAppliedBounds.y')
  public set appliedBoundsY(val: boolean) {
    this.appliedBounds.y = val
  }

  // tslint:disable-next-line:no-input-rename
  @Input('ardAppliedBounds.width')
  public set appliedBoundsWidth(val: boolean) {
    this.appliedBounds.width = val
  }

  // tslint:disable-next-line:no-input-rename
  @Input('ardAppliedBounds.height')
  public set appliedBoundsHeight(val: boolean) {
    this.appliedBounds.height = val
  }

  // tslint:disable-next-line:no-input-rename
  @Input('ardReversePosition.x')
  public reversePositionX: boolean

  // tslint:disable-next-line:no-input-rename
  @Input('ardReversePosition.y')
  public reversePositionY: boolean

  // tslint:disable-next-line:no-input-rename
  @Input('ardOffset.x')
  public offsetPositionX = 0

  // tslint:disable-next-line:no-input-rename
  @Input('ardOffset.y')
  public offsetPositionY = 0

  // tslint:disable-next-line:no-output-rename
  @Output('ardResizeDrag')
  public resizeDrag = new EventEmitter<Rectangle>()

  // tslint:disable-next-line:no-output-rename
  @Output('ardResizeDragBegin')
  public resizeDragBegin = new EventEmitter<Rectangle>()

  // tslint:disable-next-line:no-output-rename
  @Output('ardResizeDragEnd')
  public resizeDragEnd = new EventEmitter<Rectangle>()

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  public ngOnInit(): void {
    if (this.rootElementSelector) {
      this.element = DirectiveUtils.getClosestMatchingAncestor(
        this.elementRef.nativeElement,
        this.rootElementSelector
      )
    }
    this.element = this.element || this.elementRef.nativeElement
    this.element.addEventListener('mousedown', this.onMousedown, true)
    this.element.addEventListener('mouseup', this.onMouseup, true)
    this.element.addEventListener('mousemove', this.onMousemove, true)

    this.onChanged()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.onChanged()
  }

  public ngOnDestroy(): void {
    this.element.removeEventListener('mousedown', this.onMousedown)
    this.element.removeEventListener('mouseup', this.onMouseup)
    this.element.removeEventListener('mousemove', this.onMousemove)

    this.resizeAnchorContainer?.remove()
    this.resizeAnchorWidth = null
    this.resizeAnchorHeight = null
    this.resizeAnchorBoth = null
  }

  private onChanged(): void {
    if (!this.element) {
      return
    }

    if (this.extendDragArea && !this.dragAreaExtension) {
      this.dragAreaExtension = document.createElement('div')
      this.dragAreaExtension.style.display = 'none'
      this.dragAreaExtension.style.position = 'fixed'
      this.dragAreaExtension.style.left = '0px'
      this.dragAreaExtension.style.top = '0px'
      this.dragAreaExtension.style.width = '500px'
      this.dragAreaExtension.style.height = '500px'
      this.dragAreaExtension.style.transform = 'translate3d(-50%, -50%, 0)'
      this.dragAreaExtension.classList.add('interactable')

      this.element.append(this.dragAreaExtension)
    }

    if (this.allowResize && !this.resizeAnchorContainer) {
      this.resizeAnchorContainer = document.createElement('div')
      this.resizeAnchorContainer.classList.add('interactable')
      this.resizeAnchorContainer.style.display = 'inline-grid'
      this.resizeAnchorContainer.style.position = 'absolute'
      this.resizeAnchorContainer.style.top = '0px'
      this.resizeAnchorContainer.style.left = '0px'
      this.resizeAnchorContainer.style['grid-auto-flow'] = 'row'
      const templateColRows = `auto ${this.resizeWidth}px`
      this.resizeAnchorContainer.style['grid-template-columns'] = templateColRows
      this.resizeAnchorContainer.style['grid-template-rows'] = templateColRows

      const topLeftDragArea = document.createElement('div')
      topLeftDragArea.style.cursor = 'move'
      this.resizeAnchorContainer.appendChild(topLeftDragArea)

      const resizeWidthHeight = `${this.resizeWidth * 2}px`
      const resizeBGColor = 'rgb(0, 0, 0, 0.01)'

      this.resizeAnchorWidth = document.createElement('div')
      this.resizeAnchorWidth.style.width = resizeWidthHeight
      this.resizeAnchorWidth.style.cursor = 'e-resize'
      this.resizeAnchorWidth.style['background-color'] = resizeBGColor
      this.resizeAnchorContainer.appendChild(this.resizeAnchorWidth)

      this.resizeAnchorHeight = document.createElement('div')
      this.resizeAnchorHeight.style.height = resizeWidthHeight
      this.resizeAnchorHeight.style.cursor = 's-resize'
      this.resizeAnchorHeight.style['background-color'] = resizeBGColor
      this.resizeAnchorContainer.appendChild(this.resizeAnchorHeight)

      this.resizeAnchorBoth = document.createElement('div')
      this.resizeAnchorBoth.style.transform = 'rotateZ(45deg)'
      this.resizeAnchorBoth.style['border-style'] = 'solid'
      this.resizeAnchorBoth.style['border-width'] = `${this.resizeWidth}px`
      this.resizeAnchorBoth.style['border-color'] = 'transparent transparent transparent yellow'
      this.resizeAnchorBoth.style.cursor = 'nwse-resize'
      this.resizeAnchorContainer.appendChild(this.resizeAnchorBoth)

      this.element.append(this.resizeAnchorContainer)
    }

    this.applyBounds()
  }

  private applyBounds(): void {
    if (this.disabled) {
      return
    }

    if (this.appliedBounds.x) {
      const posX = this.bounds.x + this.offsetPositionX
      if (this.reversePositionX) {
        const right = this.element.offsetParent.scrollWidth - posX
        this.element.style.right = `${right}px`
        this.element.style.removeProperty('left')
      } else {
        this.element.style.left = `${posX}px`
        this.element.style.removeProperty('right')
      }
    }

    if (this.appliedBounds.y) {
      const posY = this.bounds.y + this.offsetPositionY
      if (this.reversePositionY) {
        const bottom = this.element.offsetParent.scrollHeight - posY
        this.element.style.bottom = `${bottom}px`
        this.element.style.removeProperty('top')
      } else {
        this.element.style.top = `${posY}px`
        this.element.style.removeProperty('bottom')
      }
    }

    const width = `${this.bounds.width}px`
    if (this.appliedBounds.width) this.element.style.width = width
    if (this.resizeAnchorContainer) this.resizeAnchorContainer.style.width = width

    const height = `${this.bounds.height}px`
    if (this.appliedBounds.height) this.element.style.height = height
    if (this.resizeAnchorContainer) this.resizeAnchorContainer.style.height = height
  }

  private onMousedown = (event: MouseEvent) => {
    if (this.disabled || this.interactionsDisabled || this.status !== Status.OFF) {
      return
    }
    const point: Point = {
      x: event.clientX,
      y: event.clientY,
    }
    if (!this.overlaps(this.element, point)) {
      return
    }

    this.mouseDownPosition = point
    this.mouseDownBounds = { ...this.bounds }

    if (this.overlaps(this.resizeAnchorWidth, point)) {
      this.status = Status.RESIZE
      this.resizeDir = ResizeDir.WIDTH
    } else if (this.overlaps(this.resizeAnchorHeight, point)) {
      this.status = Status.RESIZE
      this.resizeDir = ResizeDir.HEIGHT
    } else if (this.overlaps(this.resizeAnchorBoth, point)) {
      this.status = Status.RESIZE
      this.resizeDir = ResizeDir.BOTH
    } else {
      this.status = Status.MOVE
    }

    this.resizeDragBegin.emit(this.bounds)
  }

  private onMouseup = () => {
    if (this.disabled || this.interactionsDisabled || this.status === Status.OFF) {
      return
    }

    const oldStatus = this.status
    this.status = Status.OFF
    this.resizeDir = ResizeDir.NONE

    if (this.dragAreaExtension) this.dragAreaExtension.style.display = 'none'

    switch (oldStatus) {
      case Status.MOVING:
      case Status.RESIZING:
        this.resizeDragEnd.emit(this.bounds)
    }
  }

  private onMousemove = (event: MouseEvent) => {
    if (this.disabled || this.interactionsDisabled || this.status === Status.OFF) {
      return
    }

    event.preventDefault()
    event.stopImmediatePropagation()

    const delta = {
      x: event.clientX - this.mouseDownPosition.x,
      y: event.clientY - this.mouseDownPosition.y,
    }

    if (this.dragAreaExtension) this.dragAreaExtension.style.display = 'block'

    switch (this.status) {
      case Status.MOVE:
      case Status.RESIZE:
        if (Math.abs(delta.x) + Math.abs(delta.y) >= this.resizeDragThreshold) {
          this.status++
        } else {
          return
        }
        break
    }

    switch (this.status) {
      case Status.MOVING:
        this.bounds.x = this.mouseDownBounds.x + delta.x
        this.bounds.y = this.mouseDownBounds.y + delta.y
        break
      case Status.RESIZING:
        if ((this.resizeDir & ResizeDir.WIDTH) !== 0)
          this.bounds.width = this.mouseDownBounds.width + delta.x
        if ((this.resizeDir & ResizeDir.HEIGHT) !== 0)
          this.bounds.height = this.mouseDownBounds.height + delta.y
        break
    }

    if (this.dragAreaExtension) {
      this.dragAreaExtension.style.left = `${event.clientX}px`
      this.dragAreaExtension.style.top = `${event.clientY}px`
    }

    this.applyBounds()
    this.resizeDrag.emit(this.bounds)
  }

  private overlaps(element: HTMLElement, point: Point): boolean {
    if (!element) {
      return false
    }
    const elementBounds = element.getBoundingClientRect()
    if (
      point.x >= elementBounds.left &&
      point.x <= elementBounds.right &&
      point.y >= elementBounds.top &&
      point.y < elementBounds.bottom
    ) {
      return true
    }
    return false
  }
}
