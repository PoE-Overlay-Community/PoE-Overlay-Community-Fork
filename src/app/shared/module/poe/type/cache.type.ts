export enum CacheExpirationType {
  Instant = 1,
  Never = -1,
  OneDay = 1000 * 60 * 60 * 24,//1d
  OneHour = 1000 * 60 * 60,//1h
  HalfHour = 1000 * 60 * 30,//30m
  FifteenMin = 1000 * 60 * 15,//15m
  TenMin = 1000 * 60 * 5,//10m
  FiveMin = 1000 * 60 * 5,//5m
  FourMin = 1000 * 60 * 3,//4m
  ThreeMin = 1000 * 60 * 3,//3m
  TwoMin = 1000 * 60 * 2,//2m
  OneMin = 1000 * 60,//1m
  FiveSeconds = 1000 * 5//5s
}

export abstract class CacheExpiration {
  public static getExpiration(cacheExpiration: CacheExpirationType, defaultCacheExpiration: CacheExpirationType): number {
    if (cacheExpiration === CacheExpirationType.Never) {
      return defaultCacheExpiration
    }
    return cacheExpiration || defaultCacheExpiration
  }
}
