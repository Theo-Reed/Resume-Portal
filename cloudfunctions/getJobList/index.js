// cloudfunctions/getJobList/index.js
// 查询职位列表并批量查询收藏状态

const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

// type -> collection 映射（与前端保持一致）
const typeCollectionMap = {
  国内: 'domestic_remote_jobs',
  国外: 'abroad_remote_jobs',
  web3: 'web3_remote_jobs',
}

exports.main = async (event, context) => {
  const { collectionName, pageSize = 15, skip = 0, collectionNames } = event || {}

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    let jobs = []

    // 如果传入了 collectionNames（数组），说明是查询多个集合（如精选tab）
    if (Array.isArray(collectionNames) && collectionNames.length > 0) {
      const allJobs = []
      
      for (const collName of collectionNames) {
        try {
          const res = await db
            .collection(collName)
            .orderBy('createdAt', 'desc')
            .skip(0) // 精选tab目前不支持分页，每次都是重新加载
            .limit(pageSize)
            .get()
          
          const mapped = (res.data || []).map(job => ({
            ...job,
            sourceCollection: collName,
          }))
          allJobs.push(...mapped)
        } catch (err) {
          console.error(`[getJobList] error for collection ${collName}:`, err)
        }
      }
      
      // 按 createdAt 降序排序
      allJobs.sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime()
        const bTime = new Date(b.createdAt || 0).getTime()
        return bTime - aTime
      })
      
      // 限制为 pageSize
      jobs = allJobs.slice(0, pageSize)
    } else if (collectionName) {
      // 查询单个集合
      const res = await db
        .collection(collectionName)
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get()
      
      jobs = res.data || []
    } else {
      return {
        ok: false,
        error: 'missing collectionName or collectionNames',
      }
    }

    // 如果有职位数据且用户已登录，批量查询收藏状态
    if (jobs.length > 0 && openid) {
      try {
        const jobIds = jobs.map(job => job._id).filter(Boolean)
        
        if (jobIds.length > 0) {
          // 批量查询收藏状态（使用 in 操作符，最多支持20个值）
          // 注意：微信云开发 in 操作符有限制，当前 pageSize=15，在限制内
          const collectedRes = await db
            .collection('collected_jobs')
            .where({
              openid,
              jobId: db.command.in(jobIds),
            })
            .get()
          
          const collectedSet = new Set((collectedRes.data || []).map(item => item.jobId))
          
          // 为每个职位添加 isSaved 字段
          jobs = jobs.map(job => ({
            ...job,
            isSaved: collectedSet.has(job._id),
          }))
        }
      } catch (err) {
        console.error('[getJobList] error querying collected_jobs:', err)
        // 如果查询收藏状态失败，所有职位默认 isSaved = false
        jobs = jobs.map(job => ({
          ...job,
          isSaved: false,
        }))
      }
    } else {
      // 未登录或没有职位数据，所有职位 isSaved = false
      jobs = jobs.map(job => ({
        ...job,
        isSaved: false,
      }))
    }

    return {
      ok: true,
      jobs,
    }
  } catch (err) {
    console.error('[getJobList] error:', err)
    return {
      ok: false,
      error: err.message || 'unknown error',
    }
  }
}

