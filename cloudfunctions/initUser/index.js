const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()

  const userRef = db.collection('users').doc(OPENID)

  try {
    const existing = await userRef.get()
    const user = existing?.data || {}

    if (user.openid) {
    return { openid: OPENID, user }
    }
  } catch (err) {
    let inviteCode = null
    try {
      const generateResult = await cloud.callFunction({
        name: 'generateInviteCode'
      })
      if (generateResult.result?.success) {
        inviteCode = generateResult.result.inviteCode
      }
    } catch (inviteErr) {
      // ignore
    }

    const now = db.serverDate()
    const userData = {
        openid: OPENID,
        isAuthed: false,
        phone: null,
        nickname: null,
        avatar: null,
        language: 'Chinese',
        
        // --- 核心改动：会员权益与配额包裹字段 ---
        membership: {
          level: 0, // 0:普通用户, 1:3天会员, 2:普通月卡, 3:高级月卡
          expire_at: null,
          total_ai_usage: {
            used: 0,
            limit: 300 // 内部硬上限，对高级会员生效
          },
          job_quota: {
            used: 0,
            limit: 0
          },
          job_details: {} // 记录每个岗位的微调/沟通次数
        },

        // --- 核心改动：简历资料包裹字段 ---
        resume_profile: {
          name: '',
          photo: '',
          wechat: '',
          email: '',
          phone: '',
          educations: [],
          certificates: [],
          skills: []
        },

        createdAt: now,
        updatedAt: now,
    }

    if (inviteCode) {
      userData.inviteCode = inviteCode
    }

    await userRef.set({
      data: userData,
    })

    const created = await userRef.get()
    return { openid: OPENID, user: created.data }
  }
}
