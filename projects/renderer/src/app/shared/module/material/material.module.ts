import { ScrollingModule } from '@angular/cdk/scrolling'
import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { MatCardModule } from '@angular/material/card'
import { MatDialogModule } from '@angular/material/dialog'
import { MatDividerModule } from '@angular/material/divider'
import { MatExpansionModule } from '@angular/material/expansion'
import { MatIconModule } from '@angular/material/icon'
import { MatInputModule } from '@angular/material/input'
import { MatListModule } from '@angular/material/list'
import { MatProgressBarModule } from '@angular/material/progress-bar'
import { MatSelectModule } from '@angular/material/select'
import { MatSlideToggleModule } from '@angular/material/slide-toggle'
import { MatSliderModule } from '@angular/material/slider'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTabsModule } from '@angular/material/tabs'
import { MatTooltipModule } from '@angular/material/tooltip'
import { TranslateModule } from '@ngx-translate/core'
import { ColorPickerModule } from 'ngx-color-picker'
import { AcceleratorComponent } from './component/accelerator/accelerator.component'
import { CardComponent } from './component/card/card.component'
import { SelectListComponent } from './component/select-list/select-list.component'
import { AlphaColorDirective } from './directive/alpha-color.directive'
import { DragDirective } from './directive/drag.directive'
import { ResizeDragDirective } from './directive/resize-drag.directive'

@NgModule({
  imports: [
    CommonModule,
    ScrollingModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatListModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatTooltipModule,

    // third party
    TranslateModule,
    ColorPickerModule,
  ],
  exports: [
    CommonModule,
    ScrollingModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatTabsModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatCardModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatListModule,
    MatExpansionModule,
    MatProgressBarModule,
    MatTooltipModule,
    // thirt party
    ColorPickerModule,
    // custom
    AcceleratorComponent,
    SelectListComponent,
    DragDirective,
    CardComponent,
    ResizeDragDirective,
    AlphaColorDirective,
  ],
  declarations: [
    AcceleratorComponent,
    SelectListComponent,
    DragDirective,
    CardComponent,
    ResizeDragDirective,
    AlphaColorDirective,
  ],
})
export class MaterialModule {}
