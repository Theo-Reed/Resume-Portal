/// <reference path="./types/index.d.ts" />

type AppUser = {
  openid?: string
  isAuthed?: boolean
  phone?: string | null
  nickname?: string | null
  avatar?: string | null
  member_level?: number // 0:普通用户, 1:3天会员, 2:普通月卡, 3:高级月卡
  member_expire_at?: Date | string | null
  ai_resume_quota?: number
  email_quota?: number
}

type MemberScheme = {
  scheme_id: number
  name: string
  name_english?: string
  displayName?: string // 根据语言返回的显示名称
  price: number
  duration_days: number
  ai_limit: number
  email_limit: number
  _id?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

type Order = {
  order_id: string
  user_id: string
  scheme_id: number
  amount: number
  status: '待支付' | '已支付' | '已退款' | '已关闭'
  pay_time?: Date | string | null
  _id?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface IAppOption {
  globalData: {
    user: AppUser | null,
  }
  refreshUser: () => Promise<any>,
}
