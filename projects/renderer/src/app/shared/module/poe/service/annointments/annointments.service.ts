import { Injectable } from '@angular/core'
import { AnnointmentsProvider } from '../../provider/annointments.provider'

@Injectable({
  providedIn: 'root',
})
export class AnnointmentsService {
  constructor(private readonly annointmentsProvider: AnnointmentsProvider) {}

  public get(statId: string, passiveHash: string): string[] {
    const annointmentsMap = this.annointmentsProvider.provide()

    const annointment = annointmentsMap[statId]
    if (!annointment) {
      return undefined
    }

    if (statId.startsWith("mod_granted_passive_hash")) {
      return annointment[passiveHash]
    }

    return annointment as string[]
  }

  public isAnnointmentStat(statId: string): boolean {
    const annointmentsMap = this.annointmentsProvider.provide()

    return annointmentsMap[statId] !== undefined
  }
}
