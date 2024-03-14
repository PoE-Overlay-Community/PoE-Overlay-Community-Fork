import { Injectable } from '@angular/core'
import { ElectronProvider } from '@app/provider'
import { Point } from '@app/type'
import type { IpcRenderer } from 'electron' //renderer

@Injectable({
  providedIn: 'root',
})
export class MouseService {
  private readonly ipcRenderer: IpcRenderer

  constructor(electronProvider: ElectronProvider) {
    this.ipcRenderer = electronProvider.provideIpcRenderer()
  }

  public click(button: 'left' | 'right' | 'middle', position?: Point): void {
    this.ipcRenderer.sendSync('click-at', button, position)
  }

  public move(position: Point): void {
    this.ipcRenderer.sendSync('move-to', position)
  }

  public position(): Point {
    return this.ipcRenderer.sendSync('mouse-pos')
  }
}
