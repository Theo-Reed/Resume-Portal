Component({
  options: {
    multipleSlots: true
  },
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '' },
    showConfirm: { type: Boolean, value: true },
    confirmText: { type: String, value: '完成' },
    showClose: { type: Boolean, value: true },
    maskClosable: { type: Boolean, value: true }
  },
  data: {
    loading: false
  },
  methods: {
    onClose() {
      if (this.data.loading) return;
      this.triggerEvent('close');
    },
    
    onMaskTap() {
      if (this.properties.maskClosable) {
        this.onClose();
      }
    },

    async onConfirm() {
      if (this.data.loading) return;

      this.setData({ loading: true });
      const startTime = Date.now();
      
      // Emit confirm event. The parent can prevent closure if it performs async work.
      this.triggerEvent('confirm', {
        // Provide a callback for the parent to signal completion
        complete: async () => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 2000 - elapsed);
          
          if (remaining > 0) {
            await new Promise(resolve => setTimeout(resolve, remaining));
          }
          
          this.setData({ loading: false });
          this.onClose();
        },
        fail: () => {
          this.setData({ loading: false });
        }
      });

      // Default timeout for safety
      this._confirmTimeout = setTimeout(() => {
        if (this.data.loading) {
          this.setData({ loading: false });
          console.warn('[ui-drawer] Confirm timeout reached (30s)');
        }
      }, 30000);
    },

    detached() {
      if (this._confirmTimeout) {
        clearTimeout(this._confirmTimeout);
      }
    }
  }
})
