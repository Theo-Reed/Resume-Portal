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

- `cloudfunctions/getPhoneNumber/`
  - `index.js`：使用前端 getPhoneNumber 返回的 code 换取手机号
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
```

## 注意

- 小程序端需要在 `app.ts` 里 `wx.cloud.init({ env })`。
- 云函数目录需要位于项目根的 `cloudfunctions/` 下，DevTools 才能识别。
- 建议时间字段使用 `db.serverDate()`，避免客户端时间不准。
