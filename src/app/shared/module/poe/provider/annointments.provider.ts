import { Injectable } from '@angular/core'
import annointmentsData from '../../../../../assets/poe/annointments-v2.json'
import { AnnointmentMap } from '../type'

@Injectable({
  providedIn: 'root',
})
export class AnnointmentsProvider {
  public provide(): AnnointmentMap {
    return annointmentsData.annointments
  }
}
