// logs.ts

Component({
  data: {
    logs: [],
  },
  lifetimes: {
    attached() {
      // Local storage is disabled by design; keep logs in memory only.
      this.setData({ logs: [] })
    },
  },
})
