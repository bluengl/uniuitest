// 判断变量是否为空
export const isEmpty = (value) => {
    // 根据类型使用不同的判断
  if (typeof value === 'string') {
    return !value || value.trim() === ''
  }
  if (typeof value === 'object') {
    return !value || Object.keys(value).length === 0
  }
  if (typeof value === 'array') {
    return !value || value.length === 0
  }
  return false
}


