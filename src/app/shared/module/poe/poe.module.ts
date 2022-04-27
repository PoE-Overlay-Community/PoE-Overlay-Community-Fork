import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BrowserModule } from '@angular/platform-browser'
import { TranslateModule } from '@ngx-translate/core'
import { MaterialModule } from '../material/material.module'
import { AudioClipSettingsComponent } from './component/audio-clip-settings/audio-clip-settings.component'
import { ColorPickerSettingsComponent } from './component/color-picker-settings/color-picker-settings.component'
import { CurrencyFrameComponent } from './component/currency-frame/currency-frame.component'
import { CurrencyRatioFrameComponent } from './component/currency-ratio-frame/currency-ratio-frame.component'
import { ItemFrameAnnointmentComponent } from './component/item-frame-annointment/item-frame-annointment.component'
import { ItemFrameHeaderComponent } from './component/item-frame-header/item-frame-header.component'
import { ItemFrameInfluencesComponent } from './component/item-frame-influences/item-frame-influences.component'
import { ItemFrameLevelRequirementsComponent } from './component/item-frame-level-requirements/item-frame-level-requirements.component'
import { ItemFramePropertiesHeistComponent } from './component/item-frame-properties-heist/item-frame-properties-heist.component'
import { ItemFramePropertiesIncursionComponent } from './component/item-frame-properties-incursion/item-frame-properties-incursion.component'
import { ItemFramePropertiesUltimatumComponent } from './component/item-frame-properties-ultimatum/item-frame-properties-ultimatum.component'
import { ItemFramePropertiesComponent } from './component/item-frame-properties/item-frame-properties.component'
import { ItemFrameQueryComponent } from './component/item-frame-query/item-frame-query.component'
import { ItemFrameSeparatorComponent } from './component/item-frame-separator/item-frame-separator.component'
import { ItemFrameSocketsComponent } from './component/item-frame-sockets/item-frame-sockets.component'
import { ItemFrameStateComponent } from './component/item-frame-state/item-frame-state.component'
import { ItemFrameStatsComponent } from './component/item-frame-stats/item-frame-stats.component'
import { ItemFrameValueGroupComponent } from './component/item-frame-value-group/item-frame-value-group.component'
import { ItemFrameValueInputComponent } from './component/item-frame-value-input/item-frame-value-input.component'
import { ItemFrameValueComponent } from './component/item-frame-value/item-frame-value.component'
import { ItemFrameComponent } from './component/item-frame/item-frame.component'
import { BaseItemTypePipe } from './pipe/base-item-type.pipe'
import { ClientStringPipe } from './pipe/client-string.pipe'
import { Nl2BrPipe } from './pipe/nl2br.pipe'
import { StatGroupPipe } from './pipe/stat-group.pipe'
import { StatTransformPipe } from './pipe/stat-transform.pipe'
import { WordPipe } from './pipe/word.pipe'

@NgModule({
  declarations: [
    ItemFrameComponent,
    CurrencyFrameComponent,
    CurrencyRatioFrameComponent,
    ClientStringPipe,
    StatGroupPipe,
    StatTransformPipe,
    WordPipe,
    BaseItemTypePipe,
    Nl2BrPipe,
    ItemFrameQueryComponent,
    ItemFrameValueComponent,
    ItemFrameValueGroupComponent,
    ItemFrameHeaderComponent,
    ItemFrameSeparatorComponent,
    ItemFrameInfluencesComponent,
    ItemFramePropertiesComponent,
    ItemFramePropertiesUltimatumComponent,
    ItemFramePropertiesIncursionComponent,
    ItemFramePropertiesHeistComponent,
    ItemFrameSocketsComponent,
    ItemFrameLevelRequirementsComponent,
    ItemFrameStatsComponent,
    ItemFrameStateComponent,
    ItemFrameValueInputComponent,
    ItemFrameAnnointmentComponent,
    AudioClipSettingsComponent,
    ColorPickerSettingsComponent,
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    FormsModule,
    TranslateModule,
  ],
  exports: [
    ClientStringPipe,
    WordPipe,
    BaseItemTypePipe,
    Nl2BrPipe,
    ItemFrameComponent,
    CurrencyFrameComponent,
    CurrencyRatioFrameComponent,
    ItemFrameSeparatorComponent,
    AudioClipSettingsComponent,
    ColorPickerSettingsComponent,
  ],
})
export class PoeModule {}
