Component({
  options: {
    multipleSlots: true
  },
  properties: {
    show: { type: Boolean, value: false },
    title: { 
      type: null, 
      value: '' 
    },
    showConfirm: { type: Boolean, value: true },
    confirmText: { 
      type: null, 
      value: '' 
    },
    confirmActive: { type: Boolean, value: true },
    showClose: { type: Boolean, value: false },
    maskClosable: { type: Boolean, value: true },
    closeOnConfirm: { type: Boolean, value: true },
    closeOnFail: { type: Boolean, value: false }
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

      if (!this.properties.confirmActive) {
        this.triggerEvent('close');
        return;
      }

      this.setData({ loading: true });
      const startTime = Date.now();
      
      const finish = async (shouldClose: boolean) => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 500 - elapsed); // Reduced minimum artificial delay for better feel
        
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
        
        this.setData({ loading: false });
        if (shouldClose) {
          this.onClose();
        }
      };

      // Emit confirm event. The parent can prevent closure if it performs async work.
      this.triggerEvent('confirm', {
        // Provide a callback for the parent to signal completion
        complete: (customShouldClose?: boolean) => {
          const finalClose = customShouldClose !== undefined ? customShouldClose : this.properties.closeOnConfirm;
          finish(finalClose);
        },
        // Provide a callback for the parent to signal failure
        fail: (customShouldClose?: boolean) => {
          const finalClose = customShouldClose !== undefined ? customShouldClose : this.properties.closeOnFail;
          finish(finalClose);
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
