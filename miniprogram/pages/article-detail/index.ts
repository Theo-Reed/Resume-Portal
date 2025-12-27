// Article detail page - shows all items in an article as rich text
import { normalizeLanguage, t } from '../../utils/i18n'

Page({
  data: {
    articleId: '',
    article: null as any,
    htmlNodes: [] as any[],
  },

  onLoad(options: any) {
    const id = options.id || ''
    this.setData({ articleId: id })

    // find article from globalData (set by community page)
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

    // build simple rich-text nodes by concatenating items
    const nodes: any[] = []
    for (const it of article.items || []) {
      nodes.push({ name: 'h3', attrs: { style: 'margin:0 0 8px 0' }, children: [{ type: 'text', text: it.title }] })
      nodes.push({ name: 'div', attrs: { style: 'margin:0 0 16px 0;color:#374151' }, children: [{ type: 'text', text: it.description }] })
    }

    this.setData({ htmlNodes: nodes })
    // set nav title
    wx.setNavigationBarTitle({ title: article.title || 'Article' })
  },
})


