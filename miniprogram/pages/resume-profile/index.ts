// miniprogram/pages/resume-profile/index.ts
import { normalizeLanguage, t } from '../../utils/i18n'
import { attachLanguageAware } from '../../utils/languageAware'

Page({
  data: {
    // 个人信息
    name: '',
    photo: '',
    wechat: '',
    email: '',
    phone: '',
    // 教育经历（可以有多个）
    educations: [] as Array<{ 
      school: string; 
      degree: string; 
      major: string; 
      startDate: string; 
      endDate: string;
      description?: string;
      graduationDate?: string; // 兼容旧版
    }>,
    // 证书
    certificates: [] as string[],
    
    // 编辑状态
    showEduDrawer: false,
    showDegreePicker: false,
    degreePickerValue: [0, 0],
    studyTypes: [] as string[],
    showDatePicker: false,
    currentDatePickingField: '', // 'startDate' | 'endDate'
    datePickerValue: [0, 0],
    years: [] as number[],
    months: [] as number[],
    editingEduIndex: -1, // -1 表示新增
    eduForm: {
      school: '',
      degree: '',
      major: '',
      startDate: '',
      endDate: '',
      description: '',
    },
    degreeOptions: [] as string[],
    
    // UI 文本
    ui: {} as Record<string, any>,
  },

  onLoad() {
    // attach language-aware behavior
    ;(this as any)._langDetach = attachLanguageAware(this, {
      onLanguageRevive: () => {
        wx.setNavigationBarTitle({ title: '' })
        this.updateLanguage()
      },
    })

    this.updateLanguage()
    this.initDateOptions()
    this.loadResumeData()
  },

  initDateOptions() {
    const years = []
    const currentYear = new Date().getFullYear()
    for (let i = currentYear - 50; i <= currentYear + 10; i++) {
      years.push(i)
    }
    const months = []
    for (let i = 1; i <= 12; i++) {
      months.push(i)
    }
    this.setData({ years, months })
  },

  onUnload() {
    const fn = (this as any)._langDetach
    if (typeof fn === 'function') fn()
    ;(this as any)._langDetach = null
  },

  onShow() {
    wx.setNavigationBarTitle({ title: '' })
    this.updateLanguage()
  },

  updateLanguage() {
    const app = getApp<IAppOption>() as any
    const lang = normalizeLanguage(app?.globalData?.language)
    
    const ui = {
      title: t('resume.title', lang),
      tips: t('resume.tips', lang),
      personalInfo: t('resume.personalInfo', lang),
      contactInfo: t('resume.contactInfo', lang),
      name: t('resume.name', lang),
      photo: t('resume.photo', lang),
      wechat: t('resume.wechat', lang),
      email: t('resume.email', lang),
      phone: t('resume.phone', lang),
      education: t('resume.education', lang),
      certificates: t('resume.certificates', lang),
      degree: t('resume.degree', lang),
      major: t('resume.major', lang),
      startDate: t('resume.startDate', lang),
      endDate: t('resume.endDate', lang),
      graduationDate: t('resume.graduationDate', lang),
      timePeriod: t('resume.timePeriod', lang),
      schoolPlaceholder: t('resume.schoolPlaceholder', lang),
      majorPlaceholder: t('resume.majorPlaceholder', lang),
      degreePlaceholder: t('resume.degreePlaceholder', lang),
      description: t('resume.description', lang),
      descriptionPlaceholder: t('resume.descriptionPlaceholder', lang),
      optional: t('resume.optional', lang),
      addEducation: t('resume.addEducation', lang),
      addCertificate: t('resume.addCertificate', lang),
      noData: t('resume.noData', lang),
      save: t('resume.save', lang),
      cancel: t('resume.cancel', lang),
      delete: t('resume.delete', lang),
    }

    const degreeOptions = t<string[]>('resume.degreeOptions', lang)
    const studyTypes = t<string[]>('resume.studyTypes', lang)

    this.setData({ ui, degreeOptions, studyTypes })
  },

  loadResumeData() {
    const app = getApp<IAppOption>() as any
    const user = app?.globalData?.user

    if (user) {
      // 核心改动：使用新的 resume_profile 字段
      const profile = user.resume_profile || {}
      
      this.setData({
        name: profile.name || '',
        photo: profile.photo || '',
        wechat: profile.wechat || '',
        email: profile.email || '',
        phone: profile.phone || user.phone || '', // 兜底使用账户手机号
        educations: profile.educations || [],
        certificates: profile.certificates || [],
      })
    }
  },

  async saveResumeProfile(data: any) {
    try {
      wx.showLoading({ title: '保存中...' })
      const res: any = await wx.cloud.callFunction({
        name: 'updateUserProfile',
        data: { resume_profile: data }
      })
      
      if (res.result?.ok) {
        const app = getApp<IAppOption>() as any
        app.globalData.user = res.result.user
        this.loadResumeData()
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        throw new Error('保存失败')
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  // UI Event Handlers
  onEditPhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        try {
          const cloudPath = `resume_photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePath,
          })
          await this.saveResumeProfile({ photo: uploadRes.fileID })
        } catch (e) {
          wx.showToast({ title: '上传失败', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },
  onEditName() {
    wx.showModal({
      title: '编辑姓名',
      placeholderText: '请输入真实姓名',
      editable: true,
      content: this.data.name,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ name: res.content })
        }
      }
    })
  },
  onEditWechat() {
    wx.showModal({
      title: '编辑微信号',
      placeholderText: '请输入微信号',
      editable: true,
      content: this.data.wechat,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ wechat: res.content })
        }
      }
    })
  },
  onEditEmail() {
    wx.showModal({
      title: '编辑邮箱',
      placeholderText: '请输入联系邮箱',
      editable: true,
      content: this.data.email,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ email: res.content })
        }
      }
    })
  },
  onEditPhone() {
    wx.showModal({
      title: '编辑手机号',
      placeholderText: '请输入联系手机号',
      editable: true,
      content: this.data.phone,
      success: (res) => {
        if (res.confirm && res.content) {
          this.saveResumeProfile({ phone: res.content })
        }
      }
    })
  },
  
  // 教育经历相关逻辑
  onAddEducation() {
    this.setData({
      showEduDrawer: true,
      editingEduIndex: -1,
      eduForm: {
        school: '',
        degree: '',
        major: '',
        startDate: '',
        endDate: '',
        description: '',
      }
    })
  },
  onEditEducation(e: any) {
    const index = e.currentTarget.dataset.index
    const edu = this.data.educations[index]
    this.setData({
      showEduDrawer: true,
      editingEduIndex: index,
      eduForm: {
        school: edu.school || '',
        degree: edu.degree || '',
        major: edu.major || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || edu.graduationDate || '', // 兼容
        description: edu.description || '',
      }
    })
  },
  closeEduDrawer() {
    this.setData({ showEduDrawer: false })
  },
  
  // 自定义学历选择器逻辑
  openDegreePicker() {
    const currentDegree = this.data.eduForm.degree
    let degreeIndex = 0
    let typeIndex = 0

    if (currentDegree) {
      // 尝试匹配 "本科 (全日制)" 这种格式
      const match = currentDegree.match(/^(.+?)\s*\((.+?)\)$/)
      if (match) {
        const d = match[1]
        const t = match[2]
        const di = this.data.degreeOptions.indexOf(d)
        const ti = this.data.studyTypes.indexOf(t)
        if (di > -1) degreeIndex = di
        if (ti > -1) typeIndex = ti
      } else {
        // 如果不匹配，尝试简单匹配学历
        const di = this.data.degreeOptions.indexOf(currentDegree)
        if (di > -1) degreeIndex = di
      }
    }

    this.setData({ 
      showDegreePicker: true,
      degreePickerValue: [degreeIndex, typeIndex]
    })
  },
  closeDegreePicker() {
    this.setData({ showDegreePicker: false })
  },
  onDegreePickerChange(e: any) {
    this.setData({ degreePickerValue: e.detail.value })
  },
  onConfirmDegree() {
    const [dIdx, tIdx] = this.data.degreePickerValue
    const degree = this.data.degreeOptions[dIdx]
    const type = this.data.studyTypes[tIdx]
    const degreeStr = `${degree} (${type})`
    
    this.setData({
      'eduForm.degree': degreeStr,
      showDegreePicker: false
    })
  },

  // 自定义日期选择器逻辑
  openDatePicker(e: any) {
    const field = e.currentTarget.dataset.field
    const currentDate = (this.data.eduForm as any)[field]
    
    let yearIndex = this.data.years.indexOf(new Date().getFullYear())
    let monthIndex = new Date().getMonth()

    if (currentDate) {
      const [y, m] = currentDate.split('-').map(Number)
      const foundYearIndex = this.data.years.indexOf(y)
      if (foundYearIndex > -1) yearIndex = foundYearIndex
      monthIndex = m - 1
    }

    this.setData({ 
      showDatePicker: true,
      currentDatePickingField: field,
      datePickerValue: [yearIndex, monthIndex]
    })
  },
  closeDatePicker() {
    this.setData({ showDatePicker: false })
  },
  onDatePickerChange(e: any) {
    this.setData({ datePickerValue: e.detail.value })
  },
  onConfirmDate() {
    const [yIdx, mIdx] = this.data.datePickerValue
    const year = this.data.years[yIdx]
    const month = String(this.data.months[mIdx]).padStart(2, '0')
    const dateStr = `${year}-${month}`
    
    const field = this.data.currentDatePickingField
    const otherField = field === 'startDate' ? 'endDate' : 'startDate'
    const otherDate = (this.data.eduForm as any)[otherField]

    // 校验：开始时间不能晚于结束时间
    if (otherDate) {
      if (field === 'startDate' && dateStr > otherDate) {
        wx.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' })
        return
      }
      if (field === 'endDate' && dateStr < otherDate) {
        wx.showToast({ title: '结束时间不能早于开始时间', icon: 'none' })
        return
      }
    }
    
    this.setData({
      [`eduForm.${field}`]: dateStr,
      showDatePicker: false
    })
  },

  onEduSchoolInput(e: any) {
    this.setData({ 'eduForm.school': e.detail.value })
  },
  onEduDegreeChange(e: any) {
    this.setData({ 'eduForm.degree': this.data.degreeOptions[e.detail.value] })
  },
  onEduMajorInput(e: any) {
    this.setData({ 'eduForm.major': e.detail.value })
  },
  onEduStartDateChange(e: any) {
    this.setData({ 'eduForm.startDate': e.detail.value })
  },
  onEduEndDateChange(e: any) {
    this.setData({ 'eduForm.endDate': e.detail.value })
  },
  onEduDescriptionInput(e: any) {
    this.setData({ 'eduForm.description': e.detail.value })
  },
  async onSaveEducation() {
    const { eduForm, editingEduIndex, educations, ui } = this.data
    
    // 全字段校验
    if (!eduForm.school.trim()) {
      wx.showToast({ title: ui.schoolPlaceholder || '请输入学校', icon: 'none' })
      return
    }
    if (!eduForm.degree) {
      wx.showToast({ title: ui.degreePlaceholder || '请选择学历', icon: 'none' })
      return
    }
    if (!eduForm.major.trim()) {
      wx.showToast({ title: ui.majorPlaceholder || '请输入专业', icon: 'none' })
      return
    }
    if (!eduForm.startDate) {
      wx.showToast({ title: '请选择开始时间', icon: 'none' })
      return
    }
    if (!eduForm.endDate) {
      wx.showToast({ title: '请选择结束时间', icon: 'none' })
      return
    }

    // 时间逻辑校验
    if (eduForm.startDate > eduForm.endDate) {
      wx.showToast({ title: '开始时间不能晚于结束时间', icon: 'none' })
      return
    }

    const newEducations = [...educations]
    const eduData = { ...eduForm }

    if (editingEduIndex === -1) {
      newEducations.push(eduData)
    } else {
      newEducations[editingEduIndex] = eduData
    }

    await this.saveResumeProfile({ educations: newEducations })
    this.closeEduDrawer()
  },
  async onDeleteEducation() {
    const { editingEduIndex, educations } = this.data
    if (editingEduIndex === -1) return

    wx.showModal({
      title: '删除确认',
      content: '确定要删除这段教育经历吗？',
      success: async (res) => {
        if (res.confirm) {
          const newEducations = [...educations]
          newEducations.splice(editingEduIndex, 1)
          await this.saveResumeProfile({ educations: newEducations })
          this.closeEduDrawer()
        }
      }
    })
  },
  
  onAddCertificate() {
    wx.showModal({
      title: '添加证书',
      placeholderText: '请输入证书名称，如：CET-6',
      editable: true,
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          const newCertificates = [...this.data.certificates, res.content.trim()]
          await this.saveResumeProfile({ certificates: newCertificates })
        }
      }
    })
  },
  onEditCertificate(e: any) {
    const index = e.currentTarget.dataset.index
    const currentCert = this.data.certificates[index]
    wx.showModal({
      title: '编辑证书',
      editable: true,
      content: currentCert,
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          const newCertificates = [...this.data.certificates]
          newCertificates[index] = res.content.trim()
          await this.saveResumeProfile({ certificates: newCertificates })
        }
      }
    })
  },
  onDeleteCertificate(e: any) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '确认删除',
      content: `确定要删除“${this.data.certificates[index]}”吗？`,
      success: async (res) => {
        if (res.confirm) {
          const newCertificates = [...this.data.certificates]
          newCertificates.splice(index, 1)
          await this.saveResumeProfile({ certificates: newCertificates })
        }
      }
    })
  },
})

