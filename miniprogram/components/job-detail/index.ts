// miniprogram/components/job-detail/index.ts
import { normalizeLanguage, t } from '../../utils/i18n'
import { normalizeJobTags, translateFieldValue } from '../../utils/job'
const swipeToClose = require('../../behaviors/swipe-to-close')
const fullscreenDrawerBehavior = require('../../behaviors/fullscreen-drawer')

const SAVED_COLLECTION = 'saved_jobs'
const SAVE_DEBOUNCE_DELAY = 300

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
  behaviors: [swipeToClose, fullscreenDrawerBehavior],

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
    saved: false,
    saveBusy: false,
    saveDocId: '',
    isAIEnglish: false, // 是否为 AIEnglish 语言
    loadingText: '加载中...',
    loadFailedText: '加载失败',
    copyLinkText: '复制链接',
  },

  lifetimes: {
    attached() {
      const app = getApp<IAppOption>() as any
      const updateLanguage = () => {
        const lang = normalizeLanguage(app?.globalData?.language)
        this.setData({ 
          isAIEnglish: lang === 'AIEnglish',
          loadingText: t('jobs.loading', lang),
          loadFailedText: t('jobs.loadFailed', lang),
          copyLinkText: t('jobs.copyLink', lang),
        })
      }
      
      ;(this as any)._langListener = updateLanguage
      if (app?.onLanguageChange) app.onLanguageChange(updateLanguage)
      
      // 初始化
      updateLanguage()
    },

    detached() {
      const app = getApp<IAppOption>() as any
      const listener = (this as any)._langListener
      if (listener && app?.offLanguageChange) app.offLanguageChange(listener)
      ;(this as any)._langListener = null
    },
  },

  observers: {
    'show, jobData'(show: boolean, jobData: any) {
      if (show && jobData && jobData._id) {
        const currentId = (this.data.job as any)?._id
        const newId = jobData._id
        
        if (currentId === newId && this.data.job) {
          if (jobData.isSaved !== undefined && jobData.isSaved !== this.data.saved) {
            this.setData({ saved: jobData.isSaved })
          }
          return
        }
        
        // 初始化 drawer 打开状态（包含 tabBar 隐藏和动画初始化）
        ;(this as any).initDrawerOpen()
        this.setJobFromData(jobData)
      } else if (!show) {
        // 初始化 drawer 关闭状态（包含 tabBar 显示和状态重置）
        ;(this as any).initDrawerClose()
        this.setData({
          job: null,
          loading: false,
          saved: false,
          saveBusy: false,
          saveDocId: '',
        })
      }
    },
  },

  methods: {
    async setJobFromData(jobData: any) {
      const _id = jobData._id
      if (!_id) return
      
      let displayTags = jobData.displayTags
      if (!displayTags || !Array.isArray(displayTags) || displayTags.length === 0) {
        // 只使用 experience 字段（本地翻译）
        const app = getApp<IAppOption>() as any
        const lang = normalizeLanguage(app?.globalData?.language)
        const experience = jobData.experience && typeof jobData.experience === 'string' ? jobData.experience.trim() : ''
        
        const { displayTags: generatedDisplayTags } = normalizeJobTags(jobData, lang, experience)
        displayTags = generatedDisplayTags
      }

      const isSaved = jobData.isSaved !== undefined ? jobData.isSaved : null
      
      // 翻译 salary 字段
      const app = getApp<IAppOption>() as any
      const lang = normalizeLanguage(app?.globalData?.language)
      const salary = jobData.salary && typeof jobData.salary === 'string' ? jobData.salary.trim() : ''
      const translatedSalary = translateFieldValue(salary, 'salary', lang)
      
      this.setData({
        job: {
          ...jobData,
          salary: translatedSalary || salary, // 使用翻译后的salary
          displayTags,
          richDescription: formatDescription(jobData.description),
        } as JobDetailItem & { richDescription: string },
        loading: false,
        saved: isSaved !== null ? isSaved : false,
      })

      if (isSaved === null) {
        try {
          const isSavedState = await this.checkSavedState(_id, true)
          this.setData({ saved: isSavedState })
        } catch (err) {
          this.setData({ saved: false })
        }
      }
    },

    onClose() {
      (this as any).closeDrawer()
    },

    async toggleSave() {
      const job = this.data.job
      if (!job || this.data.saveBusy) return

      // Product-level login check: phone authorized
      const app = getApp<IAppOption>() as any
      const user = app?.globalData?.user
      const isLoggedIn = !!(user && (user.isAuthed || user.phone))
      if (!isLoggedIn) {
        wx.showToast({ title: '请先登录/绑定手机号', icon: 'none' })
        return
      }

      this.setData({ saveBusy: true })
      const targetSaved = !this.data.saved

      try {
        if (targetSaved) {
          await this.addSavedRecord(job)
        } else {
          await this.removeSavedRecord(job._id)
        }

        this.setData({ saved: targetSaved })
        
        this.triggerEvent('savechange', {
          _id: job._id,
          isSaved: targetSaved,
        })
        
        wx.showToast({
          title: targetSaved ? '收藏成功' : '已取消收藏',
          icon: 'none',
        })
      } catch (err) {
        wx.showToast({ title: '操作失败', icon: 'none' })
      } finally {
        setTimeout(() => {
          this.setData({ saveBusy: false })
        }, SAVE_DEBOUNCE_DELAY)
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

    async addSavedRecord(job: JobDetailItem) {
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

      const result = await db.collection(SAVED_COLLECTION).add({ data: recordData })
      this.setData({ saveDocId: String((result as any)._id || '') })
    },

    async removeSavedRecord(_id: string) {
      const app = getApp<IAppOption>() as any
      const openid = app?.globalData?.user?.openid
      if (!openid) return

      const db = wx.cloud.database()
      let docId = this.data.saveDocId
      if (!docId) {
        const lookup = await db.collection(SAVED_COLLECTION).where({ openid, jobId: _id }).limit(1).get()
        docId = String((lookup.data?.[0] as any)?._id || '')
      }
      if (!docId) return
      await db.collection(SAVED_COLLECTION).doc(docId).remove()
      this.setData({ saveDocId: '' })
    },

    async checkSavedState(_id: string, silent = false) {
      if (!_id) return false

      const app = getApp<IAppOption>() as any
      const openid = app?.globalData?.user?.openid
      if (!openid) {
        if (!silent) this.setData({ saved: false, saveDocId: '' })
        return false
      }

      const db = wx.cloud.database()
      try {
        const res = await db.collection(SAVED_COLLECTION).where({ openid, jobId: _id }).limit(1).get()
        const doc = res.data?.[0] as any
        const exists = !!doc
        const updates: Partial<typeof this.data> = {
          saveDocId: String(doc?._id || ''),
        }
        if (!silent) updates.saved = exists
        this.setData(updates)
        return exists
      } catch (err) {
        if (!silent) {
          this.setData({ saved: false, saveDocId: '' })
        } else {
          this.setData({ saveDocId: '' })
        }
        return false
      }
    },
  },
})
