import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewContainerRef,
} from '@angular/core'
import { UserSettings, UserSettingsComponent } from '../../type'

@Component({
  selector: 'app-user-settings-feature-container',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UserSettingsFeatureContainerComponent implements OnInit, OnDestroy {
  private componentRef: ComponentRef<UserSettingsComponent>

  @Input()
  public component: Type<UserSettingsComponent>

  @Input()
  public settings: UserSettings

  @Input()
  public defaultSettings: UserSettings

  public get instance(): UserSettingsComponent {
    return this.componentRef ? this.componentRef.instance : null
  }

  constructor(private readonly viewContainerRef: ViewContainerRef) {}

  public ngOnInit(): void {
    if (!this.component) {
      return
    }

    this.viewContainerRef.clear()
    this.componentRef = this.viewContainerRef.createComponent(this.component)
    this.instance.settings = this.settings
    this.instance.defaultSettings = this.defaultSettings
    this.instance.load()
  }

  public ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy()
      this.componentRef = null
    }
  }
}
