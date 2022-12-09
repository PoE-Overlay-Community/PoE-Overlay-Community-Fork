import { NgModule } from '@angular/core'
import { TradeCompanionModule } from '@modules/trade-companion/trade-companion.module'
import { SharedModule } from '@shared/shared.module'
import { StashGridModule } from '../modules/stash-grid/stash-grid.module'
import { VendorRecipeModule } from '../modules/vendor-recipe/vendor-recipe.module'
import {
    UserSettingsFeatureContainerComponent,
    UserSettingsFormComponent,
    UserSettingsHelpComponent
} from './component'
import { ResizeDirective } from './directive/resize.directive'
import { OverlayComponent, UserSettingsComponent } from './page'
import { PeriodicUpdateThreadComponent } from './page/periodic-update-thread/periodic-update-thread'

@NgModule({
  declarations: [
    // components
    UserSettingsFeatureContainerComponent,
    UserSettingsFormComponent,
    UserSettingsHelpComponent,
    // directives
    ResizeDirective,
    // pages
    OverlayComponent,
    UserSettingsComponent,
    PeriodicUpdateThreadComponent,
  ],
  imports: [SharedModule, StashGridModule, TradeCompanionModule, VendorRecipeModule],
})
export class LayoutModule {}
