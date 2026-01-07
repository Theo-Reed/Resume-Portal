const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  if (!OPENID) {
    return {
      success: false,
      message: '无法获取用户身份',
    }
  }

  try {
    const userRef = db.collection('users').doc(OPENID)
    const userResult = await userRef.get()
    const user = userResult.data || {}

    const now = new Date()
    const expireAt = user.member_expire_at ? new Date(user.member_expire_at) : null

    // 检查会员是否过期
    let isExpired = true
    let isValidMember = false

    if (user.member_level && user.member_level > 0 && expireAt && expireAt > now) {
      isExpired = false
      isValidMember = true
    }

    // 如果过期，重置为普通用户
    if (isExpired && user.member_level && user.member_level > 0) {
      await userRef.update({
        data: {
          member_level: 0,
          member_expire_at: null,
          ai_resume_quota: 0,
          email_quota: 0,
          updatedAt: db.serverDate(),
        },
      })

      return {
        success: true,
        member_level: 0,
        isExpired: true,
        isValidMember: false,
        ai_resume_quota: 0,
        email_quota: 0,
        member_expire_at: null,
      }
    }

    return {
      success: true,
      member_level: user.member_level || 0,
      isExpired: isExpired,
      isValidMember: isValidMember,
      ai_resume_quota: user.ai_resume_quota || 0,
      email_quota: user.email_quota || 0,
      member_expire_at: user.member_expire_at || null,
    }
  } catch (err) {
    console.error('检查会员状态失败:', err)
    return {
      success: false,
      message: '检查会员状态失败',
      error: err.message,
    }
  }
}

