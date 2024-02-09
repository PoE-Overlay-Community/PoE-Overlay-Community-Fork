import { Injectable } from '@angular/core'
import { annointments } from '../../../../../assets/poe/annointments-v2.json'
import { AnnointmentMap } from '../type'

@Injectable({
  providedIn: 'root',
})
export class AnnointmentsProvider {
  public provide(): AnnointmentMap {
    return annointments
  }
}
