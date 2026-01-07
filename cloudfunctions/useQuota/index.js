const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const { quota_type, amount = 1 } = event || {} // quota_type: 'ai_resume' | 'email'

  if (!OPENID) {
    return {
      success: false,
      message: '无法获取用户身份',
    }
  }

  if (!quota_type || (quota_type !== 'ai_resume' && quota_type !== 'email')) {
    return {
      success: false,
      message: '配额类型无效，必须是 ai_resume 或 email',
    }
  }

  if (amount <= 0) {
    return {
      success: false,
      message: '使用数量必须大于0',
    }
  }

  try {
    const userRef = db.collection('users').doc(OPENID)
    const userResult = await userRef.get()
    const user = userResult.data || {}

    // 先检查会员状态
    const now = new Date()
    const expireAt = user.member_expire_at ? new Date(user.member_expire_at) : null
    const isValidMember = user.member_level && user.member_level > 0 && expireAt && expireAt > now

    if (!isValidMember) {
      return {
        success: false,
        message: '您不是有效会员或会员已过期',
        needUpgrade: true,
      }
    }

    // 检查配额
    const quotaField = quota_type === 'ai_resume' ? 'ai_resume_quota' : 'email_quota'
    const currentQuota = user[quotaField] || 0

    if (currentQuota < amount) {
      return {
        success: false,
        message: `剩余${quota_type === 'ai_resume' ? 'AI简历' : '邮件'}配额不足`,
        currentQuota,
        needUpgrade: true,
      }
    }

    // 扣除配额
    const newQuota = currentQuota - amount
    await userRef.update({
      data: {
        [quotaField]: newQuota,
        updatedAt: db.serverDate(),
      },
    })

    const updatedUser = await userRef.get()

    return {
      success: true,
      message: '配额使用成功',
      remainingQuota: newQuota,
      user: updatedUser.data,
    }
  } catch (err) {
    console.error('使用配额失败:', err)
    return {
      success: false,
      message: '使用配额失败',
      error: err.message,
    }
  }
}

