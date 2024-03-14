import { Injectable } from '@angular/core'
//import annointments from '../../../../../assets/poe/annointments-v2.json'
import annointments from '../../../../../assets/poe/annointments.json'
import { AnnointmentMap } from '../type'

// TODO fix duplicate in v2 json import

@Injectable({
  providedIn: 'root',
})
export class AnnointmentsProvider {
  public provide(): AnnointmentMap {
    return annointments.annointments
  }
}
