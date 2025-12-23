// cloudfunctions/initUser/index.js
// 初始化用户记录（首次进入小程序时调用）

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const userRef = db.collection('users').doc(OPENID)

  try {
    const existing = await userRef.get()
    return { openid: OPENID, user: existing.data }
  } catch (err) {
    const now = db.serverDate()
    await userRef.set({
      data: {
        openid: OPENID,
        isAuthed: false,
        phone: null,
        nickname: null,
        avatar: null,
        createdAt: now,
        updatedAt: now,
      },
    })

    const created = await userRef.get()
    return { openid: OPENID, user: created.data }
  }
}
