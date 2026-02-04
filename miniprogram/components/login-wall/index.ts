import { callApi } from '../../utils/request';

Component({
  properties: {
    visible: {
      type: Boolean,
      value: true, 
      observer(newVal) {
        console.log('[LoginWall] Visible property changed:', newVal);
        if (newVal) {
          wx.hideTabBar({ animated: false }).catch(() => {});
          this.startFlow();
        } else {
           const app = getApp<any>();
           // Security check: only allow hiding if bootStatus is success
           if (app.globalData.bootStatus !== 'success') {
               console.error('[LoginWall] BYPASS REJECTED. bootStatus is:', app.globalData.bootStatus);
               this.setData({ visible: true });
               return;
           }
          this.setData({ internalPhase: 'hidden', _flowStarted: false });
          wx.showTabBar({ animated: true }).catch(() => {});
        }
      }
    }
  },

  lifetimes: {
    attached() {
      // 只要组件挂载，第一件事就是隐藏 TabBar，防止闪烁
      wx.hideTabBar({ animated: false }).catch(() => {});
      
      if (this.data.visible) {
        this.startFlow();
      }
    }
  },

  data: {
    internalPhase: 'hidden', // 'splash' | 'login' | 'hidden'
    bootStatus: 'loading',
    type: 'login', 
    phone: '',
    password: '',
    errorMsg: '',
    errorDesc: '',
    _flowStarted: false
  },

  methods: {
    async startFlow() {
      if (this.data._flowStarted) return;
      this.setData({ _flowStarted: true });

      const app = getApp<any>();
      console.log('[LoginWall] Flow started. Current bootStatus:', app.globalData.bootStatus);
      
      // Start in Splash Mode
      this.setData({ internalPhase: 'splash' });
      
      const checkState = () => {
        const { bootStatus } = app.globalData;
        
        if (this.data.bootStatus !== bootStatus) {
            this.setData({ bootStatus });
        }

        // If loading, keep checking
        if (bootStatus === 'loading') {
          setTimeout(checkState, 300);
          return;
        }

        console.log('[LoginWall] Finalizing state. Status:', bootStatus);

        if (bootStatus === 'success') {
          // Success: Fade out splash background -> Reveal App
          setTimeout(() => {
             this.setData({ internalPhase: 'hidden', _flowStarted: false });
             this.triggerEvent('loginSuccess', app.globalData.user);
          }, 600);
        } 
        else {
          // Unauthorized, New User, Server Down, or No Network
          // Transition to Login Card visual state
          // The status-banner inside the card will handle error messages if any
          this.setData({ internalPhase: 'login' });
        }
      };

      // Ensure splash shows for at least 1.5s to appreciate the globe animation
      setTimeout(checkState, 1500);
    },

    retry() {
      const app = getApp<any>();
      this.setData({ internalPhase: 'splash' });
      app.refreshUser().then(() => {
        this.startFlow();
      }).catch(() => {
        this.startFlow();
      });
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
