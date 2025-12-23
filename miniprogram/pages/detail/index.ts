// miniprogram/pages/detail/index.ts
Page({
  data: {
    job: null as any,
  },

  onLoad(options) {
    if (options.id && options.collection) {
      this.fetchJobDetails(options.id, options.collection)
    }
  },

  async fetchJobDetails(id: string, collection: string) {
    try {
      const db = wx.cloud.database()
      const res = await db.collection(collection).doc(id).get()
      this.setData({ job: res.data })
    } catch (err) {
      console.error('[detail] fetchJobDetails failed', err)
    }
  },
})
