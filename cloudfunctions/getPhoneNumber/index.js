// cloudfunctions/getPhoneNumber/index.js
// 使用 code 或 realtime(encryptedData/iv) 换取手机号

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { mode, code, encryptedData, iv } = event || {}

  // 1) Realtime phone number binding: encryptedData + iv
  if (mode === 'realtime') {
    if (!encryptedData || !iv) {
      return { ok: false, error: 'missing encryptedData/iv' }
    }

    // 注意：encryptedData/iv 解密需要 session_key。
    // 在云函数里推荐用 cloud.getOpenData（不同版本可能返回结构不同）。
    const res = await cloud.getOpenData({
      list: [encryptedData],
    })

    const item = res?.list?.[0]
    const phoneInfo = item?.data?.phoneNumber || item?.data?.purePhoneNumber || item?.data?.phone_info?.purePhoneNumber
    const phone = phoneInfo || item?.data?.purePhoneNumber || item?.data?.phoneNumber

    if (!phone) {
      return { ok: false, error: 'no phone in realtime open data', raw: item?.data }
    }

    return { ok: true, phone }
  }

  // 2) Standard getPhoneNumber: code
  if (!code) {
    return { ok: false, error: 'missing code' }
  }

  const res = await cloud.getOpenData({
    list: [code],
  })

  const item = res?.list?.[0]
  const phoneInfo = item?.data?.phoneNumber || item?.data?.purePhoneNumber || item?.data?.phone_info?.purePhoneNumber

  const phone = phoneInfo || item?.data?.purePhoneNumber || item?.data?.phoneNumber

  if (!phone) {
    return { ok: false, error: 'no phone in open data', raw: item?.data }
  }

  return { ok: true, phone }
}
