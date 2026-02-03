Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'apply-shared'
  },
  externalClasses: ['custom-class'],
  properties: {
    title: {
      type: String,
      value: ''
    },
    desc: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: ''
    },
    iconBg: {
      type: String,
      value: 'blue'
    },
    showArrow: {
      type: Boolean,
      value: true
    },
    hover: {
      type: Boolean,
      value: true
    }
  },
  methods: {
    onTap(e: any) {
      this.triggerEvent('tap', e.detail);
    }
  }
});
