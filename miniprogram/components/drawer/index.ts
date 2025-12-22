// miniprogram/components/drawer/index.ts
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(show: boolean) {
        if (show && !this.data.isLoggedIn) {
          this.setData({ loginDisabled: false })
        }
      },
    },
  },

  data: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    isLoggedIn: false,
    loginDisabled: false,
  },

  methods: {
    onClose() {
      this.triggerEvent('close')
    },

    handleLogin() {
      if (this.data.isLoggedIn || this.data.loginDisabled) return

      this.setData({ loginDisabled: true })
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const { avatarUrl, nickName } = res.userInfo
          this.setData({
            userInfo: {
              avatarUrl,
              nickName,
            } as WechatMiniprogram.UserInfo,
            isLoggedIn: true,
          })
        },
        fail: (err) => {
          console.error('[drawer] getUserProfile failed', err)
          wx.showToast({ title: '授权失败', icon: 'none' })
        },
        complete: () => {
          this.setData({ loginDisabled: false })
        },
      })
    },

    onNicknameTap() {
      if (!this.data.isLoggedIn) {
        this.handleLogin()
      }
    },

    onOpenFavorites() {
      if (!this.data.isLoggedIn) {
        this.handleLogin()
        return
      }
      wx.reLaunch({ url: '/pages/favorites/index' })
      this.onClose()
    },
  },
})
