import { Injectable } from '@angular/core'
import { AnnointmentsProvider } from '../../provider/annointments.provider'
import { Item } from '../../type'

const ModGrantedPassiveHasName = "mod_granted_passive_hash"

@Injectable({
  providedIn: 'root',
})
export class AnnointmentsService {
  constructor(private readonly annointmentsProvider: AnnointmentsProvider) {}

  public get(item: Item, statId: string, passiveHash: string): string[] {
    const annointmentsMap = this.annointmentsProvider.provide()

    const annointmentStatId = this.getId(item, statId)
    const annointment = annointmentsMap[annointmentStatId]
    if (!annointment) {
      return undefined
    }

    if (annointmentStatId.startsWith(ModGrantedPassiveHasName)) {
      return annointment[passiveHash]
    }

    return annointment as string[]
  }

  public isAnnointmentStat(item: Item, statId: string): boolean {
    const annointmentsMap = this.annointmentsProvider.provide()

    return this.getId(item, statId) !== undefined
  }

  private getId(item: Item, statId: string): string {
    const annointmentsMap = this.annointmentsProvider.provide()

    const annointment = annointmentsMap[statId]
    if (!annointment) {
      const ids = Object.getOwnPropertyNames(annointmentsMap).filter((statIds) => {
        const splittedStatIds = statIds.split(" ")
        if (splittedStatIds.length == 0) {
          return false
        }
        return splittedStatIds.includes(statId) && splittedStatIds.every((statId) => item.stats.some((itemStat) => itemStat.id === statId))
      })
      if (ids.length === 0) {
        return undefined
      }

      return ids[0]
    }

    return statId
  }
}
