/// <reference path="./types/index.d.ts" />

type AppUser = {
  openid?: string
  isAuthed?: boolean
  phone?: string | null
  nickname?: string | null
  avatar?: string | null
}

interface IAppOption {
  globalData: {
    user: AppUser | null,
  }
  refreshUser: () => Promise<any>,
}
