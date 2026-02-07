import { ui } from '../../utils/ui'
import { t } from '../../utils/i18n/index'
import { requestGenerateResume, showGenerationSuccessModal } from '../../utils/resume'

const AI_MESSAGE_DEFAULT = "如果用户不满足目标岗位年限，会自动补充实习经历；如果岗位与用户过往工作经验不符，会自动更改过往工作岗位名称和填充工作内容；如果工作技能与目标岗位不符，会自动变更为目标岗位需要的工作技能";

Page({
  data: {
    ui: {
      title: '文字生成简历',
      subtitle: '完善以下信息，让 AI 更好地为您生成简历',
      jobTitle: '职位名称',
      jobTitlePlaceholder: '请输入职位名称',
      workYears: '目标岗位年限',
      workYearsPlaceholder: '请选择年限',
      jobDescription: '职位描述',
      jdPlaceholder: '粘贴职位描述或手动输入...',
    },
    targetJob: {
      title: '',
      experience: '',
      content: ''
    },
    aiMessage: AI_MESSAGE_DEFAULT,
    experienceRange: Array.from({ length: 50 }, (_, i) => `${i + 1}年`),
    experienceIndex: 0,
    tempExperienceIndex: [0], // picker-view value is an array
    showExperiencePicker: false,
    
    // 校验状态: 'valid' | 'invalid' | ''
    validation: {
      title: '',
      experience: '',
      content: '',
      aiMessage: 'valid' // 默认有效
    },
    shakeField: '', // 触发抖动的字段名
    isReady: false
  },

  onLoad(options: any) {
    this.initUIStrings();
    
    if (options && options.title) {
      this.setData({
        'targetJob.title': decodeURIComponent(options.title || ''),
        'targetJob.content': decodeURIComponent(options.content || ''),
        'targetJob.experience': decodeURIComponent(options.experience || '')
      }, () => {
        // 如果有传入经验，尝试匹配 picker index
        if (this.data.targetJob.experience) {
          const idx = this.data.experienceRange.findIndex(item => item === this.data.targetJob.experience);
          if (idx >= 0) {
            this.setData({ 
              experienceIndex: idx,
              tempExperienceIndex: [idx]
            });
          }
        }
        this.validateAllFields();
      });
    }
  },

  validateAllFields() {
    ['title', 'experience', 'content', 'aiMessage'].forEach(field => this.validateField(field));
  },

  initUIStrings() {
    this.setData({
      'ui.title': t('resume.toolTextTitle') || '文字生成简历',
      'ui.subtitle': t('resume.tips') || '完善以下信息，让 AI 更好地为您生成简历',
      'ui.jobTitle': t('resume.jobTitle') || '职位名称',
      'ui.jobTitlePlaceholder': t('resume.jobTitlePlaceholder') || '请输入职位名称',
      'ui.workYears': '目标岗位年限',
      'ui.workYearsPlaceholder': '请选择年限',
      'ui.jobDescription': t('resume.jobDescription') || '职位描述',
      'ui.jdPlaceholder': t('resume.jdPlaceholder') || '粘贴职位描述或手动输入...',
    });
  },

  onFieldChange(e: any) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    if (field === 'aiMessage') {
      this.setData({ aiMessage: value }, () => this.validateField('aiMessage'));
    } else {
      this.setData({
        [`targetJob.${field}`]: value
      }, () => this.validateField(field));
    }
  },

  openExperiencePicker() {
    this.setData({ 
      showExperiencePicker: true,
      tempExperienceIndex: [this.data.experienceIndex]
    });
  },

  closeExperiencePicker() {
    this.setData({ showExperiencePicker: false });
  },

  onExperiencePickerChange(e: any) {
    this.setData({ tempExperienceIndex: e.detail.value });
  },

  onExperienceConfirm() {
    const index = this.data.tempExperienceIndex[0];
    const value = this.data.experienceRange[index];
    this.setData({
      experienceIndex: index,
      'targetJob.experience': value,
      showExperiencePicker: false
    }, () => this.validateField('experience'));
  },

  onExperienceChange(e: any) {
    // Deprecated by custom picker confirm
  },

  onSyncResume() {
    // 模拟从简历同步逻辑，这里简单恢复默认提示词，或者可以从 globalData 读取简历信息拼接
    // 实际项目中可以读取 app.globalData.userProfile 等
    this.setData({ aiMessage: "与简历资料同步：请根据我的简历重点突出与该职位匹配的经历..." }, () => {
      this.validateField('aiMessage');
      ui.showToast('已同步简历提示词');
    });
  },

  validateField(field: string) {
    const { targetJob, aiMessage } = this.data;
    let isValid = false;
    let isInvalid = false;

    // Helper to calculate length (Chinese=1, English=0.5 based on requirements)
    // Req: Title >= 2 CN (4 EN) -> threshold 2
    // Req: Content >= 10 CN (20 EN) -> threshold 10
    // Req: AI Message <= 500 CN (1000 EN) -> threshold 500
    const getLen = (str: string) => {
      let len = 0;
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127 || str.charCodeAt(i) === 94) {
          len += 1;
        } else {
          len += 0.5;
        }
      }
      return len;
    };

    if (field === 'title') {
      const len = getLen(targetJob.title);
      // Title: Min 2 CN (4 EN), no uncommon special chars
      // Regex: Allow CN, EN, Numbers, spaces, common punctuation
      const isCommonChars = /^[a-zA-Z0-9\u4e00-\u9fa5\s\-\(\)\/]+$/.test(targetJob.title);
      if (len >= 2 && isCommonChars) isValid = true;
      else if (targetJob.title.length > 0 && (!isCommonChars || len < 2)) isInvalid = false; // Initial input, don't show red immediately? Prompt says "if exceeds input border red". 
      // Wait, prompt says: "If satisfy min input -> Light Blue. If exceed input -> Red".
      // What is "exceed input"? Maybe max length? Or "invalid characters"?
      // Let's assume red is for invalid state when not empty?
      // Re-reading: "如果满足了最小输入，输入框边框变为浅蓝色，如果超出了输入，边框变为红色。"
      // "超出了输入" usually means max length.
      // But for Title, max length isn't specified, only "uncommon chars". Let's assume invalid chars = red?
      
      // Let's simplify: 
      // Valid (Blue): len >= 2 && isCommonChars
      // Invalid (Red): !isCommonChars (if not empty) OR len too long (e.g. > 50)? Let's set max 50.
      if (len > 50 || (targetJob.title.length > 0 && !isCommonChars)) isInvalid = true;
    } 
    else if (field === 'experience') {
      // Experience: Selected
      if (targetJob.experience) isValid = true;
    } 
    else if (field === 'content') {
      const len = getLen(targetJob.content);
      // Content: Min 10 CN (20 EN)
      if (len >= 10) isValid = true;
      // Max length check?
      if (len > 2500) isInvalid = true; // 5000 chars max in wxml
    } 
    else if (field === 'aiMessage') {
      const len = getLen(aiMessage);
      // AI Message: Min 0 (always valid if <= max), Max 500 CN (1000 EN)
      if (len <= 500) isValid = true;
      else isInvalid = true;
    }

    const validationState = isInvalid ? 'invalid' : (isValid ? 'valid' : '');
    
    this.setData({
      [`validation.${field}`]: validationState
    }, () => this.checkFormValidity());
  },

  checkFormValidity() {
    const { validation } = this.data;
    const isReady = validation.title === 'valid' && 
                    validation.experience === 'valid' && 
                    validation.content === 'valid' && 
                    validation.aiMessage === 'valid';
    
    if (isReady !== this.data.isReady) {
      this.setData({ isReady });
    }
  },

  onDisabledTap() {
    // Find first invalid field
    const { validation } = this.data;
    const fields = ['title', 'experience', 'content', 'aiMessage'];
    let firstInvalid = fields.find(f => validation[f as keyof typeof validation] !== 'valid');

    if (firstInvalid) {
      // Trigger shake
      this.setData({ shakeField: firstInvalid });
      // Clear shake after animation
      setTimeout(() => {
        this.setData({ shakeField: '' });
      }, 300);
      
      // Haptic feedback
      wx.vibrateShort({ type: 'medium' });
    }
  },

  handleSubmit() {
    if (!this.data.isReady) return; // Should be handled by disabled state, but double check

    wx.vibrateShort({ type: 'medium' });

    const { targetJob, aiMessage } = this.data
    const mockJobData = {
      _id: `CUSTOM_${Date.now()}`,
      _is_custom: true,
      title: targetJob.title,
      title_chinese: targetJob.title,
      title_english: targetJob.title,
      description: targetJob.content,
      experience: targetJob.experience,
      ai_message: aiMessage,
      source_name: '自定义',
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
      }
    })
  },

  showMissingFieldsToast() {
    // Deprecated by onDisabledTap logic
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



