# 云函数（cloudfunctions）

本项目使用微信云开发云函数。

## 目录结构

每个云函数是 `cloudfunctions/<name>/` 目录：

- `cloudfunctions/initUser/`
  - `index.js`：首次进入小程序时初始化一条 users 记录
  - `package.json`

- `cloudfunctions/updateUserProfile/`
  - `index.js`：更新 users 里的 avatar/nickname/phone/isAuthed 等字段
  - `package.json`

- `cloudfunctions/updateUserLanguage/`
  - `index.js`：更新 users 里的 language 字段（Chinese/English）
  - `package.json`

- `cloudfunctions/getPhoneNumber/`
  - `index.js`：使用前端 getPhoneNumber 返回的 code 换取手机号
  - `package.json`

## 会员系统相关云函数

- `cloudfunctions/initMemberSchemes/`
  - `index.js`：初始化会员方案配置（首次部署时调用一次）
  - `package.json`

- `cloudfunctions/getMemberSchemes/`
  - `index.js`：获取所有会员方案列表
  - `package.json`

- `cloudfunctions/createOrder/`
  - `index.js`：创建订单
  - `package.json`

- `cloudfunctions/updateOrderStatus/`
  - `index.js`：更新订单状态（支付成功后调用）
  - `package.json`

- `cloudfunctions/activateMembership/`
  - `index.js`：激活会员（支付成功后调用）
  - `package.json`

- `cloudfunctions/checkMemberStatus/`
  - `index.js`：检查用户会员状态和配额
  - `package.json`

- `cloudfunctions/useQuota/`
  - `index.js`：使用配额（AI简历或邮件）
  - `package.json`

## 新增云函数步骤（WeChat DevTools）

1. 在项目根目录创建 `cloudfunctions/<函数名>/`，包含 `index.js` 和 `package.json`。
2. 打开微信开发者工具 -> **云开发** -> **云函数**。
3. 右键对应函数目录 -> **上传并部署：云端安装依赖**。

## 调用示例

```js
// 首次进入初始化用户
wx.cloud.callFunction({ name: 'initUser', data: {} })

// 手机号授权（需要 button open-type=getPhoneNumber）
wx.cloud.callFunction({
  name: 'getPhoneNumber',
  data: { code }
})

// 写入 users（产品级登录：isAuthed = 手机号授权完成）
wx.cloud.callFunction({
  name: 'updateUserProfile',
  data: {
    phone: '13800000000',
    isAuthed: true,
  }
})

// 更新语言偏好（i18n）
wx.cloud.callFunction({
  name: 'updateUserLanguage',
  data: { language: 'English' } // or 'Chinese'
})

// 会员系统相关调用示例
// 1. 初始化会员方案（仅首次部署时调用一次）
wx.cloud.callFunction({ name: 'initMemberSchemes', data: {} })

// 2. 获取会员方案列表
wx.cloud.callFunction({ name: 'getMemberSchemes', data: {} })

// 3. 创建订单
wx.cloud.callFunction({
  name: 'createOrder',
  data: { scheme_id: 1 } // 1:3天会员, 2:普通月卡, 3:高级月卡
})

// 4. 支付成功后，更新订单状态
wx.cloud.callFunction({
  name: 'updateOrderStatus',
  data: {
    order_id: 'ORDER1234567890',
    status: '已支付'
  }
})

// 5. 激活会员（支付成功后调用）
wx.cloud.callFunction({
  name: 'activateMembership',
  data: { order_id: 'ORDER1234567890' }
})

// 6. 检查会员状态
wx.cloud.callFunction({ name: 'checkMemberStatus', data: {} })

// 7. 使用配额（AI简历）
wx.cloud.callFunction({
  name: 'useQuota',
  data: { quota_type: 'ai_resume', amount: 1 }
})

// 8. 使用配额（邮件）
wx.cloud.callFunction({
  name: 'useQuota',
  data: { quota_type: 'email', amount: 1 }
})
```

## 数据库集合

### users 集合
新增字段：
- `member_level`: Integer - 0:普通用户, 1:3天会员, 2:普通月卡, 3:高级月卡
- `member_expire_at`: DateTime - 会员到期时间
- `ai_resume_quota`: Integer - 剩余 AI 简历生成次数
- `email_quota`: Integer - 剩余邮件发送次数

### orders 集合
- `order_id`: String - 唯一订单号
- `user_id`: String - 用户 openid
- `scheme_id`: Integer - 会员方案ID
- `amount`: Number - 实际支付金额
- `status`: String - 待支付、已支付、已退款、已关闭
- `pay_time`: DateTime - 支付成功时间
- `createdAt`: DateTime - 创建时间
- `updatedAt`: DateTime - 更新时间

### member_schemes 集合
- `scheme_id`: Integer - 方案ID (1:3天会员, 2:普通月卡, 3:高级月卡)
- `name`: String - 方案名称
- `price`: Number - 价格
- `duration_days`: Integer - 有效时长（天）
- `ai_limit`: Integer - AI 简历生成次数
- `email_limit`: Integer - 邮件发送次数
- `createdAt`: DateTime - 创建时间
- `updatedAt`: DateTime - 更新时间

## 会员方案配置

- **3天会员** (scheme_id: 1): 9.9元，AI简历5次，邮件3次/月
- **月普通会员** (scheme_id: 2): 29.9元，AI简历20次，邮件30次/月
- **月高级会员** (scheme_id: 3): 89.9元，AI简历300次，邮件300次/月

## 注意

- 小程序端需要在 `app.ts` 里 `wx.cloud.init({ env })`。
- 云函数目录需要位于项目根的 `cloudfunctions/` 下，DevTools 才能识别。
- 建议时间字段使用 `db.serverDate()`，避免客户端时间不准。
- **首次部署时，需要先调用 `initMemberSchemes` 初始化会员方案数据**。
- 支付流程：创建订单 -> 调用微信支付 -> 支付成功后更新订单状态 -> 激活会员。
