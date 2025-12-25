// miniprogram/pages/community/index.ts

import { attachLanguageAware } from '../../utils/languageAware'
import { normalizeLanguage, t } from '../../utils/i18n'

Page({
  data: {
    ui: {
      title: '社区',
      activitiesTitle: '社区活动',
      successStoriesTitle: '成功森林',
      jobHuntingTitle: '求职利剑',
      statusActive: '报名中',
      statusEnded: '已结束',
      desc: '敬请期待',
    },
    activities: [
      {
        id: 1,
        image: 'https://picsum.photos/200/200?random=1',
        title: '技术分享会：React新特性',
        description: '一起探讨React 18的新功能和最佳实践，分享实际项目经验',
        status: '报名中',
        statusType: 'active',
      },
      {
        id: 2,
        image: 'https://picsum.photos/200/200?random=2',
        title: '前端开发交流会',
        description: '前端开发者线下交流，讨论行业趋势和职业发展',
        status: '已结束',
        statusType: 'ended',
      },
      {
        id: 3,
        image: 'https://picsum.photos/200/200?random=3',
        title: '开源项目贡献指南',
        description: '学习如何参与开源项目，为社区做出贡献',
        status: '已结束',
        statusType: 'ended',
      },
    ],
    successStories: [
      {
        id: 1,
        image: 'https://picsum.photos/200/200?random=4',
        title: '从传统企业到远程工作的转型之路',
        description: '分享如何成功转型到远程工作，薪资增长50%，工作效率提升30%的经验',
      },
      {
        id: 2,
        image: 'https://picsum.photos/200/200?random=5',
        title: '海外远程工作的机遇与挑战',
        description: '记录在硅谷公司远程工作的经历，分享文化适应和时差管理的实用技巧',
      },
      {
        id: 3,
        image: 'https://picsum.photos/200/200?random=6',
        title: '自由职业者的时间管理之道',
        description: '作为全职自由职业者，如何平衡工作和生活，保持高效率的工作状态',
      },
    ],
    jobHunting: [
      {
        id: 1,
        image: 'https://picsum.photos/200/200?random=7',
        title: '简历优化指南',
        description: '专业的简历撰写技巧，让你的简历在众多应聘者中脱颖而出',
      },
      {
        id: 2,
        image: 'https://picsum.photos/200/200?random=8',
        title: '面试技巧宝典',
        description: '掌握远程工作的面试要点，包括技术面试、行为面试和文化适应',
      },
      {
        id: 3,
        image: 'https://picsum.photos/200/200?random=9',
        title: 'LinkedIn优化攻略',
        description: '打造完美的LinkedIn个人资料，提升在领英上的职业曝光度和机会',
      },
    ],
  },

  onLoad: function () {
    // Initialize activities status text based on current language
    const app: any = getApp()
    const lang = normalizeLanguage(app && app.globalData ? app.globalData.language : null)

    const updatedActivities = this.data.activities.map(activity => ({
      ...activity,
      status: activity.statusType === 'active'
        ? t('community.statusActive', lang)
        : t('community.statusEnded', lang)
    }))

    this.setData({
      activities: updatedActivities,
      ui: {
        ...this.data.ui,
        statusActive: t('community.statusActive', lang),
        statusEnded: t('community.statusEnded', lang),
      }
    })

    // subscribe once for this page instance
    const self: any = this
    self._langDetach = attachLanguageAware(this, {
      onLanguageRevive: (lang) => {
        // Update activities status text based on language
        const updatedActivities = this.data.activities.map(activity => ({
          ...activity,
          status: activity.statusType === 'active'
            ? t('community.statusActive', lang)
            : t('community.statusEnded', lang)
        }))

        this.setData({
          ui: {
            title: t('community.title', lang),
            activitiesTitle: t('community.activitiesTitle', lang),
            successStoriesTitle: t('community.successStoriesTitle', lang),
            jobHuntingTitle: t('community.jobHuntingTitle', lang),
            statusActive: t('community.statusActive', lang),
            statusEnded: t('community.statusEnded', lang),
            desc: t('community.desc', lang),
          },
          activities: updatedActivities,
        })
        // Immediately set navigation bar title when language changes
        wx.setNavigationBarTitle({ title: t('app.navTitle', lang) })
      },
    })
  },

  onUnload: function () {
    const self: any = this
    const fn = self._langDetach
    if (typeof fn === 'function') fn()
    self._langDetach = null
  },

  onShow: function () {
    const app: any = getApp()
    const lang = normalizeLanguage(app && app.globalData ? app.globalData.language : null)

    wx.setNavigationBarTitle({ title: t('app.navTitle', lang) })

    // Update activities status text based on language
    const updatedActivities = this.data.activities.map(activity => ({
      ...activity,
      status: activity.statusType === 'active'
        ? t('community.statusActive', lang)
        : t('community.statusEnded', lang)
    }))

    this.setData({
      ui: {
        title: t('community.title', lang),
        activitiesTitle: t('community.activitiesTitle', lang),
        successStoriesTitle: t('community.successStoriesTitle', lang),
        jobHuntingTitle: t('community.jobHuntingTitle', lang),
        statusActive: t('community.statusActive', lang),
        statusEnded: t('community.statusEnded', lang),
        desc: t('community.desc', lang),
      },
      activities: updatedActivities,
    })
  },
})
