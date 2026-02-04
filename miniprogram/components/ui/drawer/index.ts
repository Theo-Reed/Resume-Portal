Component({
  options: {
    multipleSlots: true
  },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    showFooter: { type: Boolean, value: false }
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    }
  }
})
