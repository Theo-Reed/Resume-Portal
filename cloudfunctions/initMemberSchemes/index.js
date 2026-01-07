const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()

  // 会员方案配置
  const schemes = [
    {
      scheme_id: 1,
      name: '3天会员',
      name_english: '3-Day Trial',
      price: 9.9,
      duration_days: 3,
      ai_limit: 5,
      email_limit: 3,
    },
    {
      scheme_id: 2,
      name: '月普通会员',
      name_english: 'Monthly Basic',
      price: 29.9,
      duration_days: 30,
      ai_limit: 20,
      email_limit: 30,
    },
    {
      scheme_id: 3,
      name: '月高级会员',
      name_english: 'Monthly Premium',
      price: 89.9,
      duration_days: 30,
      ai_limit: 300, // 实际上限300次
      email_limit: 300, // 实际上限300次/月
    },
  ]

  try {
    const collection = db.collection('member_schemes')
    const now = db.serverDate()

    // 检查是否已存在方案
    const existing = await collection.get()
    
    if (existing.data && existing.data.length > 0) {
      // 如果已存在，更新现有方案
      const updatePromises = schemes.map(scheme => {
        return collection.where({ scheme_id: scheme.scheme_id })
          .get()
          .then(result => {
            if (result.data && result.data.length > 0) {
              // 更新现有方案
              return collection.doc(result.data[0]._id).update({
                data: {
                  ...scheme,
                  updatedAt: now,
                },
              })
            } else {
              // 添加新方案
              return collection.add({
                data: {
                  ...scheme,
                  createdAt: now,
                  updatedAt: now,
                },
              })
            }
          })
      })

      await Promise.all(updatePromises)
      return {
        success: true,
        message: '会员方案已更新',
        count: schemes.length,
      }
    } else {
      // 如果不存在，批量添加
      const addPromises = schemes.map(scheme => {
        return collection.add({
          data: {
            ...scheme,
            createdAt: now,
            updatedAt: now,
          },
        })
      })

      await Promise.all(addPromises)
      return {
        success: true,
        message: '会员方案初始化成功',
        count: schemes.length,
      }
    }
  } catch (err) {
    console.error('初始化会员方案失败:', err)
    return {
      success: false,
      message: '初始化会员方案失败',
      error: err.message,
    }
  }
}

