import { Injectable } from '@angular/core'
import { VisibleFlag } from '@app/type/app.type'
import { BehaviorSubject, Observable, Subscription } from 'rxjs'
import { ShortcutService } from '@app/service/input'

export type DialogCloseFn = () => void

export enum DialogType {
  None = 0,
  Dialog = 1,
  Browser = 2,
}

export interface Dialog {
  close: DialogCloseFn
  type: DialogType
}

const dialogServiceRef = 'dialog-service'

@Injectable({
  providedIn: 'root',
})
export class DialogRefService {
  private readonly dialogs: Dialog[] = []
  private readonly dialogsChange$ = new BehaviorSubject<Dialog[]>([])

  private escapeSubscription: Subscription
  private spaceSubscription: Subscription

  constructor(private readonly shortcutService: ShortcutService) {}

  public register(): void {
    if (!this.escapeSubscription) {
      const clearShortcut = () => {
        this.escapeSubscription?.unsubscribe()
        this.escapeSubscription = null
      }

      this.escapeSubscription = this.shortcutService
        .add(
          'escape',
          dialogServiceRef,
          false,
          VisibleFlag.Game | VisibleFlag.Dialog,
          VisibleFlag.Overlay | VisibleFlag.Dialog,
          VisibleFlag.Browser
        )
        .subscribe(() => this.close(), clearShortcut, clearShortcut)
    }

    if (!this.spaceSubscription) {
      const clearShortcut = () => {
        this.spaceSubscription?.unsubscribe()
        this.spaceSubscription = null
      }

      this.spaceSubscription = this.shortcutService
        .add(
          'space',
          dialogServiceRef,
          false,
          VisibleFlag.Game | VisibleFlag.Dialog,
          VisibleFlag.Overlay | VisibleFlag.Dialog
        )
        .subscribe(() => this.closeAll(), clearShortcut, clearShortcut)
    }

    this.shortcutService.enableAllByRef(dialogServiceRef)
  }

  public reset(): void {
    this.shortcutService.disableAllByRef(dialogServiceRef)
    this.closeAll()
  }

  public dialogsChange(): Observable<Dialog[]> {
    return this.dialogsChange$
  }

  public add(dialog: Dialog): void {
    this.dialogs.push(dialog)
    this.dialogsChange$.next(this.dialogs)
  }

  public remove(dialog: Dialog): void {
    const index = this.dialogs.indexOf(dialog)
    if (index !== -1) {
      this.dialogs.splice(index, 1)
      this.dialogsChange$.next(this.dialogs)
    }
  }

  private close(): void {
    if (this.dialogs.length > 0) {
      this.dialogs.pop().close()
      this.dialogsChange$.next(this.dialogs)
    }
  }

  private closeAll(): void {
    while (this.dialogs.length > 0) {
      this.close()
    }
  }
}
