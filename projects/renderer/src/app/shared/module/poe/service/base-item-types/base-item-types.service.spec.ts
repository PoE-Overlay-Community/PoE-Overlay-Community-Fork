import { async, TestBed } from '@angular/core/testing'
import { SharedModule } from '@shared/shared.module'
import { Language } from '../../type'
import { ContextService } from '../context.service'
import { BaseItemTypesService } from './base-item-types.service'

describe('BaseItemTypeService', () => {
  let sut: BaseItemTypesService
  let contextService: ContextService
  beforeEach((done) => {
    TestBed.configureTestingModule({
      imports: [SharedModule],
    }).compileComponents()
    sut = TestBed.inject<BaseItemTypesService>(BaseItemTypesService)

    contextService = TestBed.inject<ContextService>(ContextService)
    contextService
      .init({
        language: Language.English,
      })
      .subscribe(() => done())
  })

  const languages: Language[] = [
    Language.English,
    Language.German,
    Language.French,
    Language.Korean,
    Language.Russian,
  ]
  const texts = ['Orbe du chaos', `Pierre à aiguiser de forgeron`]
  texts.forEach((text) => {
    languages.forEach((language) => {
      it(`should search for text: '${text}' in French and translate in '${Language[language]}'`, () => {
        const id = sut.searchId(text, Language.French)
        expect(id).toBeTruthy()
        const localizedText = sut.translate(id, language)
        expect(localizedText.indexOf('untranslated') === -1).toBeTruthy()
      })
    })
  })

  it(`should find 'Blighted Port Map'`, () => {
    const result = sut.searchId('Blighted Port Map', Language.English)
    expect(result).toBe('MapWorldsPort')
  })

  it(`should find 'Port Map'`, () => {
    const result = sut.searchId('Port Map', Language.English)
    expect(result).toBe('MapWorldsPort')
  })

  it(`should find 'Vaal Summon Skeletons'`, () => {
    const result = sut.searchId('Vaal Summon Skeletons', Language.English)
    expect(result).toBe('SkillGemVaalSummonSkeletons')
  })

  it(`should find 'Fingerless Silk Gloves'`, () => {
    const result = sut.searchId('Fingerless Silk Gloves of Expulsion', Language.English)
    expect(result).toBe('GlovesAtlasInt')
  })

  it(`should find 'Silk Gloves'`, () => {
    const result = sut.searchId('Silk Gloves', Language.English)
    expect(result).toBe('GlovesInt3')
  })

  it(`should find 'The Shaper's Amber Amulet of Expulsion`, () => {
    const result = sut.searchId(`The Shaper's Amber Amulet of Expulsion`, Language.English)
    expect(result).toBe('Amulet3')
  })

  it(`should find 'Titan's Arcade Map of Temporal Chains`, () => {
    const result = sut.searchId(`Titan's Arcade Map of Temporal Chains`, Language.English)
    expect(result).toBe('MapWorldsArcade')
  })
})
