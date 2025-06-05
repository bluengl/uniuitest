// 设备信息
const systemInfo = uni.getSystemInfoSync()

// 计算基准尺寸
const baseSize = {
	width: 375,
	height: 667
}

// 计算缩放比例
const scale = Math.min(
	systemInfo.windowWidth / baseSize.width,
	systemInfo.windowHeight / baseSize.height
)

// 游戏配置
const gameConfig = {
	// 设备信息
	device: {
		width: systemInfo.windowWidth,
		height: systemInfo.windowHeight,
		pixelRatio: systemInfo.pixelRatio,
		platform: systemInfo.platform
	},
	
	// 缩放
	scale: scale,
	
	// 动画时间
	animation: {
		fast: 200,
		normal: 300,
		slow: 500
	},
	
	// 游戏难度配置
	difficulty: {
		easy: {
			timeLimit: 60,
			scoreMultiplier: 1,
			mistakes: 3
		},
		medium: {
			timeLimit: 45,
			scoreMultiplier: 1.5,
			mistakes: 2
		},
		hard: {
			timeLimit: 30,
			scoreMultiplier: 2,
			mistakes: 1
		}
	},
	
	// 奖励配置
	rewards: {
		perfect: 100,
		great: 80,
		good: 50,
		normal: 30
	},
	
	// 计算自适应尺寸
	adaptive(size) {
		return Math.floor(size * scale)
	},
	
	// 获取响应式字体大小
	fontSize(size) {
		return Math.max(12, Math.floor(size * scale))
	},
	
	// 获取设备类型
	getDeviceType() {
		const width = systemInfo.windowWidth
		if (width < 375) return 'small'
		if (width < 768) return 'medium'
		return 'large'
	},
	
	// 检查是否支持特定功能
	supports(feature) {
		switch (feature) {
			case 'vibrate':
				return systemInfo.platform !== 'devtools'
			case 'audio':
				return true
			default:
				return false
		}
	}
}

export default gameConfig 