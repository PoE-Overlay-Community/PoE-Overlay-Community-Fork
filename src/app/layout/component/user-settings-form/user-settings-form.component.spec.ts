import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { ElectronProvider } from '@app/provider'
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { SharedModule } from '@shared/shared.module'
import { UserSettingsFormComponent } from './user-settings-form.component'

class ElectronProviderFake {
  public provideRemote(): any {
    return {
      getCurrentWindow: () => null,
    }
  }

  public provideIpcRenderer(): any {
    return {
      once: () => null,
      send: () => null,
    }
  }
}

describe('UserSettingsFormComponent', () => {
  let component: UserSettingsFormComponent
  let fixture: ComponentFixture<UserSettingsFormComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: () => new TranslateFakeLoader(),
          },
        }),
      ],
      declarations: [UserSettingsFormComponent],
      providers: [{ provide: ElectronProvider, useClass: ElectronProviderFake }],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSettingsFormComponent)
    component = fixture.componentInstance
    component.settings = {}
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
