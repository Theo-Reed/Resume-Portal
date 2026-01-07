const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 统一邮件配额扣减逻辑
 * event: {
 *   job_id: string,
 *   email_type: 'send' | 'communication'
 * }
 */
exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  const { OPENID } = cloud.getWXContext()
  const { job_id, email_type = 'send' } = event || {}

  if (!OPENID || !job_id) {
    return { success: false, message: '参数无效' }
  }

  try {
    const userRef = db.collection('users').doc(OPENID)
    const userRes = await userRef.get()
    const user = userRes.data

    if (!user) return { success: false, message: '用户不存在' }

    const now = new Date()
    const membership = user.membership || { level: 0 }
    const level = membership.level || 0
    const expireAt = membership.expire_at ? new Date(membership.expire_at) : null
    const isValidMember = level > 0 && expireAt && expireAt > now

    if (!isValidMember) {
      return { success: false, message: '会员已过期或未激活', needUpgrade: true }
    }

    // 1. 全局审计（300次硬上限）
    if (membership.total_ai_usage && membership.total_ai_usage.used >= (membership.total_ai_usage.limit || 300)) {
      return { success: false, message: '总 AI 配额已耗尽' }
    }

    // 2. 差异化权益判断
    if (level === 1 || level === 2) {
      const jobDetails = membership.job_details || {}
      const currentJob = jobDetails[job_id]

      if (!currentJob) {
        return { success: false, message: '请先为该岗位生成简历' }
        }

      if (email_type === 'send') {
        // 投递：每个岗位仅限1次
        if (currentJob.applied) {
          return { success: false, message: '该岗位已投递过，请勿重复投递' }
        }
      } else {
        // 后续沟通
        const followupLimit = level === 1 ? 0 : 5;
        if (followupLimit === 0) {
          return { success: false, message: '您的会员级别不支持后续沟通', needUpgrade: true }
        }
        if (currentJob.email_count >= followupLimit) {
          return { success: false, message: `该岗位后续沟通次数已达上限 (${followupLimit}次)`, needUpgrade: true }
        }
      }
    }

    // 3. 执行扣减与更新
    const updateData = {
      'membership.total_ai_usage.used': _.inc(1),
      'updatedAt': db.serverDate()
    }

    const jobPath = `membership.job_details.${job_id}`
    if (email_type === 'send') {
      updateData[`${jobPath}.applied`] = true
    } else {
      updateData[`${jobPath}.email_count`] = _.inc(1)
    }

    await userRef.update({ data: updateData })

    // 同步更新 user_job_usage 集合以保持兼容性
    try {
      const usageCol = db.collection('user_job_usage')
      const usageRes = await usageCol.where({ user_id: OPENID, job_id }).get()
      if (usageRes.data.length > 0) {
        const usageUpdate = { updatedAt: db.serverDate() }
        if (email_type === 'send') {
          usageUpdate.email_sends_count = _.inc(1)
      } else {
          usageUpdate.email_communications_count = _.inc(1)
        }
        await usageCol.doc(usageRes.data[0]._id).update({ data: usageUpdate })
      }
    } catch (e) { console.error('Sync to user_job_usage failed', e) }

    return { success: true, message: '使用成功' }
  } catch (err) {
    console.error(err)
    return { success: false, message: '系统错误', error: err.message }
  }
}
