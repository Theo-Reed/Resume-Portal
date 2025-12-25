// miniprogram/components/drawer/index.ts
Component({
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  data: {},

  methods: {
    onClose() {
      this.triggerEvent('close')
    },
  },
})
