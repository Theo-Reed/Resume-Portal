// miniprogram/pages/me/index.ts

type JobItem = {
  _id: string
  createdAt: string
  source_url: string
  salary: string
  source_name: string
  summary: string
  description?: string
  team: string
  title: string
  type: string
  tags: string[]
  displayTags?: string[]
}

type ResolvedFavoriteJob = JobItem & {
  jobId: string
  sourceCollection: string
}

const typeCollectionMap: Record<string, string> = {
  国内: 'domestic_remote_jobs',
  国外: 'abroad_remote_jobs',
  web3: 'web3_remote_jobs',
}

Page({
  data: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    isLoggedIn: false,
    phoneAuthBusy: false,

    showFavoritesSheet: false,
    favoritesSheetOpen: false,
    favoritesLoading: false,
    favoritesJobs: [] as ResolvedFavoriteJob[],

    showJobDetail: false,
    selectedJobId: '',
    selectedCollection: '',
  },

  onShow() {
    this.syncUserFromApp()
  },

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

  async onGetRealtimePhoneNumber(e: any) {
    if ((this.data as any).phoneAuthBusy) return

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
      console.error('[me] realtime phone auth failed', err)
      wx.showToast({ title: '手机号授权失败', icon: 'none' })
    } finally {
      this.setData({ phoneAuthBusy: false })
    }
  },

  async onGetPhoneNumber(e: any) {
    if ((this.data as any).phoneAuthBusy) return

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
      console.error('[me] phone auth failed', err)
      wx.showToast({ title: '手机号授权失败', icon: 'none' })
    } finally {
      this.setData({ phoneAuthBusy: false })
    }
  },

  onOpenFavorites() {
    if (!(this.data as any).isLoggedIn) {
      wx.showToast({ title: '请先授权手机号', icon: 'none' })
      return
    }

    this.openFavoritesSheet()
  },

  openFavoritesSheet() {
    // Mount first, then open on next tick to trigger CSS transition.
    this.setData({ showFavoritesSheet: true, favoritesSheetOpen: false })

    setTimeout(() => {
      this.setData({ favoritesSheetOpen: true })
    }, 30)

    this.loadFavoritesJobs()
  },

  closeFavoritesSheet() {
    this.setData({ favoritesSheetOpen: false })

    setTimeout(() => {
      this.setData({ showFavoritesSheet: false })
    }, 260)
  },

  async loadFavoritesJobs() {
    const app = getApp<IAppOption>() as any
    const user = app?.globalData?.user
    const openid = user?.openid
    const isLoggedIn = !!(user && (user.isAuthed || user.phone))
    if (!isLoggedIn || !openid) {
      this.setData({ favoritesJobs: [] })
      return
    }

    this.setData({ favoritesLoading: true })
    try {
      const db = wx.cloud.database()

      const collectedRes = await db
        .collection('collected_jobs')
        .where({ openid })
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get()

      const collected = (collectedRes.data || []) as any[]
      if (collected.length === 0) {
        this.setData({ favoritesJobs: [] })
        return
      }

      const groups = new Map<string, string[]>()
      for (const row of collected) {
        const t = row?.type
        const id = row?.jobId
        if (!t || !id) continue
        const list = groups.get(t) || []
        list.push(id)
        groups.set(t, list)
      }

      const jobByKey = new Map<string, any>()
      const fetchGroup = async (type: string, ids: string[]) => {
        const collectionName = typeCollectionMap[type]
        if (!collectionName) return

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await db.collection(collectionName).doc(id).get()
              return { id, collectionName, data: res.data }
            } catch {
              return null
            }
          })
        )

        for (const r of results) {
          if (!r?.data) continue
          jobByKey.set(`${type}:${r.id}`, { ...r.data, _id: r.id, sourceCollection: r.collectionName })
        }
      }

      await Promise.all(Array.from(groups.entries()).map(([type, ids]) => fetchGroup(type, ids)))

      const merged: ResolvedFavoriteJob[] = []
      for (const row of collected) {
        const type = row?.type
        const jobId = row?.jobId
        if (!type || !jobId) continue

        const key = `${type}:${jobId}`
        const job = jobByKey.get(key)
        if (!job) continue

        merged.push({
          ...(job as any),
          jobId,
          sourceCollection: job.sourceCollection,
        })
      }

      // normalize tags/displayTags
      const normalized = mapJobs(merged) as any
      this.setData({ favoritesJobs: normalized })
    } catch (err) {
      console.error('[me] loadFavoritesJobs failed', err)
      wx.showToast({ title: '加载收藏失败', icon: 'none' })
    } finally {
      this.setData({ favoritesLoading: false })
    }
  },

  closeJobDetail() {
    this.setData({ showJobDetail: false })
  },

  onFavoriteJobTap(e: WechatMiniprogram.TouchEvent) {
    const jobId = e.currentTarget.dataset._id as string
    const collection = (e.currentTarget.dataset.collection as string) || ''
    if (!jobId || !collection) {
      wx.showToast({ title: '无法打开详情', icon: 'none' })
      return
    }

    // Keep favorites sheet open; just show detail over it.
    this.setData({
      selectedJobId: jobId,
      selectedCollection: collection,
      showJobDetail: true,
    })
  },
})

// Add helper next to typeCollectionMap
function mapJobs(jobs: any[]): any[] {
  return jobs.map((item: any) => {
    const tags = (item.summary || '')
      .split(/[,，]/)
      .map((t: string) => t.trim().replace(/[。！!.,，、；;]+$/g, '').trim())
      .filter((t: string) => t && t.length > 1)

    const displayTags = [...tags]
    if (item.source_name && typeof item.source_name === 'string' && item.source_name.trim()) {
      const sourceTag = item.source_name.trim()
      if (displayTags.length >= 1) {
        displayTags.splice(1, 0, sourceTag)
      } else {
        displayTags.push(sourceTag)
      }
    }

    return {
      ...item,
      tags,
      displayTags,
    }
  })
}

// In loadFavoritesJobs(), when pushing merged items, normalize with mapJobs
