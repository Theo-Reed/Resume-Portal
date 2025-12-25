// miniprogram/components/job-list/index.ts

Component({
  properties: {
    jobs: {
      type: Array,
      value: [],
    },
    loading: {
      type: Boolean,
      value: false,
    },
    showNoMore: {
      type: Boolean,
      value: false,
    },
    noMoreVisible: {
      type: Boolean,
      value: false,
    },

    // scroll-view passthrough props
    scrollY: {
      type: Boolean,
      value: true,
    },
    scrollTop: {
      type: [Number, String],
      value: '',
    },
    lowerThreshold: {
      type: Number,
      value: 100,
    },
    scrollWithAnimation: {
      type: Boolean,
      value: true,
    },
    enhanced: {
      type: Boolean,
      value: true,
    },
    showScrollbar: {
      type: Boolean,
      value: false,
    },
    enableBackToTop: {
      type: Boolean,
      value: false,
    },
    enablePassive: {
      type: Boolean,
      value: true,
    },
    className: {
      type: String,
      value: '',
    },

    // Optional: handle opening a job-detail drawer automatically
    enableDetail: {
      type: Boolean,
      value: false,
    },
    detailSelector: {
      type: String,
      value: '',
    },
    // If your pages sometimes need to override which collection to read from,
    // pass a function-like hint is not possible, so we accept a fallback collection name.
    detailCollectionFallback: {
      type: String,
      value: '',
    },
  },

  methods: {
    onItemTap(e: WechatMiniprogram.TouchEvent) {
      const job = e.currentTarget.dataset.job
      const id = e.currentTarget.dataset._id

      if (this.data.enableDetail && this.data.detailSelector) {
        const detail = this.selectComponent(this.data.detailSelector as any) as any
        const collection = (job && (job.sourceCollection || job.collection)) || this.data.detailCollectionFallback
        if (detail && typeof detail.open === 'function' && id && collection) {
          detail.open(id, collection)
        }
      }

      this.triggerEvent('itemtap', { job, _id: id })
    },

    onScrollLower(e: any) {
      this.triggerEvent('scrolltolower', e.detail)
    },

    onScroll(e: any) {
      this.triggerEvent('scroll', e.detail)
    },

    onTouchStart() {
      this.triggerEvent('touchstart')
    },

    onTouchEnd() {
      this.triggerEvent('touchend')
    },
  },
})
