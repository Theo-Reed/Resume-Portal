Component({
  externalClasses: ['custom-class'],
  
  properties: {
    type: {
      type: String,
      value: 'primary' // primary, premium, secondary, outline
    },
    size: {
      type: String,
      value: 'md' // lg, md, sm
    },
    loading: {
      type: Boolean,
      value: false
    },
    loadingText: {
      type: String,
      value: ''
    },
    disabled: {
      type: Boolean,
      value: false
    },
    formType: {
      type: String,
      value: ''
    },
    openType: {
      type: String,
      value: ''
    }
  },

  methods: {
    onTap(e: any) {
      if (!this.properties.disabled && !this.properties.loading) {
        this.triggerEvent('tap', e.detail);
      }
    },
    onGetPhoneNumber(e: any) { this.triggerEvent('getphonenumber', e.detail); },
    onChooseAvatar(e: any) { this.triggerEvent('chooseavatar', e.detail); },
    onContact(e: any) { this.triggerEvent('contact', e.detail); },
    onOpenSetting(e: any) { this.triggerEvent('opensetting', e.detail); },
    onLaunchApp(e: any) { this.triggerEvent('launchapp', e.detail); },
    onError(e: any) { this.triggerEvent('error', e.detail); }
  }
});
