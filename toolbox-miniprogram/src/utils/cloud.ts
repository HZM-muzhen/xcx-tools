let _cloudReady = false

export function setCloudReady(ready: boolean) {
  _cloudReady = ready
}

export function isCloudReady(): boolean {
  return _cloudReady
}

export function checkCloudEnv(): boolean {
  try {
    const envId = uni.getStorageSync('cloudEnvId') || ''
    if (envId && (wx as any).cloud) {
      (wx as any).cloud.init({ env: envId, traceUser: true })
      _cloudReady = true
      return true
    }
  } catch (_) {
    // cloud not available
  }
  return false
}

export async function callCloudFunction(name: string, data: Record<string, any> = {}): Promise<any> {
  if (!_cloudReady) {
    throw new Error('云环境未初始化')
  }
  const res = await (wx as any).cloud.callFunction({ name, data })
  return res.result
}

export async function uploadFileToCloud(filePath: string, cloudPath: string): Promise<string> {
  if (!_cloudReady) {
    throw new Error('云环境未初始化')
  }
  const res = await (wx as any).cloud.uploadFile({ cloudPath, filePath })
  return res.fileID
}
