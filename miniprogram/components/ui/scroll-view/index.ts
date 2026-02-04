Component({
  externalClasses: ['custom-class'],
  properties: {
    scrollY: { type: Boolean, value: false },
    scrollX: { type: Boolean, value: false }
  },
  methods: {
    onScroll(e: any) {
      this.triggerEvent('scroll', e.detail);
    }
  }
})
