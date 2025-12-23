// app.ts
App<IAppOption>({
  globalData: {
    user: null as any,
  },
  async onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    wx.cloud.init({
      env: require('./env.js').cloudEnv,
      traceUser: true,
    })

    await this.refreshUser().catch((err: any) => {
      console.warn('[app] initUser failed', err)
    })
  },

  async refreshUser() {
    const res: any = await wx.cloud.callFunction({
      name: 'initUser',
      data: {},
    })

    const user = res?.result?.user || null
    ;(this as any).globalData.user = user
    return user
  },
})
