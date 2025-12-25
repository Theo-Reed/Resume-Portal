export type AppLanguage = 'Chinese' | 'English' | 'AIChinese'

// One source of truth for supported languages
export const SUPPORTED_LANGUAGES: AppLanguage[] = ['Chinese', 'English', 'AIChinese']

// Simple key-based dictionary for UI text.
// NOTE: Job content is excluded by design.
const dict = {
  tab: {
    community: { Chinese: '社区', English: 'Community' },
    jobs: { Chinese: '岗位', English: 'Jobs' },
    me: { Chinese: '我', English: 'Me' },
  },
  me: {
    title: { Chinese: '我', English: 'Me' },
    userNotLoggedIn: { Chinese: '用户未登录', English: 'Not logged in' },
    favoritesEntry: { Chinese: '我收藏的岗位', English: 'Saved jobs' },
    languageEntry: { Chinese: '语言', English: 'Language' },
    langChinese: { Chinese: '中文', English: 'Chinese' },
    langEnglish: { Chinese: 'English', English: 'English' },
    langAIChinese: { Chinese: 'AI全中文', English: 'AI Chinese', AIChinese: 'AI全中文' },
    comingSoon: { Chinese: '敬请期待', English: 'Coming soon' },
    loginSuccess: { Chinese: '登录成功', English: 'Logged in' },
    phoneAuthFailed: { Chinese: '手机号授权失败', English: 'Phone authorization failed' },
    phoneAuthRequired: { Chinese: '请先授权手机号', English: 'Please authorize your phone number' },
    openDetailFailed: { Chinese: '无法打开详情', English: 'Unable to open details' },
    loadFavoritesFailed: { Chinese: '加载收藏失败', English: 'Failed to load saved jobs' },
    emptyFavorites: { Chinese: '暂无收藏岗位', English: 'No saved jobs' },
  },
  community: {
    title: { Chinese: '社区', English: 'Community' },
    desc: { Chinese: '敬请期待', English: 'Coming soon' },
  },
  jobs: {
    searchPlaceholder: { Chinese: '搜索职位名称或来源..', English: 'Search title or source..' },
    filterLabel: { Chinese: '筛选', English: 'Filter' },
    regionDomestic: { Chinese: '国内 ', English: 'China' },
    regionAbroad: { Chinese: '国外 ', English: 'Intl' },
    regionWeb3: { Chinese: 'Web3', English: 'Web3' },
  },
  drawer: {
    salary: { Chinese: '薪资', English: 'Salary' },
    experience: { Chinese: '经验', English: 'Experience' },
    clear: { Chinese: '清除', English: 'Clear' },
    confirm: { Chinese: '确定', English: 'Apply' },
  },
} as const

export type I18nKey =
  | 'tab.community'
  | 'tab.jobs'
  | 'tab.me'
  | 'me.title'
  | 'me.userNotLoggedIn'
  | 'me.favoritesEntry'
  | 'me.languageEntry'
  | 'me.langChinese'
  | 'me.langEnglish'
  | 'me.langAIChinese'
  | 'me.comingSoon'
  | 'me.loginSuccess'
  | 'me.phoneAuthFailed'
  | 'me.phoneAuthRequired'
  | 'me.openDetailFailed'
  | 'me.loadFavoritesFailed'
  | 'me.emptyFavorites'
  | 'community.title'
  | 'community.desc'
  | 'jobs.searchPlaceholder'
  | 'jobs.filterLabel'
  | 'jobs.regionDomestic'
  | 'jobs.regionAbroad'
  | 'jobs.regionWeb3'
  | 'drawer.salary'
  | 'drawer.experience'
  | 'drawer.clear'
  | 'drawer.confirm'
  | 'tab.jobs'

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj)
}

export function t(key: I18nKey, language: AppLanguage): string {
  const item = getByPath(dict, key)
  const value = item?.[language]
  return typeof value === 'string' ? value : key
}

export function normalizeLanguage(input: any): AppLanguage {
  const v = typeof input === 'string' ? input.trim() : input
  if (typeof v === 'string') {
    const lower = v.toLowerCase()
    if (v === 'AIChinese' || v === 'AI全中文' || lower === 'aichinese') return 'AIChinese'
    if (v === 'English' || v === '英文' || v === 'en' || v === 'EN' || lower === 'english' || lower === 'en') return 'English'
    if (lower === 'chinese' || lower === 'zh' || lower === 'zh-cn' || lower === 'zh-hans') return 'Chinese'
  }
  return 'Chinese'
}
