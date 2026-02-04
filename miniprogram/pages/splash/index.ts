const app = getApp<IAppOption>();

Page({
  onLoad() {
    this.checkAuth();
  },

  async checkAuth() {
    const startTime = Date.now();
    
    try {
      // 启动时静默检查
      const user = await app.refreshUser();
      
      const elapsed = Date.now() - startTime;
      const minDuration = 1500; // 动画至少展示 1.5 秒，防止闪烁
      const waitTime = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        // 无论是否成功登录，都去主页，由主页的登录墙组件拦截
        wx.reLaunch({ url: '/pages/tools/index' });
      }, waitTime);

    } catch (err) {
      console.error('[Splash] Auth failed', err);
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/tools/index' });
      }, 1000);
    }
  }
});
