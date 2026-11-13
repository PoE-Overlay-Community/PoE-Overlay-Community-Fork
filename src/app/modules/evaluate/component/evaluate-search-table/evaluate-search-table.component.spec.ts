import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { SharedModule } from '@shared/shared.module'
import { EvaluateSearchTableComponent } from './evaluate-search-table.component'

describe('EvaluateSearchTableComponent', () => {
  let component: EvaluateSearchTableComponent
  let fixture: ComponentFixture<EvaluateSearchTableComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
      declarations: [EvaluateSearchTableComponent],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(EvaluateSearchTableComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
