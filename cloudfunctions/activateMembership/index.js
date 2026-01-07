const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const { order_id } = event || {}

  if (!OPENID) {
    return {
      success: false,
      message: '无法获取用户身份',
    }
  }

  if (!order_id) {
    return {
      success: false,
      message: '订单号不能为空',
    }
  }

  try {
    // 查找订单
    const orderResult = await db.collection('orders')
      .where({
        order_id: order_id,
        user_id: OPENID,
        status: '已支付',
      })
      .get()

    if (!orderResult.data || orderResult.data.length === 0) {
      return {
        success: false,
        message: '订单不存在或未支付',
      }
    }

    const order = orderResult.data[0]

    // 获取会员方案
    const schemeResult = await db.collection('member_schemes')
      .where({ scheme_id: order.scheme_id })
      .get()

    if (!schemeResult.data || schemeResult.data.length === 0) {
      return {
        success: false,
        message: '会员方案不存在',
      }
    }

    const scheme = schemeResult.data[0]

    // 计算会员到期时间
    const now = new Date()
    const expireAt = new Date(now.getTime() + scheme.duration_days * 24 * 60 * 60 * 1000)

    // 获取用户当前信息
    const userRef = db.collection('users').doc(OPENID)
    const userResult = await userRef.get()
    const user = userResult.data || {}

    // 确定会员等级
    // 0:普通用户, 1:3天会员, 2:普通月卡, 3:高级月卡
    let member_level = 0
    if (scheme.scheme_id === 1) {
      member_level = 1
    } else if (scheme.scheme_id === 2) {
      member_level = 2
    } else if (scheme.scheme_id === 3) {
      member_level = 3
    }

    // 如果用户已有会员且未过期，在现有到期时间基础上延长
    // 如果已过期或没有会员，从当前时间开始计算
    let finalExpireAt = expireAt
    if (user.member_expire_at) {
      const currentExpireAt = new Date(user.member_expire_at)
      if (currentExpireAt > now) {
        // 未过期，延长
        finalExpireAt = new Date(currentExpireAt.getTime() + scheme.duration_days * 24 * 60 * 60 * 1000)
      }
    }

    // 更新用户会员信息
    // 如果是同等级会员，配额累加；如果是升级，使用新配额
    let ai_resume_quota = scheme.ai_limit
    let email_quota = scheme.email_limit

    if (user.member_level === member_level && user.member_expire_at) {
      const currentExpireAt = new Date(user.member_expire_at)
      if (currentExpireAt > now) {
        // 同等级续费，配额累加
        ai_resume_quota = (user.ai_resume_quota || 0) + scheme.ai_limit
        email_quota = (user.email_quota || 0) + scheme.email_limit
      }
    }

    await userRef.update({
      data: {
        member_level,
        member_expire_at: finalExpireAt,
        ai_resume_quota,
        email_quota,
        updatedAt: db.serverDate(),
      },
    })

    const updatedUser = await userRef.get()

    return {
      success: true,
      message: '会员激活成功',
      user: updatedUser.data,
    }
  } catch (err) {
    console.error('激活会员失败:', err)
    return {
      success: false,
      message: '激活会员失败',
      error: err.message,
    }
  }
}

