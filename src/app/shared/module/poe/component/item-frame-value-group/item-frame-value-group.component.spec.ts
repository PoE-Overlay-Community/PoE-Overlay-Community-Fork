import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing'
import { ItemFrameValueGroupComponent } from './item-frame-value-group.component'

describe('ItemFrameValueGroupComponent', () => {
  let component: ItemFrameValueGroupComponent
  let fixture: ComponentFixture<ItemFrameValueGroupComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ItemFrameValueGroupComponent],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemFrameValueGroupComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
