import { Injectable } from '@angular/core'
import { ClientStringService } from '@shared/module/poe/service/client-string/client-string.service'
import { UltimatumChallengeType, UltimatumRewardType } from '@shared/module/poe/type'

type ChallengesDict = {
  key: string
  value: UltimatumChallengeType
}[]

type RewardsDict = {
  key: string
  value: UltimatumRewardType
}[]

@Injectable({
  providedIn: 'root',
})
export class UltimatumStringService {
  private challengeTypes: ChallengesDict
  private rewardTypes: RewardsDict

  constructor(private readonly clientString: ClientStringService) {}

  public getChallengeTypes(): ChallengesDict {
    if (!this.challengeTypes) {
      this.challengeTypes = [
        {
          key: this.clientString.translate('BasicWavesVaal'),
          value: UltimatumChallengeType.Exterminate,
        },
        {
          key: this.clientString
            .translate('TimedSurvivalWavesVaal')
            .substring(0, this.clientString.translate('TimedSurvivalWavesVaal').indexOf('\r\n')),
          value: UltimatumChallengeType.Survive,
        },
        {
          key: this.clientString.translate('DefenseVaal'),
          value: UltimatumChallengeType.ProtectAltar,
        },
        {
          key: this.clientString.translate('CaptureVaal'),
          value: UltimatumChallengeType.StandStoneCircles,
        },
      ]
    }
    return this.challengeTypes
  }

  public getRewardTypes(): RewardsDict {
    if (!this.rewardTypes) {
      this.rewardTypes = [
        {
          key: this.clientString.translate('CurrencyChaos5'),
          value: UltimatumRewardType.Currency,
        },
        {
          key: this.clientString.translate('DoubleDivinationCards1'),
          value: UltimatumRewardType.DivCards,
        },
        {
          key: this.clientString.translate('MirrorRare1'),
          value: UltimatumRewardType.MirroredRare,
        },
      ]
    }
    return this.rewardTypes
  }
}
