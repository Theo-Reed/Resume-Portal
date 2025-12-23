/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    user: any,
  }
  refreshUser: () => Promise<any>,
}
