import { callApi } from '../../utils/request';

const app = getApp<IAppOption>();

Page({
  data: {
    type: 'login', // 'login' | 'register'
    phone: '',
    password: '',
    openid: ''
  },

  onLoad(options: any) {
    if (options.openid) {
      this.setData({ openid: options.openid });
    }
  },

  switchType(e: any) {
    const type = e.currentTarget.dataset.type;
    if (this.data.type === type) return;
    
    this.setData({ type });
    wx.vibrateShort({ type: 'light' });
  },

  async handleSubmit() {
    const { type, phone, password, openid } = this.data;

    if (!phone || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    // Basic phone validation
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' });
      return;
    }

    wx.showLoading({ title: type === 'login' ? '正在登录' : '创建账号' });

    try {
      const endpoint = type === 'login' ? '/auth/login' : '/auth/register';
      const res = await callApi(endpoint, 'POST', {
        phone,
        password,
        openid // Pass the openid to bind it to the authenticated user
      });

      if (res && res.success) {
        // Save Token
        wx.setStorageSync('token', res.data.token);
        
        // Update App State
        getApp().globalData.user = res.data.user;
        
        wx.hideLoading();
        wx.showToast({ title: '登录成功', icon: 'success' });
        
        // Redirect to Home
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/tools/index' }); // Default entry
        }, 1500);

      } else {
        wx.hideLoading();
        wx.showToast({ 
          title: res.message || (type === 'login' ? '登录失败' : '注册失败'), 
          icon: 'none' 
        });
      }
    } catch (err: any) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
    }
  }
});
