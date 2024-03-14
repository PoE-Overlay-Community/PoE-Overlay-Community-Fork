import { Injectable } from '@angular/core'
import { FilterValueOption, Query } from '@data/poe'
import {
  HeistJob,
  HeistObjectiveValue,
  Item,
  ItemSearchFiltersService,
  Language,
} from '@shared/module/poe/type'

@Injectable({
  providedIn: 'root',
})
export class ItemSearchFiltersHeistService implements ItemSearchFiltersService {
  constructor() {}

  public add(item: Item, language: Language, query: Query): void {
    if (!item.properties || !item.properties.heist) {
      return
    }

    query.filters.heist_filters = {
      filters: {},
    }

    const heistFilters = query.filters.heist_filters.filters
    const heist = item.properties.heist

    if (heist.wingsRevealed) {
      heistFilters.heist_wings = {
        min: heist.wingsRevealed.min,
        max: heist.wingsRevealed.max,
      }
    }

    if (heist.escapeRoutes) {
      heistFilters.heist_escape_routes = {
        min: heist.escapeRoutes.min,
        max: heist.escapeRoutes.max,
      }
    }

    if (heist.rewardRooms) {
      heistFilters.heist_reward_rooms = {
        min: heist.rewardRooms.min,
        max: heist.rewardRooms.max,
      }
    }

    if (heist.objectiveValue) {
      heistFilters.heist_objective_value = {
        option: this.getObjectiveValueOption(heist.objectiveValue),
      }
    }

    for (const requiredSkill of heist.requiredSkills) {
      const jobName = this.getJobName(requiredSkill.job)
      const filter: FilterValueOption = {
        min: requiredSkill.level.min,
        max: requiredSkill.level.max,
      }
      heistFilters[`heist_${jobName}`] = filter
    }
  }

  private getObjectiveValueOption(objectiveValue: HeistObjectiveValue): string {
    switch (objectiveValue) {
      case HeistObjectiveValue.Moderate:
        return 'moderate'
      case HeistObjectiveValue.High:
        return 'high'
      case HeistObjectiveValue.Precious:
        return 'precious'
      case HeistObjectiveValue.Priceless:
        return 'priceless'
    }
  }

  private getJobName(job: HeistJob): string {
    switch (job) {
      case HeistJob.Lockpicking:
        return 'lockpicking'
      case HeistJob.BruteForce:
        return 'brute_force'
      case HeistJob.Perception:
        return 'perception'
      case HeistJob.Demolition:
        return 'demolition'
      case HeistJob.CounterThaumaturge:
        return 'counter_thaumaturgy'
      case HeistJob.TrapDisarmament:
        return 'trap_disarmament'
      case HeistJob.Agility:
        return 'agility'
      case HeistJob.Deception:
        return 'deception'
      case HeistJob.Engineering:
        return 'engineering'
    }
  }
}
