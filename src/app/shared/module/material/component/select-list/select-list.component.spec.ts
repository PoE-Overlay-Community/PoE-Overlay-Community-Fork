import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core'
import { SharedModule } from '@shared/shared.module'
import { SelectListComponent } from './select-list.component'

describe('SelectListComponent', () => {
  let component: SelectListComponent
  let fixture: ComponentFixture<SelectListComponent>

  beforeEach(waitForAsync(() => {
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
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectListComponent)
    component = fixture.componentInstance
    component.items = []
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
