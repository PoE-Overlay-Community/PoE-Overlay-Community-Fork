import { Injectable } from '@angular/core'
import { ObjectUtils } from '@app/class'
import { FeatureModule, UiLanguage } from '@app/type'
import { Language } from '@shared/module/poe/type'
import { Observable } from 'rxjs'
import { flatMap, map } from 'rxjs/operators'
import { DialogSpawnPosition, UserSettings, UserSettingsFeature } from '../type'
import { UserSettingsFeatureService } from './user-settings-feature.service'
import { UserSettingsStorageService } from './user-settings-storage.service'

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  constructor(
    private readonly userSettingsStorageService: UserSettingsStorageService,
    private readonly userSettingsFeatureService: UserSettingsFeatureService
  ) {}

  public get(): Observable<UserSettings> {
    return this.userSettingsStorageService.get()
  }

  public save(settings: UserSettings): Observable<UserSettings> {
    return this.userSettingsStorageService.save(settings)
  }

  public features(): UserSettingsFeature[] {
    return this.userSettingsFeatureService.get()
  }

  public init(modules: FeatureModule[]): Observable<UserSettings> {
    return this.get().pipe(
      flatMap((savedSettings) => {
        let mergedSettings: UserSettings = {
          openUserSettingsKeybinding: 'F7',
          exitAppKeybinding: 'F8',
          language: Language.English,
          gameLanguage: Language.English,
          uiLanguage: UiLanguage.English,
          zoom: 100,
          dialogSpawnPosition: DialogSpawnPosition.Center,
          dialogOpacity: 0.8,
          displayVersion: true,
          autoDownload: true,
          focusable: true,
        }

        modules.forEach((x) => {
          const featureSettings = x.getSettings()
          mergedSettings = ObjectUtils.merge(mergedSettings, featureSettings.defaultSettings)
          this.userSettingsFeatureService.register(featureSettings)
        })

        mergedSettings = ObjectUtils.merge(mergedSettings, savedSettings)

        return this.userSettingsStorageService.save(mergedSettings)
      })
    )
  }

  public update<TUserSettings extends UserSettings>(
    updateFn: (settings: TUserSettings) => UserSettings
  ): Observable<TUserSettings> {
    return this.userSettingsStorageService.get().pipe(
      flatMap((settings) =>
        this.userSettingsStorageService.save(updateFn(settings as TUserSettings))
      ),
      map((settings) => settings as TUserSettings)
    )
  }
}
