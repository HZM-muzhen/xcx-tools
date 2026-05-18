const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { filePath } = event
  try {
    // Download audio file from cloud storage
    const res = await cloud.downloadFile({ fileID: filePath })
    // Use cloud AI for speech recognition
    const result = await cloud.openapi.service.invoke({
      service: 'ai',
      action: 'speechRecognition',
      data: {
        voice_base64: res.fileContent.toString('base64'),
        format: 'mp3',
      },
    })
    if (result && result.Result) {
      return { text: result.Result, success: true }
    }
    return { text: '', success: false, msg: 'recognition returned no text' }
  } catch (err) {
    return { text: '', success: false, msg: err.message }
  }
}
