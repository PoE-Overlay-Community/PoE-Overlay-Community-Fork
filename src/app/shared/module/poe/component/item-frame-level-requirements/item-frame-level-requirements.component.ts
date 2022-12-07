import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ClientStringService } from '../../service/client-string/client-string.service'
import { CharacterClass, Item, Language } from '../../type'

@Component({
  selector: 'app-item-frame-level-requirements',
  templateUrl: './item-frame-level-requirements.component.html',
  styleUrls: ['./item-frame-level-requirements.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFrameLevelRequirementsComponent {
  @Input()
  public item: Item

  @Input()
  public queryItem: Item

  @Input()
  public language: Language

  constructor(
    private readonly clientString: ClientStringService,
  ) { }

  public getCharacterClassString(): string {
    switch (this.item.requirements.class) {
      case CharacterClass.Marauder:
        return this.clientString.translate('CharacterName0')
      case CharacterClass.Witch:
        return this.clientString.translate('CharacterName1')
      case CharacterClass.Scion:
        return this.clientString.translate('CharacterName2')
      case CharacterClass.Ranger:
        return this.clientString.translate('CharacterName3')
      case CharacterClass.Duelist:
        return this.clientString.translate('CharacterName4')
      case CharacterClass.Shadow:
        return this.clientString.translate('CharacterName5')
      case CharacterClass.Templar:
        return this.clientString.translate('CharacterName6')
    }
  }
}
