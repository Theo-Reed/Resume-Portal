// miniprogram/pages/resume-profile/index.ts
import { normalizeLanguage, t } from '../../utils/i18n'
import { attachLanguageAware } from '../../utils/languageAware'

Page({
  data: {
    // 个人信息
    name: '',
    photo: '',
    wechat: '',
    email: '',
    phone: '',
    // 教育经历（可以有多个）
    educations: [] as Array<{ school: string; graduationDate: string }>,
    // 证书
    certificates: [] as string[],
    
    // UI 文本
    ui: {} as Record<string, string>,
  },

  onLoad() {
    // attach language-aware behavior
    ;(this as any)._langDetach = attachLanguageAware(this, {
      onLanguageRevive: () => {
        wx.setNavigationBarTitle({ title: '' })
        this.updateLanguage()
      },
    })

    this.updateLanguage()
    this.loadResumeData()
  },

  onUnload() {
    const fn = (this as any)._langDetach
    if (typeof fn === 'function') fn()
    ;(this as any)._langDetach = null
  },

  onShow() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    wx.setNavigationBarTitle({ title: '' })
    this.updateLanguage()
  },

  updateLanguage() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    
    const ui = {
      name: t('resume.name', lang),
      photo: t('resume.photo', lang),
      wechat: t('resume.wechat', lang),
      email: t('resume.email', lang),
      phone: t('resume.phone', lang),
      education: t('resume.education', lang),
      certificates: t('resume.certificates', lang),
      graduationDate: t('resume.graduationDate', lang),
      addEducation: t('resume.addEducation', lang),
      addCertificate: t('resume.addCertificate', lang),
      noData: t('resume.noData', lang),
    }

    this.setData({ ui })
  },

  loadResumeData() {
    // 从全局状态或云数据库加载简历数据
    const app = getApp<IAppOption>() as any
    const user = app?.globalData?.user

    if (user) {
      // 从用户数据中加载简历信息
      // 这里假设简历数据存储在 user.resume 中
      const resume = user.resume || {}
      
      this.setData({
        name: resume.name || '',
        photo: resume.photo || '',
        wechat: resume.wechat || '',
        email: resume.email || '',
        phone: user.phone || '',
        educations: resume.educations || [],
        certificates: resume.certificates || [],
      })
    }
  },
})

