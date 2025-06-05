import { getSoundPath } from './path'

// 音效缓存对象
const soundCache = {}

// 是否禁用音效
const isSoundDisabled = false

// 音效文件列表
const soundFiles = {
  click: getSoundPath('click.mp3'),
  success: getSoundPath('success.mp3'),
  fail: getSoundPath('fail.mp3'),
  gameOver: getSoundPath('gameOver.mp3'),
  pop: getSoundPath('pop.mp3')
}

// 背景音乐实例
const bgm = uni.createInnerAudioContext()
bgm.src = getSoundPath('bgm.mp3')
bgm.loop = true

// 预加载所有音效
function preloadSounds() {
  Object.entries(soundFiles).forEach(([key, path]) => {
    if (soundCache[key]) return
    soundCache[key] = uni.createInnerAudioContext()
    soundCache[key].src = path
  })
}

// 播放音效的函数
async function playSound(name) {
  if (isSoundDisabled) return
  try {
    // 如果音效还没有加载，就先加载
    if (!soundCache[name] && soundFiles[name]) {
      soundCache[name] = uni.createInnerAudioContext()
      soundCache[name].src = soundFiles[name]
    }
    
    const sound = soundCache[name]
    if (sound) {
      // 确保之前的播放已经结束
      try {
        await sound.pause()
      } catch (e) {
        // 跳过暂停失败的错误
      }
      // 重置音频到开始位置
      sound.currentTime = 0
      // 开始新的播放
      return await sound.play()
    }
  } catch (error) {
    console.warn('播放音效失败:', error)
  }
}

// 暂停音效
function pauseSound(name) {
  if (isSoundDisabled) return
  soundCache[name].pause()
}

// 暂停所有音效
function pauseAllSounds() {
  Object.values(soundCache).forEach(sound => sound.pause())
}

// 播放背景音乐
async function playBGM() {
  return bgm.play()
}

// 暂停背景音乐
async function pauseBGM() {
  return bgm.pause()
}

// 设置背景音乐音量
function setBGMVolume(volume) {
  bgm.volume = volume
}

// 获取背景音乐音量
function getBGMVolume() {
  return bgm.volume
}

// 销毁所有音效
function destroyAllSounds() {
  Object.values(soundCache).forEach(sound => sound.destroy())
}

// 禁用音效
function disableSound() {
  pauseAllSounds()
  isSoundDisabled = true
}

// 启用音效
function enableSound() {
  isSoundDisabled = false
}

// 初始化时预加载所有音效
preloadSounds()

export {
  playSound,
  pauseSound,
  playBGM,
  pauseBGM,
  setBGMVolume,
  getBGMVolume,
  destroyAllSounds,
  disableSound,
  enableSound
}