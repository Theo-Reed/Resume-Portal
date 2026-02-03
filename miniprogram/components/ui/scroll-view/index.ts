Component({
  externalClasses: ['custom-class'],
  properties: {
    scrollX: { type: Boolean, value: false },
    scrollY: { type: Boolean, value: false },
    upperThreshold: { type: Number, value: 50 },
    lowerThreshold: { type: Number, value: 50 },
    scrollTop: { type: null, value: '' },
    scrollLeft: { type: null, value: '' },
    scrollIntoView: { type: String, value: '' },
    scrollWithAnimation: { type: Boolean, value: false },
    enableBackToTop: { type: Boolean, value: false },
    pagingEnabled: { type: Boolean, value: false },
    fastDeceleration: { type: Boolean, value: false },
    enableFlex: { type: Boolean, value: false },
    refresherEnabled: { type: Boolean, value: false },
    refresherThreshold: { type: Number, value: 45 },
    refresherDefaultStyle: { type: String, value: 'black' },
    refresherBackground: { type: String, value: 'transparent' },
    refresherTriggered: { type: Boolean, value: false }
  },
  methods: {
    onScrollToUpper(e: any) { this.triggerEvent('scrolltoupper', e.detail); },
    onScrollToLower(e: any) { this.triggerEvent('scrolltolower', e.detail); },
    onScroll(e: any) { this.triggerEvent('scroll', e.detail); },
    onRefresherPulling(e: any) { this.triggerEvent('refresherpulling', e.detail); },
    onRefresherRefresh(e: any) { this.triggerEvent('refresherrefresh', e.detail); },
    onRefresherRestore(e: any) { this.triggerEvent('refresherrestore', e.detail); },
    onRefresherAbort(e: any) { this.triggerEvent('refresherabort', e.detail); }
  }
});
