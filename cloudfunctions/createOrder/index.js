const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const { scheme_id, amount } = event || {}

  if (!OPENID) {
    return {
      success: false,
      message: '无法获取用户身份',
    }
  }

  if (!scheme_id) {
    return {
      success: false,
      message: '请选择会员方案',
    }
  }

  try {
    // 验证方案是否存在
    const schemeResult = await db.collection('member_schemes')
      .where({ scheme_id: scheme_id })
      .get()

    if (!schemeResult.data || schemeResult.data.length === 0) {
      return {
        success: false,
        message: '会员方案不存在',
      }
    }

    const scheme = schemeResult.data[0]
    const actualAmount = amount || scheme.price

    // 生成唯一订单号：时间戳 + 随机数，并检查唯一性
    let order_id = null
    let attempts = 0
    const maxAttempts = 10

    while (!order_id && attempts < maxAttempts) {
      attempts++
      const candidate_id = `ORDER${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
      
      // 检查订单号是否已存在
      const existingOrder = await db.collection('orders')
        .where({ order_id: candidate_id })
        .get()
      
      if (!existingOrder.data || existingOrder.data.length === 0) {
        order_id = candidate_id
      }
      
      // 如果重复，等待1毫秒后重试（避免时间戳相同）
      if (!order_id && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }

    if (!order_id) {
      return {
        success: false,
        message: '生成唯一订单号失败，请重试',
      }
    }

    const now = db.serverDate()
    const orderData = {
      order_id,
      user_id: OPENID,
      scheme_id: scheme_id,
      amount: actualAmount,
      status: '待支付', // 待支付、已支付、已退款、已关闭
      pay_time: null,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('orders').add({
      data: orderData,
    })

    return {
      success: true,
      order_id,
      order: {
        ...orderData,
        _id: result._id,
      },
      scheme: scheme,
    }
  } catch (err) {
    console.error('创建订单失败:', err)
    return {
      success: false,
      message: '创建订单失败',
      error: err.message,
    }
  }
}

