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
    articles: [
      {
        id: 'online',
        title: '线上活动',
        items: [
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
            title: 'Vue 3.0 深度解析',
            description: '全面解析Vue 3.0的新特性，Composition API的实际应用',
            status: '即将开始',
            statusType: 'upcoming',
          }
        ]
      },
      {
        id: 'offline',
        title: '线下活动',
        items: [
          {
            id: 3,
            image: 'https://picsum.photos/200/200?random=3',
            title: '前端开发交流会',
            description: '前端开发者线下交流，讨论行业趋势和职业发展',
            status: '已结束',
            statusType: 'ended',
          },
          {
            id: 4,
            image: 'https://picsum.photos/200/200?random=4',
            title: '产品经理与开发团队协作',
            description: '探讨产品经理与技术团队的沟通协作最佳实践',
            status: '报名中',
            statusType: 'active',
          }
        ]
      },
      {
        id: 'skills',
        title: '技能交换',
        items: [
          {
            id: 5,
            image: 'https://picsum.photos/200/200?random=5',
            title: '开源项目贡献指南',
            description: '学习如何参与开源项目，为社区做出贡献',
            status: '进行中',
            statusType: 'active',
          },
          {
            id: 6,
            image: 'https://picsum.photos/200/200?random=6',
            title: '技术分享互换',
            description: '社区成员之间互相分享技术经验和技能',
            status: '进行中',
            statusType: 'active',
          }
        ]
      },
      {
        id: 'success',
        title: '成功森林',
        items: [
          {
            id: 7,
            image: 'https://picsum.photos/200/200?random=7',
            title: '从传统企业到远程工作的转型之路',
            description: '分享如何成功转型到远程工作，薪资增长50%，工作效率提升30%的经验',
          },
          {
            id: 8,
            image: 'https://picsum.photos/200/200?random=8',
            title: '海外远程工作的机遇与挑战',
            description: '记录在硅谷公司远程工作的经历，分享文化适应和时差管理的实用技巧',
          },
          {
            id: 9,
            image: 'https://picsum.photos/200/200?random=9',
            title: '自由职业者的时间管理之道',
            description: '作为全职自由职业者，如何平衡工作和生活，保持高效率的工作状态',
          }
        ]
      }
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
        // Update articles with translated titles and status
        const updatedArticles = this.data.articles.map(article => ({
          ...article,
          title: article.id === 'online' ? t('community.onlineActivitiesTitle', lang) :
                 article.id === 'offline' ? t('community.offlineActivitiesTitle', lang) :
                 article.id === 'skills' ? t('community.skillExchangeTitle', lang) :
                 t('community.successStoriesTitle', lang),
          items: article.items.map(item => ({
            ...item,
            status: item.statusType === 'active' ? t('community.statusActive', lang) :
                    item.statusType === 'ended' ? t('community.statusEnded', lang) :
                    item.statusType === 'upcoming' ? t('community.statusUpcoming', lang) :
                    t('community.statusOngoing', lang)
          }))
        }))

        this.setData({
          ui: {
            title: t('community.title', lang),
            desc: t('community.desc', lang),
          },
          articles: updatedArticles,
        })
        // Immediately set navigation bar title when language changes
        wx.setNavigationBarTitle({ title: t('app.navTitle', lang) })
      },
    })
    // also publish articles to global for detail page
    try {
      const app: any = getApp()
      if (app && app.globalData) app.globalData.articles = this.data.articles
    } catch {
      // ignore
    }
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

    // Update articles with translated titles and status
    const updatedArticles = this.data.articles.map(article => ({
      ...article,
      title: article.id === 'online' ? t('community.onlineActivitiesTitle', lang) :
             article.id === 'offline' ? t('community.offlineActivitiesTitle', lang) :
             article.id === 'skills' ? t('community.skillExchangeTitle', lang) :
             t('community.successStoriesTitle', lang),
      items: article.items.map(item => ({
        ...item,
        status: item.statusType === 'active' ? t('community.statusActive', lang) :
                item.statusType === 'ended' ? t('community.statusEnded', lang) :
                item.statusType === 'upcoming' ? t('community.statusUpcoming', lang) :
                t('community.statusOngoing', lang)
      }))
    }))

    this.setData({
      ui: {
        title: t('community.title', lang),
        desc: t('community.desc', lang),
      },
      articles: updatedArticles,
    })
      // expose articles to global for Article Detail page to pick up
      try {
        const app: any = getApp()
        if (app && app.globalData) app.globalData.articles = updatedArticles
      } catch {
        // ignore
      }
  },
 
  // Open article list page (shows list of items for this article)
  onOpenArticleAll(e: any) {
    const id = e?.currentTarget?.dataset?.id
    if (!id) return
    wx.navigateTo({ url: `/pages/article-list/index?id=${id}` })
  },

  // Open specific item inside article (navigates to article detail and passes item id)
  onArticleTap(e: any) {
    const articleId = e?.currentTarget?.dataset?.articleId
    const itemId = e?.currentTarget?.dataset?.itemId
    if (!articleId) return
    const url = `/pages/article-detail/index?id=${articleId}${itemId ? `&item=${itemId}` : ''}`
    wx.navigateTo({ url })
  },

  // (removed duplicate)
})
