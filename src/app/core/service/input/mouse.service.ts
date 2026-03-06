import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { Point } from '@app/type'
import { ElectronAPI } from '@app/type/electron-api.type'

@Injectable({
  providedIn: 'root',
})
export class MouseService {
  private readonly electronAPI: ElectronAPI

  constructor(electronProvider: ElectronProvider) {
    this.electronAPI = electronProvider.provideElectronAPI()
  }

  public click(button: 'left' | 'right' | 'middle', position?: Point): void {
    this.electronAPI.mouseClick(button, position)
  }

  public move(position: Point): void {
    this.electronAPI.mouseMove(position)
  }

  public position(): Point {
    return this.electronAPI.mousePosition()
  }
}
