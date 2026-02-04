import { callApi } from '../../utils/request';

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          wx.hideTabBar({ animated: true }).catch(() => {});
          this.startFlow();
        } else {
          this.setData({ internalPhase: 'hidden' });
          wx.showTabBar({ animated: true }).catch(() => {});
        }
      }
    }
  },

  lifetimes: {
    attached() {
      if (this.data.visible) {
        wx.hideTabBar().catch(() => {});
        this.startFlow();
      }
    }
  },

  data: {
    internalPhase: 'hidden', // 'splash' | 'login' | 'hidden'
    type: 'login', // 'login' | 'register'
    phone: '',
    password: ''
  },

  methods: {
    async startFlow() {
      // 1. Initial State: Splash ACTIVE
      this.setData({ internalPhase: 'splash' });
      
      // 2. Wait for app "boot" feel (1.5s)
      setTimeout(() => {
        // If still visible (user hasn't logged in via silent login)
        // Transition to Login Card
        if (this.data.visible) {
          this.setData({ internalPhase: 'login' });
        }
      }, 1500);
    },
    preventTouch() {
      // 阻止触摸穿透
      return;
    },

    switchType(e: any) {
      const type = e.currentTarget.dataset.type;
      if (this.data.type === type) return;
      this.setData({ type });
    },

    async handleSubmit() {
      const { type, phone, password } = this.data;
      const app = getApp<IAppOption>();

      if (!phone || !password) {
        wx.showToast({ title: '请填写完整', icon: 'none' });
        return;
      }

      const openid = wx.getStorageSync('user_openid');

      wx.showLoading({ title: '提交中' });

      try {
        const endpoint = type === 'login' ? 'auth/login' : 'auth/register';
        const res = await callApi(endpoint, {
          phoneNumber: phone,
          password,
          openid
        });

        if (res && res.success && res.data) {
          wx.setStorageSync('token', res.data.token);
          app.globalData.user = res.data.user;
          
          wx.hideLoading();
          wx.showToast({ title: '登录成功', icon: 'success' });
          
          // 触发父页面刷新或状态更新
          this.triggerEvent('loginSuccess', res.data.user);
          
          // 重置组件状态
          this.setData({ visible: false, phone: '', password: '' });
          
          // 全局刷新用户状态
          app.refreshUser().catch(() => {});
          
        } else {
          wx.hideLoading();
          wx.showToast({ 
            title: res.message || '操作失败', 
            icon: 'none' 
          });
        }
      } catch (err: any) {
        wx.hideLoading();
        wx.showToast({ title: err.message || '网络繁忙', icon: 'none' });
      }
    }
  }
});
