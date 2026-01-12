// cloudfunctions/updateUserProfile/index.js
// 更新用户授权信息（头像昵称 / 手机号等）

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const { nickname, avatar, phone, isAuthed, resume_profile, resume_completeness, resume_completeness_en } = event || {}

  const updates = {}
  if (typeof nickname === 'string') updates.nickname = nickname
  if (typeof avatar === 'string') updates.avatar = avatar
  if (typeof phone === 'string') updates.phone = phone
  if (typeof isAuthed === 'boolean') updates.isAuthed = isAuthed
  if (typeof resume_completeness === 'number') updates.resume_completeness = resume_completeness
  if (typeof resume_completeness_en === 'number') updates.resume_completeness_en = resume_completeness_en
  
  // 处理 resume_profile 更新
  if (resume_profile && typeof resume_profile === 'object') {
    // 允许部分更新或整体更新
    for (const key in resume_profile) {
      updates[`resume_profile.${key}`] = resume_profile[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    const current = await db.collection('users').doc(OPENID).get()
    return { ok: true, skipped: true, user: current.data }
  }

  updates.updatedAt = db.serverDate()

  // 确保 users 文档存在（若不存在则创建）
  const userRef = db.collection('users').doc(OPENID)
  try {
    await userRef.update({ data: updates })
  } catch (err) {
    // 如果文档不存在，先创建再更新
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
    await userRef.update({ data: updates })
  }

  const updated = await userRef.get()
  return { ok: true, user: updated.data }
}
