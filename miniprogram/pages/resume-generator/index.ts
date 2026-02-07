import { ui } from '../../utils/ui'
import { t } from '../../utils/i18n/index'
import { requestGenerateResume, showGenerationSuccessModal } from '../../utils/resume'

Page({
  data: {
    ui: {
      title: '文字生成简历',
      subtitle: '完善以下信息，让 AI 更好地为您生成简历',
      jobTitle: '职位名称',
      jobTitlePlaceholder: '请输入职位名称',
      workYears: '工作年限',
      workYearsPlaceholder: '例如：3年',
      company: '公司 (选填)',
      companyPlaceholder: '请输入公司名称',
      jobDescription: '职位描述',
      jdPlaceholder: '粘贴职位描述或手动输入...',
    },
    targetJob: {
      title: '',
      company: '',
      experience: '',
      content: ''
    },
    isReady: false
  },

  onLoad(options: any) {
    this.initUIStrings();
    
    if (options && options.title) {
      this.setData({
        'targetJob.title': decodeURIComponent(options.title || ''),
        'targetJob.company': decodeURIComponent(options.company || ''),
        'targetJob.content': decodeURIComponent(options.content || ''),
        'targetJob.experience': decodeURIComponent(options.experience || '')
      }, () => this.validateForm());
    }
  },

  initUIStrings() {
    this.setData({
      'ui.title': t('resume.toolTextTitle') || '文字生成简历',
      'ui.subtitle': t('resume.tips') || '完善以下信息，让 AI 更好地为您生成简历',
      'ui.jobTitle': t('resume.jobTitle') || '职位名称',
      'ui.jobTitlePlaceholder': t('resume.jobTitlePlaceholder') || '请输入职位名称',
      'ui.workYears': t('resume.experience') || '工作年限',
      'ui.workYearsPlaceholder': t('resume.experiencePlaceholder') || '例如：3年',
      'ui.company': t('resume.company') || '公司 (选填)',
      'ui.companyPlaceholder': t('resume.companyPlaceholder') || '请输入公司名称',
      'ui.jobDescription': t('resume.jobDescription') || '职位描述',
      'ui.jdPlaceholder': t('resume.jdPlaceholder') || '粘贴职位描述或手动输入...',
    });
  },

  onFieldChange(e: any) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [`targetJob.${field}`]: value
    }, () => this.validateForm())
  },

  validateForm() {
    const { title, content, experience } = this.data.targetJob
    const isReady = !!(title && title.trim().length >= 1 && content && content.trim().length >= 5 && experience && experience.trim().length >= 1)
    if (isReady !== this.data.isReady) {
      this.setData({ isReady })
    }
  },

  handleSubmit() {
    if (!this.data.isReady) {
      this.showMissingFieldsToast();
      return;
    }

    wx.vibrateShort({ type: 'medium' });

    const { targetJob } = this.data
    const mockJobData = {
      _id: `CUSTOM_${Date.now()}`,
      _is_custom: true,
      title: targetJob.title,
      title_chinese: targetJob.title,
      title_english: targetJob.title,
      description: targetJob.content,
      experience: targetJob.experience,
      source_name: targetJob.company || '自定义',
      createdAt: new Date().toISOString()
    }

    requestGenerateResume(mockJobData, {
      showSuccessModal: false,
      onFinish: (success) => {
        if (success) {
          ui.showLoading('生成中...', true);
          setTimeout(() => {
            ui.hideLoading();
            this.handleSuccess();
          }, 2000);
        } else {
          this.handleError(new Error('生成请求未成功'));
        }
      },
      onCancel: () => {
        // 用户中途取消，不需要报错，直接结束 loading 状态即可（如果有的话）
      }
    })
  },

  showMissingFieldsToast() {
    const { title, content, experience } = this.data.targetJob
    let msg = '';
    if (!title || !title.trim()) msg = '请输入职位名称';
    else if (!experience || !experience.trim()) msg = '请输入工作年限';
    else if (!content || !content.trim()) msg = '请输入职位描述';
    if (msg) ui.showToast(msg);
  },

  handleSuccess() {
    wx.navigateBack({
      success: () => {
        setTimeout(() => {
          showGenerationSuccessModal();
        }, 500);
      }
    });
  },

  handleError(err: any) {
    ui.showModal({
      title: '提示',
      content: (err && err.message) || '系统繁忙，请重试',
      showCancel: false
    });
  }
})



