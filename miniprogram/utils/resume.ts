// miniprogram/utils/resume.ts
import { ui } from './ui'
import { callApi } from './request'
import { normalizeLanguage, t, AppLanguage } from './i18n/index'
import { StatusCode } from './statusCodes'

export interface ResumeGenerateOptions {
  onStart?: () => void
  onFinish?: (success: boolean) => void
  onCancel?: () => void
  showSuccessModal?: boolean
}

/**
 * 统一处理生成 AI 简历的业务流：刷新用户、校验完整度、构造数据、调用 API、处理异常、展示成功弹窗
 */
export async function requestGenerateResume(jobData: any, options: ResumeGenerateOptions = {}) {
  const app = getApp<any>()
  
  if (options.onStart) options.onStart()

  try {
    // 1. 实时刷新用户以获取最新的资料
    const user = await app.refreshUser()
    if (!user) {
      if (options.onFinish) options.onFinish(false)
      ui.showError('获取用户信息失败，请重试')
      return
    }

    const profile = user.resume_profile || {}
    const interfaceLang = normalizeLanguage(app.globalData.language)

    // 2. 语言选择对话框
    let selectContent = t('resume.generateResumeContent', interfaceLang)
    let isEnglishStatus = jobData?.is_english

    if (jobData && jobData._is_custom) {
      // 首页手动输入模式，判断 JD 语言含量
      const jd = jobData.description || ''
      const englishChars = jd.match(/[a-zA-Z]/g) || []
      const totalLen = jd.length || 1
      const isActuallyEnglish = (englishChars.length / totalLen) > 0.6
      
      isEnglishStatus = isActuallyEnglish ? 1 : 0
      selectContent = isActuallyEnglish 
        ? t('resume.jobMayBeEnglish', interfaceLang) 
        : t('resume.jobMayBeChinese', interfaceLang)
    } else if (jobData && typeof jobData.is_english !== 'undefined') {
      selectContent = jobData.is_english === 1 
        ? t('resume.jobIsEnglish', interfaceLang) 
        : t('resume.jobIsChinese', interfaceLang)
    }

    ui.showModal({
      title: t('resume.generateResumeTitle', interfaceLang),
      content: selectContent,
      confirmText: t('resume.langChinese', interfaceLang),
      cancelText: t('resume.langEnglish', interfaceLang),
      emphasis: isEnglishStatus === 1 ? 'left' : 'right',
      showCancel: true,
      success: async (selectRes: any) => {
        // 如果点击 mask 关闭，或者点击取消按钮（对于这个弹窗通常视为关闭行为）
        // 且用户既没有确认也没有取消选中状态时，我们重置 leads 状态并退出
        if (selectRes && selectRes.isMask) {
          if (options.onCancel) options.onCancel()
          if (options.onFinish) options.onFinish(false)
          return
        }

        if (!selectRes || (!selectRes.confirm && !selectRes.cancel)) {
          if (options.onCancel) options.onCancel()
          if (options.onFinish) options.onFinish(false)
          return
        }

        const chosenIsChinese = selectRes.confirm
        const targetLang: AppLanguage = chosenIsChinese ? 'Chinese' : 'English'
        
        // --- NEW CONTENT CHECK & LOADING LOGIC ---
        ui.showLoading('内容检测中...', true);
        const startTime = Date.now();

        try {
          // Check all relevant text fields
          const contentToCheck = [
            jobData.title,
            jobData.description,
            jobData.ai_message
          ].filter(Boolean);

          const checkRes = await callApi('check-content', { content: contentToCheck });

          if (checkRes.code !== StatusCode.SUCCESS) {
            ui.hideLoading();
            ui.showError(checkRes.message || '内容包含敏感词汇，请修改后重试');
            if (options.onFinish) options.onFinish(false);
            return;
          }

          // Ensure minimum 2.5s loading time
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 2500 - elapsedTime);
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          ui.showLoading('正在生成简历...', true);
        } catch (err) {
          ui.hideLoading();
          ui.showError('检测服务暂不可用，请稍后重试');
          if (options.onFinish) options.onFinish(false);
          return;
        }
        // --- END NEW LOGIC ---

        // 3. 简历完整度校验 (一切以后端物理字段 level 为准)
        const completeness = chosenIsChinese 
          ? (profile.zh?.completeness || { level: 0 }) 
          : (profile.en?.completeness || { level: 0 });

        console.log(`[ResumeService] Chosen: ${targetLang}, User Data (zh/en pool): ${!!profile.zh}/${!!profile.en}, Backend Level: ${completeness.level}`)

        if (completeness.level < 1) {
          if (options.onFinish) options.onFinish(false)
          
          ui.showModal({
            title: t('jobs.basicInfoIncompleteTitle', interfaceLang),
            content: t('jobs.profileIncompleteContent', interfaceLang),
            confirmText: t('jobs.profileIncompleteConfirm', interfaceLang),
            cancelText: t('jobs.generateAnyway', interfaceLang),
            success: async (modalRes) => {
              if (modalRes.confirm) {
                wx.navigateTo({ url: '/pages/resume-profile/index' })
                if (options.onCancel) options.onCancel()
              } else if (modalRes.cancel) {
                // 用户选择“直接生成”
                await doGenerate(user, profile, jobData, chosenIsChinese, interfaceLang, options)
              }
            }
          })
          return
        }

        // 4. 资料已达标，进入正式生成流程
        await doGenerate(user, profile, jobData, chosenIsChinese, interfaceLang, options)
      }
    })

  } catch (err) {
    console.error('[ResumeService] Generation flow failed:', err)
    if (options.onFinish) options.onFinish(false)
    const app = getApp<any>()
    const lang = normalizeLanguage(app.globalData.language)
    ui.showError(t('jobs.checkFailed', lang))
  }
}

