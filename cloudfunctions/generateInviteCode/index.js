// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 生成8位邀请码的函数
function generateInviteCode(openid) {
  // 使用openid的hash值生成邀请码，确保永不重复
  let hash = 0
  for (let i = 0; i < openid.length; i++) {
    const char = openid.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }

  // 取绝对值并转换为8位字符串
  const positiveHash = Math.abs(hash)
  const code = positiveHash.toString(36).toUpperCase().padStart(8, '0').slice(-8)

  return code
}

// 检查邀请码是否已存在
async function checkInviteCodeExists(inviteCode) {
  try {
    const result = await db.collection('users').where({
      inviteCode: inviteCode
    }).count()

    return result.total > 0
  } catch (err) {
    console.error('checkInviteCodeExists error:', err)
    return false
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      message: '无法获取用户身份'
    }
  }

  try {
    // 先检查用户是否已有邀请码
    const userResult = await db.collection('users').where({
      openid: openid
    }).get()

    if (userResult.data.length > 0 && userResult.data[0].inviteCode) {
      return {
        success: true,
        inviteCode: userResult.data[0].inviteCode
      }
    }

    // 生成邀请码
    let inviteCode = generateInviteCode(openid)
    let attempts = 0
    const maxAttempts = 10

    // 确保邀请码不重复
    while (await checkInviteCodeExists(inviteCode) && attempts < maxAttempts) {
      // 如果重复，添加一些随机性再生成
      inviteCode = generateInviteCode(openid + Math.random().toString())
      attempts++
    }

    if (attempts >= maxAttempts) {
      return {
        success: false,
        message: '生成邀请码失败，请重试'
      }
    }

    // 更新用户记录
    if (userResult.data.length > 0) {
      await db.collection('users').doc(userResult.data[0]._id).update({
        data: {
          inviteCode: inviteCode,
          updatedAt: new Date()
        }
      })
    } else {
      // 如果用户记录不存在，创建新记录
      await db.collection('users').add({
        data: {
          openid: openid,
          inviteCode: inviteCode,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
    }

    return {
      success: true,
      inviteCode: inviteCode
    }

  } catch (err) {
    console.error('generateInviteCode error:', err)
    return {
      success: false,
      message: '生成邀请码失败'
    }
  }
}
