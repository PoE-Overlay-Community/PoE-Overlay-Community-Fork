import { async, ComponentFixture, TestBed } from '@angular/core/testing'
import { SharedModule } from '@shared/shared.module'
import { ItemCategory, Language } from '../../type'
import { ItemFramePropertiesComponent } from './item-frame-properties.component'

describe('ItemFramePropertiesComponent', () => {
  let component: ItemFramePropertiesComponent
  let fixture: ComponentFixture<ItemFramePropertiesComponent>

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemFramePropertiesComponent)
    component = fixture.componentInstance
    component.item = {
      influences: {},
      damage: {},
      stats: [],
      properties: {},
      requirements: {},
      sockets: [],
      category: ItemCategory.Map,
    }
    component.queryItem = component.item
    component.language = Language.English
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
