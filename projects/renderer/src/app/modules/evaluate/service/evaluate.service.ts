import { Injectable } from '@angular/core'
import { SnackBarService } from '@shared/module/material/service'
import {
  ItemClipboardResultCode,
  ItemClipboardService,
  ItemProcessorService,
  StashService,
} from '@shared/module/poe/service'
import { Language } from '@shared/module/poe/type'
import { Observable, of, throwError } from 'rxjs'
import { catchError, flatMap, tap } from 'rxjs/operators'
import { EvaluateUserSettings } from '../component/evaluate-settings/evaluate-settings.component'
import { EvaluateDialogService } from './evaluate-dialog.service'

@Injectable({
  providedIn: 'root',
})
export class EvaluateService {
  constructor(
    private readonly item: ItemClipboardService,
    private readonly processor: ItemProcessorService,
    private readonly stash: StashService,
    private readonly snackbar: SnackBarService,
    private readonly evaluateDialog: EvaluateDialogService
  ) {}

  public evaluate(settings: EvaluateUserSettings, language?: Language, gameLanguage?: Language): Observable<void> {
    return this.item.copy(settings.evaluateCopyAdvancedItemText).pipe(
      tap(({ item }) =>
        this.processor.process(item, {
          normalizeQuality: settings.evaluateQueryNormalizeQuality,
          processClusterJewels: settings.evaluateQueryPostProcessClusterJewels,
        })
      ),
      flatMap(({ code, point, item }) => {
        switch (code) {
          case ItemClipboardResultCode.Success:
            return this.evaluateDialog.open(point, item, settings, language, gameLanguage).pipe(
              flatMap((result) => {
                if (!result) {
                  return of(null)
                }

                this.stash.copyPrice(result)
                return this.snackbar.info('evaluate.tag.clipboard')
              })
            )
          case ItemClipboardResultCode.Empty:
            return this.snackbar.warning('clipboard.empty')
          case ItemClipboardResultCode.ParserError:
            return this.snackbar.warning('clipboard.parser-error')
          default:
            return throwError(`code: '${code}' out of range`)
        }
      }),
      catchError((err) => {
        console.error(err)
        return this.snackbar.error('clipboard.error')
      })
    )
  }
}
