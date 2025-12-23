// miniprogram/components/drawer/index.ts
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(show: boolean) {
        if (show) {
          this.syncUserFromApp()
        }
      },
    },
  },

  data: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    isLoggedIn: false,
    phoneAuthBusy: false,
  },

  lifetimes: {
    attached() {
      this.syncUserFromApp()
    },
  },

  methods: {
    syncUserFromApp() {
      const app = getApp<IAppOption>() as any
      const user = app?.globalData?.user
      const isLoggedIn = !!(user && (user.isAuthed || user.phone))

      const hasCloudProfile = user && typeof user.avatar === 'string' && typeof user.nickname === 'string' && user.avatar && user.nickname
      const userInfo = hasCloudProfile
        ? ({ avatarUrl: user.avatar, nickName: user.nickname } as WechatMiniprogram.UserInfo)
        : null

      this.setData({ isLoggedIn, userInfo })
    },

    onClose() {
      this.triggerEvent('close')
    },

    async onGetRealtimePhoneNumber(e: any) {
      if (this.data.phoneAuthBusy) return

      const encryptedData = e?.detail?.encryptedData
      const iv = e?.detail?.iv
      if (!encryptedData || !iv) {
        wx.showToast({ title: '未获取到手机号授权', icon: 'none' })
        return
      }

      this.setData({ phoneAuthBusy: true })
      try {
        const res: any = await wx.cloud.callFunction({
          name: 'getPhoneNumber',
          data: { encryptedData, iv, mode: 'realtime' },
        })

        const phone = res?.result?.phone
        if (!phone) throw new Error('no phone in getPhoneNumber result')

        const updateRes: any = await wx.cloud.callFunction({
          name: 'updateUserProfile',
          data: { phone, isAuthed: true },
        })

        const updatedUser = updateRes?.result?.user
        const app = getApp<IAppOption>() as any
        if (app?.globalData) app.globalData.user = updatedUser

        this.syncUserFromApp()
        wx.showToast({ title: '登录成功', icon: 'success' })
      } catch (err) {
        console.error('[drawer] realtime phone auth failed', err)
        wx.showToast({ title: '手机号授权失败', icon: 'none' })
      } finally {
        this.setData({ phoneAuthBusy: false })
      }
    },

    async onGetPhoneNumber(e: any) {
      if (this.data.phoneAuthBusy) return

      const code = e?.detail?.code
      if (!code) {
        wx.showToast({ title: '未获取到手机号授权', icon: 'none' })
        return
      }

      this.setData({ phoneAuthBusy: true })
      try {
        const res: any = await wx.cloud.callFunction({
          name: 'getPhoneNumber',
          data: { code },
        })

        const phone = res?.result?.phone
        if (!phone) throw new Error('no phone in getPhoneNumber result')

        const updateRes: any = await wx.cloud.callFunction({
          name: 'updateUserProfile',
          data: { phone, isAuthed: true },
        })

        const updatedUser = updateRes?.result?.user
        const app = getApp<IAppOption>() as any
        if (app?.globalData) app.globalData.user = updatedUser

        this.syncUserFromApp()
        wx.showToast({ title: '登录成功', icon: 'success' })
      } catch (err) {
        console.error('[drawer] phone auth failed', err)
        wx.showToast({ title: '手机号授权失败', icon: 'none' })
      } finally {
        this.setData({ phoneAuthBusy: false })
      }
    },

    onOpenFavorites() {
      if (!this.data.isLoggedIn) {
        wx.showToast({ title: '请先授权手机号', icon: 'none' })
        return
      }
      wx.reLaunch({ url: '/pages/favorites/index' })
      this.onClose()
    },
  },
})
