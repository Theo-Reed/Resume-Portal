const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const { order_id, status } = event || {}

  if (!OPENID) {
    return {
      success: false,
      message: '无法获取用户身份',
    }
  }

  if (!order_id || !status) {
    return {
      success: false,
      message: '订单号和状态不能为空',
    }
  }

  const validStatuses = ['待支付', '已支付', '已退款', '已关闭']
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      message: '无效的订单状态',
    }
  }

  try {
    // 查找订单
    const orderResult = await db.collection('orders')
      .where({
        order_id: order_id,
        user_id: OPENID,
      })
      .get()

    if (!orderResult.data || orderResult.data.length === 0) {
      return {
        success: false,
        message: '订单不存在',
      }
    }

    const order = orderResult.data[0]

    // 如果订单已经是已支付状态，不允许再次修改
    if (order.status === '已支付' && status !== '已支付') {
      return {
        success: false,
        message: '已支付的订单不能修改状态',
      }
    }

    const updateData = {
      status,
      updatedAt: db.serverDate(),
    }

    // 如果状态是已支付，记录支付时间
    if (status === '已支付' && !order.pay_time) {
      updateData.pay_time = db.serverDate()
    }

    await db.collection('orders').doc(order._id).update({
      data: updateData,
    })

    const updatedOrder = await db.collection('orders').doc(order._id).get()

    return {
      success: true,
      order: updatedOrder.data,
    }
  } catch (err) {
    console.error('更新订单状态失败:', err)
    return {
      success: false,
      message: '更新订单状态失败',
      error: err.message,
    }
  }
}

