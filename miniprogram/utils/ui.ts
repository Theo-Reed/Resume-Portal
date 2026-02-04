/**
 * UI 反馈工具类
 * 需要在 WXML 中引入 <ui-feedback id="ui-feedback" />
 */

export const ui = {
  /**
   * 显示加载中
   */
  showLoading(title: string = '加载中...', mask: boolean = true) {
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const feedback = page?.selectComponent('#ui-feedback') as any;
    if (feedback) {
      feedback.setData({ title, type: 'loading', mask, visible: true });
    } else {
      // 降级使用原生
      wx.showLoading({ title, mask });
    }
  },

  /**
   * 隐藏加载
   */
  hideLoading() {
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const feedback = page?.selectComponent('#ui-feedback') as any;
    if (feedback) {
      feedback.setData({ visible: false });
    } else {
      wx.hideLoading();
    }
  },

  /**
   * 显示成功提示
   */
  showSuccess(title: string, duration: number = 2000) {
    // 自动隐藏任何可能存在的原生 Toast (如剪贴板提示)
    wx.hideToast();
    
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const feedback = page?.selectComponent('#ui-feedback') as any;
    if (feedback) {
      feedback.setData({ title, type: 'success', mask: false, visible: true });
      setTimeout(() => feedback.setData({ visible: false }), duration);
    } else {
      console.warn('UI feedback component not found on current page');
    }
  },

  /**
   * 显示错误提示
   */
  showError(title: string, duration: number = 2500) {
    wx.hideToast();
    
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const feedback = page?.selectComponent('#ui-feedback') as any;
    if (feedback) {
      feedback.setData({ title, type: 'error', mask: false, visible: true });
      setTimeout(() => feedback.setData({ visible: false }), duration);
    } else {
      console.warn('UI feedback component not found on current page');
    }
  },

  /**
   * 显示轻量级提示 (替代原生 showToast)
   */
  showToast(title: string, duration: number = 2000) {
    wx.hideToast();
    
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    const feedback = page?.selectComponent('#ui-feedback') as any;
    if (feedback) {
      // type: 'info' 或者不传，在 ui-feedback 中实现为中性样式
      feedback.setData({ title, type: 'info', mask: false, visible: true });
      setTimeout(() => feedback.setData({ visible: false }), duration);
    } else {
      console.warn('UI feedback component not found on current page');
    }
  }
};
