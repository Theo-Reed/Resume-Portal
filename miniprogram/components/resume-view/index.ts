// components/resume-view/index.ts

import { ui } from '../../utils/ui'
import { callApi } from '../../utils/request'
import { normalizeLanguage, t } from '../../utils/i18n'
import { attachLanguageAware } from '../../utils/languageAware'

Component({
  properties: {
      active: {
          type: Boolean,
          value: false,
          observer(newVal) {
              if (newVal) {
                 this.onShowCompat()
              }
          }
      },
      isLoggedIn: {
          type: Boolean,
          value: false
      }
  },
  data: {
    isInitializing: true,
    ui: {
      title: '求职助手',
      subtitle: '让 AI 帮你搞定简历与面试',
      toolScreenshotTitle: '截图生成简历',
      toolScreenshotDesc: '上传岗位截图，AI 自动生成匹配简历',
      toolTextTitle: '文字生成简历',
      toolTextDesc: '粘贴文字，AI 自动生成匹配简历',
      toolRefineTitle: '简历润色',
      toolRefineDesc: '上传旧简历，AI 帮你重写升级'
    },
    jdText: '', // Deprecated, keep for now if needed or remove
    showJdDrawer: false,
    drawerTitle: '文字生成简历',
    targetJob: {
      title: '',
      company: '',
      content: '',
      experience: ''
    },
    canSubmit: false
  },

  lifetimes: {
    attached() {
      ;(this as any)._langDetach = attachLanguageAware(this, {
        onLanguageRevive: (lang) => {
          this.setData({
            ui: {
              title: t('resume.toolTitle', lang),
              subtitle: t('resume.toolSubtitle', lang),
              toolScreenshotTitle: t('resume.toolScreenshotTitle', lang),
              toolScreenshotDesc: t('resume.toolScreenshotDesc', lang),
              toolTextTitle: t('resume.toolTextTitle', lang),
              toolTextDesc: t('resume.toolTextDesc', lang),
              toolRefineTitle: t('resume.toolRefineTitle', lang),
              toolRefineDesc: t('resume.toolRefineDesc', lang)
            },
            drawerTitle: t('resume.toolTextTitle', lang)
          });
        }
      });
    },
    detached() {
      if (typeof (this as any)._langDetach === 'function') {
        (this as any)._langDetach();
      }
    }
  },

  pageLifetimes: {
      show() {
          if (this.data.active) {
              this.onShowCompat()
          }
      }
  },

  methods: {
    onShowCompat() {
        const app = getApp<any>();
        
        // 同步全局选中的 Tab 索引，防止闪烁 (简历现在是 Index 1)
        if (app.globalData) {
            app.globalData.tabSelected = 1;
        }

        this.syncLoginState();
    },

    async syncLoginState() {
        const app = getApp<any>();
        
        // 等待全局 Auth 完成，防止状态闪烁
        if (app.globalData.userPromise) {
        await app.globalData.userPromise;
        }

        const user = app.globalData.user;
        const isLoggedIn = !!(user && user.phoneNumber);

        this.setData({
        isLoggedIn: !!(user && user.phoneNumber),
        isInitializing: false
        });
    },

    onLoginSuccess() {
        this.setData({ isLoggedIn: true });
    },

    // Helper to ensure phone is bound before AI actions
    checkPhonePermission() {
        const app = getApp<any>()
        const user = app.globalData.user
        
        if (!user?.phoneNumber) {
        wx.showModal({
            title: '需要身份认证',
            content: '为了您的简历和会员权益能够永久同步，请先登录并验证手机号。',
            confirmText: '去登录',
            showCancel: false,
            success: (res) => {
            if (res.confirm) {
                this.setData({ isLoggedIn: false });
            }
            }
        })
        return false
        }
        return true
    },

    openJdDrawer() {
        if (!this.checkPhonePermission()) return
        
        this.setData({ 
        showJdDrawer: true,
        drawerTitle: '文字生成简历',
        targetJob: {
            title: '',
            company: '',
            content: '',
            experience: ''
        }
        })
    },

    closeJdDrawer() {
        this.setData({ showJdDrawer: false })
    },

    onTitleInput(e: any) {
        this.setData({
        'targetJob.title': e.detail.value
        }, () => this.validateForm())
    },

    onCompanyInput(e: any) {
        this.setData({
        'targetJob.company': e.detail.value
        }, () => this.validateForm())
    },

    onExperienceInput(e: any) {
        this.setData({
        'targetJob.experience': e.detail.value
        }, () => this.validateForm())
    },

    onJdInput(e: any) {
        this.setData({
        'targetJob.content': e.detail.value,
        jdText: e.detail.value
        }, () => this.validateForm())
    },

    validateForm() {
        const { title, company, content, experience } = this.data.targetJob
        // Must have JD content OR (Title + Company)
        // Experience is optional but recommended
        const hasContent = content && content.trim().length > 10
        const hasMeta = (title && title.trim()) && (company && company.trim())
        
        const valid = hasContent || hasMeta
        this.setData({ canSubmit: valid })
    },

    async onSubmitJd() {
        if (!this.data.canSubmit) return

        const { targetJob } = this.data
        const app = getApp<any>()

        // Store in globalData for resume generator to pick up
        app.globalData._generateParams = {
        mode: 'jd',
        jdText: targetJob.content,
        targetJobTitle: targetJob.title,
        targetCompany: targetJob.company,
        experience: targetJob.experience
        }

        this.closeJdDrawer()
        
        // Navigate to generator page
        wx.navigateTo({
        url: '/pages/resume-profile/index?mode=new'
        })
    },

    // --- Template Actions ---
    onTemplateTap() {
        if (!this.checkPhonePermission()) return

        wx.navigateTo({
        url: '/pages/resume-profile/index'
        })
    },

    onImportTap() {
        if (!this.checkPhonePermission()) return
        
        ui.showToast('功能开发中...')
    }
  }
})
