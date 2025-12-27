// Article list page - shows list of items for a given article
import { normalizeLanguage, t } from '../../utils/i18n'

Page({
  data: {
    articleId: '',
    article: null as any,
  },

  onLoad(options: any) {
    const id = options.id || ''
    this.setData({ articleId: id })

    const app: any = getApp()
    const articles = app && app.globalData ? app.globalData.articles : null
    if (!articles) {
      wx.showToast({ title: '无法加载内容', icon: 'none' })
      return
    }

    const article = (articles || []).find((a: any) => a.id === id)
    if (!article) {
      wx.showToast({ title: '内容不存在', icon: 'none' })
      return
    }

    this.setData({ article })
    wx.setNavigationBarTitle({ title: article.title || 'Article' })
  },

  onItemTap(e: any) {
    const articleId = this.data.articleId
    const itemId = e?.currentTarget?.dataset?.id
    if (!articleId || !itemId) return
    wx.navigateTo({ url: `/pages/article-detail/index?id=${articleId}&item=${itemId}` })
  },
})