/**
 * 执行实际的生成请求
 */
async function doGenerate(user: any, profile: any, job: any, isChineseEnv: boolean, lang: AppLanguage, options: ResumeGenerateOptions) {
  try {
    // 构造 AI 生成所需的 Profile 数据，合并顶层字段与当前语言偏好
    let aiProfile: any = {
      ...profile,
      gender: user.gender,
      photo: user.avatar || profile.photo
    }
    
    const currentLangProfile = isChineseEnv ? (profile.zh || {}) : (profile.en || {})
    
    aiProfile = {
      ...aiProfile,
      ...currentLangProfile,
      // 确保数组字段存在
      workExperiences: currentLangProfile.workExperiences || profile.workExperiences || [],
      educations: currentLangProfile.educations || profile.educations || [],
      skills: currentLangProfile.skills || profile.skills || [],
      certificates: currentLangProfile.certificates || profile.certificates || [],
      zh: profile.zh,
      en: profile.en
    }

    const res = await callApi<any>('generate', {
      jobId: job._id,
      openid: user.openid,
      resume_profile: aiProfile,
      job_data: job,
      language: isChineseEnv ? 'chinese' : 'english'
    })

    if (res.success && res.result?.task_id) {
      if (options.onFinish) options.onFinish(true)
      
      if (options.showSuccessModal !== false) {
        // 展示统一的成功提效模态框
        showGenerationSuccessModal()
      }
    } else {
      throw new Error('Service response error')
    }
  } catch (err: any) {
    console.error('[ResumeService] API call failed:', err)
    if (options.onFinish) options.onFinish(false)
    handleGenerateError(err, lang)
  }
}

/**
 * 成功触发生成后的全局统一提示
 * @deprecated Use ui.showGenerationSuccessModal()
 */
export function showGenerationSuccessModal() {
  ui.showGenerationSuccessModal();
}

/**
 * 统一处理生成过程中的业务错误（配额、并发等）
 */
function handleGenerateError(err: any, _lang: string) {
  const isQuotaError = (err?.data?.code === StatusCode.QUOTA_EXHAUSTED) || (err?.statusCode === StatusCode.HTTP_FORBIDDEN) || (err?.data?.error === 'Quota exhausted');
  const isProcessingError = (err?.statusCode === StatusCode.HTTP_CONFLICT) || (err?.data?.message && err.data.message.includes('生成中'));

  if (isProcessingError) {
    ui.showModal({
      title: t('jobs.generatingTitle'),
      content: t('jobs.generatingContent'),
      showCancel: false,
      confirmText: t('jobs.generatingConfirm'),
      isAlert: true
    });
    return;
  }

  if (isQuotaError) {
    ui.showModal({
      title: t('jobs.quotaExhaustedTitle'),
      content: err?.data?.message || t('jobs.quotaExhaustedContent'),
      confirmText: t('jobs.quotaExhaustedConfirm'),
      cancelText: t('jobs.quotaExhaustedCancel'),
      isAlert: true,
      success: (res) => {
        if (res.confirm) {
          const app = getApp<any>();
          app.globalData.tabSelected = 2;
          app.globalData.openMemberHubOnShow = true;
          wx.reLaunch({ url: '/pages/main/index' })
        }
      }
    })
    return;
  }

  ui.showModal({
    title: t('jobs.generateFailedTitle'),
    content: err?.data?.message || err?.message || t('jobs.generateFailedTitle'),
    showCancel: false,
    isAlert: true
  })
}

/**
 * 启动后台任务检查逻辑 (用于用户异常退出后的补偿)
 * 会在 App 启动且登录成功后调用一次
 */
export async function startBackgroundTaskCheck() {
  try {
    // 1. 查找是否有正在处理中的任务
    const res = await callApi<any>('getGeneratedResumes', { 
      status: 'processing',
      limit: 5 // 只查最近几个
    });

    if (res.success && res.result?.items && res.result.items.length > 0) {
      console.log(`[TaskCheck] Found ${res.result.items.length} processing tasks. Starting poll...`);
      
      // 对于每个正在处理的任务，启动一个定时检查
      res.result.items.forEach((task: any) => {
        pollTaskStatus(task.task_id);
      });
    }

    // 2. [可选] 也可以检查最近 5 分钟内是否有成功但在用户“离线”期间完成的任务
    // 这里简单处理：如果发现有 processing，就 poll。
  } catch (err) {
    console.error('[TaskCheck] Failed to check pending tasks:', err);
  }
}

/**
 * 轮询特定任务的状态
 */
async function pollTaskStatus(taskId: string, attempt = 0) {
  if (attempt > 30) { // 最多轮询 30 次 (5 约分钟)
    console.warn(`[TaskCheck] Poll timeout for task ${taskId}`);
    return;
  }

  try {
    const res = await callApi<any>('getGeneratedResumes', { task_id: taskId });
    if (res.success && res.result?.items && res.result.items.length > 0) {
      const task = res.result.items[0];
      if (task.status === 'success') {
        console.log(`[TaskCheck] Task ${taskId} finished successfully! Showing modal.`);
        ui.showGenerationSuccessModal();
      } else if (task.status === 'failed') {
        console.warn(`[TaskCheck] Task ${taskId} failed.`);
      } else {
        // Still processing, wait 10s and retry
        setTimeout(() => pollTaskStatus(taskId, attempt + 1), 10000);
      }
    }
  } catch (err) {
    console.error(`[TaskCheck] Poll error for ${taskId}:`, err);
    // Errored, retry later
    setTimeout(() => pollTaskStatus(taskId, attempt + 1), 15000);
  }
}

