// miniprogram/components/job-detail/index.ts
const swipeToClose = require('../../behaviors/swipe-to-close')

const COLLECT_COLLECTION = 'collected_jobs'
const COLLECT_DEBOUNCE_DELAY = 300

function formatDescription(description?: string): string {
  if (!description) return ''
  const escapeHtml = (text: string) =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  return description
    .split(/\n+/)
    .map((line) => {
      const content = escapeHtml(line.trim())
      return `<p>${content || '&nbsp;'}</p>`
    })
    .join('')
}

type JobDetailItem = {
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

Component({
  behaviors: [swipeToClose],

  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    jobData: {
      type: Object,
      value: undefined,
    },
  },

  data: {
    job: null as JobDetailItem | null,
    loading: false,
    collected: false,
    collectBusy: false,
    collectDocId: '',
  },

  observers: {
    'show, jobData'(show: boolean, jobData: any) {
      if (show && jobData && jobData._id) {
        const currentJobId = (this.data.job as any)?._id
        const newJobId = jobData._id || jobData.jobId
        
        // 如果是同一个职位，只更新 isSaved 状态（避免重新渲染造成抖动）
        if (currentJobId === newJobId && this.data.job) {
          if (jobData.isSaved !== undefined && jobData.isSaved !== this.data.collected) {
            this.setData({ collected: jobData.isSaved })
          }
          return
        }
        
        // 职位ID变化，执行完整的初始化逻辑
        if ((this as any)._animation && typeof (this as any)._animation.stop === 'function') {
          ;(this as any)._animation.stop()
          ;(this as any)._animation = null
        }
        
        const windowInfo = wx.getWindowInfo()
        const screenWidth = windowInfo.windowWidth
        
        this.setData({ 
          animationData: null,
          drawerTranslateX: screenWidth,
        })
        
        setTimeout(() => {
          if (this.data.show && this.data.jobData) {
            this.setData({ drawerTranslateX: 0 } as any)
          }
        }, 50)
        this.setJobFromData(jobData)
      } else if (!show) {
        if ((this as any)._animation && typeof (this as any)._animation.stop === 'function') {
          ;(this as any)._animation.stop()
          ;(this as any)._animation = null
        }
        
        const windowInfo = wx.getWindowInfo()
        const screenWidth = windowInfo.windowWidth
        this.setData({
          job: null,
          loading: false,
          collected: false,
          collectBusy: false,
          collectDocId: '',
          drawerTranslateX: screenWidth,
          animationData: null,
        })
      }
    },
  },

  methods: {
    async setJobFromData(jobData: any) {
      const jobId = jobData._id || jobData.jobId
      if (!jobId) return
      
      let displayTags = jobData.displayTags
      if (!displayTags || !Array.isArray(displayTags) || displayTags.length === 0) {
        const tags = (jobData.summary || '')
          .split(/[,，]/)
          .map((t: string) => t.trim().replace(/[。！!.,，、；;]+$/g, '').trim())
          .filter((t: string) => t && t.length > 1)

        displayTags = [...tags]
        if (jobData.source_name && typeof jobData.source_name === 'string' && jobData.source_name.trim()) {
          const sourceTag = jobData.source_name.trim()
          if (displayTags.length >= 1) {
            displayTags.splice(1, 0, sourceTag)
          } else {
            displayTags.push(sourceTag)
          }
        }
      }

      // 优先使用 jobData.isSaved 字段（如果云端函数已返回）
      // 如果没有该字段，则查询数据库（向后兼容）
      const isSaved = jobData.isSaved !== undefined ? jobData.isSaved : null
      
      this.setData({
        job: {
          ...jobData,
          displayTags,
          richDescription: formatDescription(jobData.description),
        } as JobDetailItem & { richDescription: string },
        loading: false,
        collected: isSaved !== null ? isSaved : false, // 如果 isSaved 存在则直接使用，否则先设为 false 避免闪烁
      })

      // 只有在 jobData.isSaved 不存在时才查询数据库（向后兼容）
      if (isSaved === null) {
        try {
          const isCollected = await this.checkCollectState(jobId, true)
          this.setData({ collected: isCollected })
        } catch (err) {
          this.setData({ collected: false })
        }
      }
    },

    onClose() {
      (this as any).closeDrawer()
    },

    async toggleCollect() {
      const job = this.data.job
      if (!job || this.data.collectBusy) return

      // Product-level login check: phone authorized
      const app = getApp<IAppOption>() as any
      const user = app?.globalData?.user
      const isLoggedIn = !!(user && (user.isAuthed || user.phone))
      if (!isLoggedIn) {
        wx.showToast({ title: '请先登录/绑定手机号', icon: 'none' })
        return
      }

      this.setData({ collectBusy: true })
      const targetCollected = !this.data.collected

      try {
        if (targetCollected) {
          await this.addCollectRecord(job)
        } else {
          await this.removeCollectRecord(job._id)
        }

        this.setData({ collected: targetCollected })
        
        // 触发自定义事件，通知父组件更新列表中对应职位的收藏状态
        this.triggerEvent('collectchange', {
          jobId: job._id,
          isSaved: targetCollected,
        })
        
        wx.showToast({
          title: targetCollected ? '收藏成功' : '已取消收藏',
          icon: 'none',
        })
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
      } finally {
        setTimeout(() => {
          this.setData({ collectBusy: false })
        }, COLLECT_DEBOUNCE_DELAY)
      }
    },


    onCopyLink() {
      if (!this.data.job?.source_url) return

      wx.setClipboardData({
        data: this.data.job.source_url,
        success: () => {
          wx.showToast({ title: '链接已复制', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '复制失败', icon: 'none' })
        },
      })
    },

    async addCollectRecord(job: JobDetailItem) {
      const app = getApp<IAppOption>() as any
      const openid = app?.globalData?.user?.openid
      if (!openid) throw new Error('missing openid')

      const db = wx.cloud.database()
      const recordData = {
        openid,
        jobId: job._id,
        type: job.type,
        createdAt: job.createdAt,
      }

      const result = await db.collection(COLLECT_COLLECTION).add({ data: recordData })
      this.setData({ collectDocId: String((result as any)._id || '') })
    },

    async removeCollectRecord(jobId: string) {
      const app = getApp<IAppOption>() as any
      const openid = app?.globalData?.user?.openid
      if (!openid) return

      const db = wx.cloud.database()
      let docId = this.data.collectDocId
      if (!docId) {
        const lookup = await db.collection(COLLECT_COLLECTION).where({ openid, jobId }).limit(1).get()
        docId = String((lookup.data?.[0] as any)?._id || '')
      }
      if (!docId) return
      await db.collection(COLLECT_COLLECTION).doc(docId).remove()
      this.setData({ collectDocId: '' })
    },

    async checkCollectState(jobId: string, silent = false) {
      if (!jobId) return false

      const app = getApp<IAppOption>() as any
      const openid = app?.globalData?.user?.openid
      if (!openid) {
        if (!silent) this.setData({ collected: false, collectDocId: '' })
        return false
      }

      const db = wx.cloud.database()
      try {
        const res = await db.collection(COLLECT_COLLECTION).where({ openid, jobId }).limit(1).get()
        const doc = res.data?.[0] as any
        const exists = !!doc
        const updates: Partial<typeof this.data> = {
          collectDocId: String(doc?._id || ''),
        }
        if (!silent) updates.collected = exists
        this.setData(updates)
        return exists
      } catch (err) {
        if (!silent) {
          this.setData({ collected: false, collectDocId: '' })
        } else {
          this.setData({ collectDocId: '' })
        }
        return false
      }
    },
  },
})
