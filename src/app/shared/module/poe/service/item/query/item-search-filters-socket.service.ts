import { Injectable } from '@angular/core'
import { Query } from '@data/poe'
import { Item, ItemSearchFiltersService, ItemSocket, ItemSocketColor, Language } from '@shared/module/poe/type'
import { ItemSocketService } from '../item-socket.service'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersSocketService implements ItemSearchFiltersService {
  constructor(private readonly socket: ItemSocketService) {}

  public add(item: Item, language: Language, query: Query): void {
    const validSockets = (item.sockets || []).filter((x) => !!x)
    if (validSockets.length <= 0) {
      return
    }

    query.filters.socket_filters = {
      filters: {},
    }

    const sockets = validSockets.filter((x) => !!x.color)
    if (sockets.length > 0) {
      query.filters.socket_filters.filters.sockets = {
        r: this.getSocketColorCount(validSockets, ItemSocketColor.Red),
        g: this.getSocketColorCount(validSockets, ItemSocketColor.Green),
        b: this.getSocketColorCount(validSockets, ItemSocketColor.Blue),
        w: this.getSocketColorCount(validSockets, ItemSocketColor.White),
        min: sockets.length,
      }
    }

    const links = this.socket.getLinkCount(validSockets)
    if (links > 0) {
      query.filters.socket_filters.filters.links = { min: links }
    }
  }

  private getSocketColorCount(sockets: ItemSocket[], color: ItemSocketColor): number {
    if (!sockets) {
      return undefined
    }
    const count = sockets.filter(socket => socket.color == color).length
    if (count == 0) {
      const containsAny = sockets.some(socket => socket.color == ItemSocketColor.Any)
      const hasUnselectedSockets = sockets.some(socket => socket.color !== undefined)
      // Use undefined (i.e. exclude from search) when there's an unselected or an 'any' socket color selected; otherwise explicitly use zero
      return (containsAny || hasUnselectedSockets) ? undefined : 0
    }
    return count
  }
}
