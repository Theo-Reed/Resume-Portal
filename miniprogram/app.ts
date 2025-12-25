// app.ts
import { normalizeLanguage, type AppLanguage, t } from './utils/i18n'

type LangListener = (lang: AppLanguage) => void

App<IAppOption>({
  globalData: {
    user: null as any,
    language: 'Chinese' as AppLanguage,
    _langListeners: new Set<LangListener>(),
  } as any,

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

    // Ensure any pages/components that attached early get the final language.
    const lang = ((this as any).globalData.language || 'Chinese') as AppLanguage
    this.applyLanguage()
    this.emitLanguageChange(lang)
  },

  applyLanguage() {
    const lang = ((this as any).globalData.language || 'Chinese') as AppLanguage

    // Tabbar text
    try {
      wx.setTabBarItem({ index: 0, text: t('tab.community', lang) })
      wx.setTabBarItem({ index: 1, text: t('tab.jobs', lang) })
      wx.setTabBarItem({ index: 2, text: t('tab.me', lang) })
    } catch {
      // ignore
    }

    try {
      wx.setNavigationBarTitle({ title: t('app.navTitle', lang) })
    } catch {
      // ignore
    }
  },

  onLanguageChange(cb: LangListener) {
    ;(this as any).globalData._langListeners.add(cb)
  },

  offLanguageChange(cb: LangListener) {
    ;(this as any).globalData._langListeners.delete(cb)
  },

  emitLanguageChange(lang: AppLanguage) {
    const set: Set<LangListener> = (this as any).globalData._langListeners
    if (!set) return
    set.forEach((fn) => {
      try {
        fn(lang)
      } catch (e) {
        console.warn('[app] language listener error', e)
      }
    })
  },

  async setLanguage(language: AppLanguage) {
    ;(this as any).globalData.language = language
    this.applyLanguage()
    this.emitLanguageChange(language)

    try {
      const res: any = await wx.cloud.callFunction({
        name: 'updateUserLanguage',
        data: { language },
      })
      const updatedUser = res?.result?.user
      if (updatedUser) {
        ;(this as any).globalData.user = updatedUser
      }
    } catch (err) {
      console.warn('[app] updateUserLanguage failed', err)
    }
  },

  async refreshUser() {
    const res: any = await wx.cloud.callFunction({
      name: 'initUser',
      data: {},
    })

    const openid = res?.result?.openid
    const user = (res?.result?.user || null) as any

    const merged = user ? { ...user, openid } : (openid ? { openid } : null)
    ;(this as any).globalData.user = merged

    // Normalize database/user-provided language (handles 'english'/'chinese' etc.)
    const lang = normalizeLanguage(merged?.language)
    ;(this as any).globalData.language = lang

    return merged
  },
})
