Component({
  options: {
    multipleSlots: true
  },
  externalClasses: ['custom-class'],
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(newVal) {
        if (newVal) {
          this.setData({ visible: true });
        } else {
          this.setData({ visible: false });
        }
      }
    },
    title: {
      type: String,
      value: ''
    },
    showClose: {
      type: Boolean,
      value: true
    },
    showFooter: {
      type: Boolean,
      value: false
    }
  },
  data: {
    visible: false
  },
  methods: {
    onClose() {
      this.triggerEvent('close');
    }
  }
});
