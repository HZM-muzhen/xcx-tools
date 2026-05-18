const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { fileID } = event
  try {
    const res = await cloud.openapi.ocr.printedText({
      imgUrl: fileID,
    })
    if (res && res.items) {
      const text = res.items.map(item => item.text).join('\n')
      return { text, success: true }
    }
    return { text: '', success: false, msg: 'OCR returned no text' }
  } catch (err) {
    return { text: '', success: false, msg: err.message }
  }
}
