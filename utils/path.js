import { STATIC_PATH } from '@/config'

/**
 * 获取静态资源的完整路径
 * @param {string} path - 相对于static目录的路径
 * @returns {string} 完整的资源路径
 */
export const getStaticPath = (path) => {
    // 确保路径以/开头
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${STATIC_PATH}${normalizedPath}`
}

/**
 * 获取图片资源的完整路径
 * @param {string} path - 相对于static/images目录的路径
 * @returns {string} 完整的图片路径
 */
export const getImagePath = (path) => {
    return getStaticPath(`images/${path}`)
}

/**
 * 获取音频资源的完整路径
 * @param {string} path - 相对于static/sounds目录的路径
 * @returns {string} 完整的音频路径
 */
export const getSoundPath = (path) => {
    return getStaticPath(`sounds/${path}`)
}

/**
 * 获取数据文件的完整路径
 * @param {string} path - 相对于static/data目录的路径
 * @returns {string} 完整的数据文件路径
 */
export const getDataPath = (path) => {
    return getStaticPath(`data/${path}`)
} 