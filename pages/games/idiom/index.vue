<template>
	<view class="container">
		<!-- 头部区域 -->
		<view class="header">
			<view class="game-info">
				<view class="info-item">
					<text class="label">当前分数</text>
					<text class="value" :class="{'highlight': score > 0}">{{score}}</text>
				</view>
				<view class="info-item">
					<text class="label">最高分数</text>
					<text class="value">{{bestScores[currentLevel] || '--'}}</text>
				</view>
				<view class="info-item">
					<text class="label">剩余时间</text>
					<text class="value" :class="{'warning': timeLeft <= 10}">{{timeLeft}}</text>
				</view>
			</view>
			<view class="game-controls">
				<button class="control-btn difficulty"
					@click="showDifficultyPopup">
					<text>选择难度</text>
				</button>
				<button class="control-btn restart"
					:class="{'disabled': !gameStarted}"
					@click="handleRestart"
					:disabled="!gameStarted">
					<text>重新开始</text>
				</button>
			</view>
		</view>

		<!-- 游戏内容区域 -->
		<view class="game-content">
			<view class="idiom-game" :class="{'game-started': gameStarted}">
				<!-- 成语显示区域 -->
				<view class="idiom-area">
					<view class="idiom-container">
						<view v-for="(char, index) in currentIdiom"
							:key="index"
							class="char-box"
							:class="{
								'blank': isBlankPosition(index),
								'filled': isFilledPosition(index),
								'error': hasError && isBlankPosition(index)
							}"
							@click="handleCharClick(index)">
							<text v-if="!isBlankPosition(index)" class="char">{{char}}</text>
							<text v-else-if="userAnswers[index]" class="char input">{{userAnswers[index]}}</text>
							<text v-else class="placeholder">?</text>
							<text class="pinyin">{{showPinyin ? currentPinyin[index] : ''}}</text>
						</view>
					</view>
					<view class="explanation" v-if="showExplanation">
						<text>{{currentExplanation}}</text>
					</view>
				</view>

				<!-- 候选答案区域 -->
				<view class="options-area">
					<view class="options-grid">
						<button v-for="(option, index) in currentOptions"
							:key="index"
							class="option-btn"
							:class="{'used': isOptionUsed(option)}"
							:disabled="isOptionUsed(option)"
							@click="selectOption(option)">
							{{option}}
						</button>
					</view>
				</view>

				<!-- 功能按钮区域 -->
				<view class="function-area">
					<button v-if="isSkipped" class="func-btn skip" @click="skipCurrent">
						<text>跳过</text>
					</button>
				</view>
			</view>
		</view>

		<!-- 尾部区域 -->
		<view class="footer">
			<view class="game-tips">
				<view class="tip-item">
					<uni-icons type="info" size="16" color="#666"></uni-icons>
					<text>依次选择正确的汉字</text>
				</view>
				<view class="tip-item">
					<uni-icons type="star" size="16" color="#666"></uni-icons>
					<text>正确可以获得分数，跳过会扣除分数</text>
				</view>
			</view>
		</view>

		<!-- 难度选择弹窗 -->
		<uni-popup ref="difficultyPopup" type="center">
			<view class="popup-content animated pop">
				<view class="popup-title">选择难度</view>
				<view class="difficulty-list">
					<view
						v-for="level in difficulties"
						:key="level.id"
						class="difficulty-item"
						@click="selectDifficulty(level.id)"
					>
						<text class="difficulty-name">{{level.name}}</text>
						<text class="difficulty-desc">{{level.desc}}</text>
					</view>
				</view>
			</view>
		</uni-popup>

		<!-- 游戏结束弹窗 -->
		<uni-popup ref="gameOverPopup" type="center">
			<view class="popup-content animated pop">
				<view class="popup-title">游戏结束</view>
				<view class="popup-score">
					<text class="score-label">最终得分</text>
					<text class="score-value">{{score}}</text>
				</view>
				<view class="popup-stats">
					<view class="stat-item correct">
						<text class="stat-value">{{completedCount}}</text>
						<text class="stat-label">答对</text>
					</view>
					<view class="stat-item wrong">
						<text class="stat-value">{{wrongCount}}</text>
						<text class="stat-label">答错</text>
					</view>
					<view class="stat-item skipped">
						<text class="stat-value">{{skippedCount}}</text>
						<text class="stat-label">跳过</text>
					</view>
				</view>
				<view class="popup-best" v-if="isBestScore">新纪录！</view>
				<view class="popup-buttons">
					<button class="popup-btn difficulty" @click="showDifficultyPopup">
						<text>选择难度</text>
					</button>
					<button class="popup-btn restart" @click="restartGame">
						<text>再玩一次</text>
					</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
import { playSound } from '@/utils/sound'
import idiomData from '@/static/data/wordChainData.json'

export default {
	data() {
		return {
			// 游戏状态
			gameStarted: false,
			score: 0,
			currentLevel: 1,
			selectedBlankIndex: -1,
			hasError: false,
			timeLeft: 60, // 游戏时长（秒）
			timer: null,
			showExplanation: true, // 添加是否显示释义
			showPinyin: true, // 添加是否显示拼音

			// 统计数据
			completedCount: 0,
			skippedCount: 0,
			wrongCount: 0,  // 添加错误次数统计
			isBestScore: false,

			// 成语数据
			idiomList: [],
			currentIdiomData: null,
			currentIdiom: [],
			currentPinyin: [],
			currentExplanation: '',
			currentOptions: [],
			userAnswers: {},
			blankPositions: new Set(), // 添加空格位置存储
			isSkipped: false,

			// 游戏配置
			difficulties: [
				{
					id: 1,
					name: '简单',
					desc: '每个成语缺1个字',
					blanks: 1,
					wordBank: 'EASY_WORDS',
					time: 30,
					optionsCount: 4
				},
				{
					id: 2,
					name: '普通',
					desc: '每个成语缺1个字',
					blanks: 1,
					wordBank: 'MEDIUM_WORDS',
					time: 40,
					optionsCount: 8
				},
				{
					id: 3,
					name: '困难',
					desc: '每个成语缺2个字',
					blanks: 2,
					wordBank: 'HARD_WORDS',
					time: 50,
					optionsCount: 8
				},
				{
					id: 4,
					name: '专家',
					desc: '每个成语缺2个字',
					blanks: 2,
					wordBank: 'EXPERT_WORDS',
					time: 60,
					optionsCount: 12
				}
			],

			// 本地存储数据
			bestScores: {
				1: 0,
				2: 0,
				3: 0,
				4: 0
			},

			// 音效对象
			sounds: {
				click: null,
				success: null,
				fail: null,
				gameOver: null
			}
		}
	},

	computed: {
		// 删除 totalIdioms 计算属性
	},

	created() {
		// 初始化成语数据
		this.initIdiomData()

		// 从本地存储加载最高分
		try {
			const savedScores = uni.getStorageSync('idiomGameBestScores')
			if (savedScores) {
				this.bestScores = JSON.parse(savedScores)
			}
		} catch (e) {
			console.error('读取最高分失败:', e)
		}

		// 显示难度选择弹窗
		this.$nextTick(() => {
			this.showDifficultyPopup()
		})
	},

	methods: {
		// 初始化游戏
		initGame() {
			this.score = 0
			this.completedCount = 0
			this.skippedCount = 0
			this.wrongCount = 0  // 重置错误次数
			this.gameStarted = true
			this.isBestScore = false
			this.isSkipped = true
			this.timeLeft = this.difficulties[this.currentLevel - 1].time
			this.resetCurrentIdiom()
			this.loadNextIdiom()
			this.startTimer()
		},

		// 初始化成语数据
		initIdiomData() {
			try {
				// 将成语数据按难度分类
				const wordBanks = {
					EASY_WORDS: [],
					MEDIUM_WORDS: [],
					HARD_WORDS: [],
					EXPERT_WORDS: []
				}

				// 检查数据结构并处理
				if (idiomData && typeof idiomData === 'object') {
					// 如果数据已经按难度分类
					if (idiomData.EASY_WORDS) {
						Object.keys(wordBanks).forEach(difficulty => {
							if (Array.isArray(idiomData[difficulty])) {
								wordBanks[difficulty] = idiomData[difficulty].map(item => ({
									...item,
									chars: item.word.split('')
								}))
							}
						})
					} else {
						// 如果数据是单个数组，需要按难度分类
						Object.values(idiomData).forEach(item => {
							if (item.difficulty && wordBanks[item.difficulty]) {
								wordBanks[item.difficulty].push({
									...item,
									chars: item.word.split('')
								})
							}
						})
					}
				}

				this.idiomList = wordBanks
				console.log('成语数据加载成功')
				Object.entries(wordBanks).forEach(([difficulty, words]) => {
					console.log(`${difficulty}: ${words.length}条`)
				})
			} catch (e) {
				console.error('成语数据加载失败:', e)
				uni.showToast({
					title: '成语数据加载失败',
					icon: 'none'
				})
			}
		},

		// 加载下一个成语
		loadNextIdiom() {
			const currentDifficulty = this.difficulties[this.currentLevel - 1]
			const currentWordBank = this.idiomList[currentDifficulty.wordBank]

			if (!currentWordBank || !currentWordBank.length) {
				console.error('当前难度没有可用的成语')
				return
			}

			// 随机选择一个成语
			const randomIndex = Math.floor(Math.random() * currentWordBank.length)
			this.currentIdiomData = currentWordBank[randomIndex]

			// 设置当前成语数据
			this.currentIdiom = this.currentIdiomData.chars
			this.currentPinyin = this.currentIdiomData.pinyin.split(' ')
			this.currentExplanation = this.currentIdiomData.meaning

			// 根据难度生成空格位置
			const blankCount = currentDifficulty.blanks
			this.blankPositions.clear()
			while (this.blankPositions.size < blankCount) {
				this.blankPositions.add(Math.floor(Math.random() * 4))
			}

			// 生成候选答案
			const correctAnswers = Array.from(this.blankPositions).map(pos => this.currentIdiom[pos])
			const otherChars = this.getRandomChars(currentDifficulty.optionsCount - correctAnswers.length, currentDifficulty.wordBank)
			this.currentOptions = [...correctAnswers, ...otherChars]
				.sort(() => Math.random() - 0.5)

			// 重置答案状态
			this.resetCurrentIdiom()
		},

		// 重置当前成语状态
		resetCurrentIdiom() {
			this.userAnswers = {}
			this.hasError = false
		},

		// 处理字符点击
		handleCharClick(index) {
			if (this.isBlankPosition(index) && this.isFilledPosition(index)) {
				// 如果点击的是已填写的空格，则取消选择
				const option = this.userAnswers[index]
				this.$delete(this.userAnswers, index)
				playSound('click')
			}
		},

		// 选择答案选项
		selectOption(option) {
			if (this.isOptionUsed(option)) {
				// 如果已经选择了这个选项，则取消选择
				const index = Object.entries(this.userAnswers).find(([_, value]) => value === option)?.[0]
				if (index) {
					this.$delete(this.userAnswers, index)
				}
				playSound('click')
				return
			}

			// 找到第一个未填写的空格位置
			const blankPositions = Array.from(this.blankPositions).sort()
			const nextBlankIndex = blankPositions.find(pos => !this.userAnswers[pos])

			if (nextBlankIndex !== undefined) {
				// 填入答案
				this.$set(this.userAnswers, nextBlankIndex, option)
				playSound('click')

				// 检查是否需要验证答案
				if (Object.keys(this.userAnswers).length === this.difficulties[this.currentLevel - 1].blanks) {
					this.checkAnswer()
				}
			}
		},

		// 获取随机汉字
		getRandomChars(count, wordBank) {
			const chars = []
			const allChars = this.idiomList[wordBank].reduce((acc, item) => {
				acc.push(...item.word.split(''))
				return acc
			}, [])

			while (chars.length < count) {
				const randomChar = allChars[Math.floor(Math.random() * allChars.length)]
				if (!chars.includes(randomChar) &&
					!this.currentOptions?.includes(randomChar)) {
					chars.push(randomChar)
				}
			}
			return chars
		},

		// 检查是否为空格位置
		isBlankPosition(index) {
			return this.blankPositions.has(index)
		},

		// 检查是否已填写
		isFilledPosition(index) {
			return !!this.userAnswers[index]
		},

		// 检查选项是否已被使用
		isOptionUsed(option) {
			return Object.values(this.userAnswers).includes(option)
		},

		// 检查答案
		checkAnswer() {
			const isComplete = Object.keys(this.userAnswers).length ===
				this.difficulties[this.currentLevel - 1].blanks

			if (!isComplete) return

			const isCorrect = Object.entries(this.userAnswers).every(
				([index, char]) => char === this.currentIdiom[index]
			)

			if (isCorrect) {
				playSound('success')
				this.score += 10
				this.completedCount++
				setTimeout(() => {
					// 只要时间还没到，就继续加载下一个成语
					if (this.timeLeft > 0) {
						this.loadNextIdiom()
					}
				}, 500)
			} else {
				playSound('fail')
				this.hasError = true
				this.score = Math.max(0, this.score - 2)
				this.wrongCount++  // 增加错误次数
				setTimeout(() => {
					this.hasError = false
					this.userAnswers = {}
					this.selectedBlankIndex = -1
				}, 800)
			}
		},

		// 跳过当前成语
		skipCurrent() {
			this.skippedCount++
			this.score = Math.max(0, this.score - 5)
			// 只要时间还没到，就继续加载下一个成语
			if (this.timeLeft > 0) {
        playSound('click')
				this.loadNextIdiom()
			}
		},

		// 开始倒计时
		startTimer() {
			if (this.timer) {
				clearInterval(this.timer)
			}

			this.timer = setInterval(() => {
				if (this.timeLeft > 0) {
					this.timeLeft--
					if (this.timeLeft <= 0) {
						this.gameOver()
					}
				}
			}, 1000)
		},

		// 停止倒计时
		stopTimer() {
			if (this.timer) {
				clearInterval(this.timer)
				this.timer = null
			}
		},

		// 游戏结束
		gameOver() {
			this.gameStarted = false
			this.stopTimer()
			playSound('gameOver')

			// 检查是否创造新纪录
			if (this.score > (this.bestScores[this.currentLevel] || 0)) {
				this.isBestScore = true
				this.bestScores[this.currentLevel] = this.score
				// 保存最高分
				try {
					uni.setStorageSync('idiomGameBestScores', JSON.stringify(this.bestScores))
				} catch (e) {
					console.error('保存最高分失败:', e)
				}
			}

			// 清空题目以及选项
			this.currentIdiomData = null
			this.currentIdiom = []
			this.currentPinyin = []
			this.currentExplanation = ''
			this.currentOptions = []
			this.userAnswers = {}
			this.isSkipped = false

			// 显示游戏结束弹窗
			this.$refs.gameOverPopup.open()
		},

		// 显示难度选择
		showDifficultyPopup() {
			playSound('click')
			this.$refs.gameOverPopup.close()
			this.$refs.difficultyPopup.open()
		},

		// 选择难度
		selectDifficulty(level) {
			this.currentLevel = level
			playSound('click')
			this.$refs.difficultyPopup.close()
			this.initGame()
		},

		// 重新开始
		handleRestart() {
			if (this.gameStarted) {
				playSound('click')
				this.restartGame()
			}
		},

		// 重新开始游戏
		restartGame() {
			this.$refs.gameOverPopup.close()
			this.$refs.difficultyPopup.close()
			this.initGame()
		}
	},

	beforeDestroy() {
		this.$nextTick(() => {
			this.gameStarted = false
			this.stopTimer()
			this.$refs.gameOverPopup && this.$refs.gameOverPopup.close()
			this.$refs.difficultyPopup && this.$refs.difficultyPopup.close()
		})
	}
}
</script>

<style lang="scss">
@import '@/static/styles/global.scss';

.container {
	min-height: 100vh;
	height: 100vh;
	background: $gradient-warm;
	padding: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;

	// 头部区域
	.header {
		padding-top: constant(safe-area-inset-top);
		padding-top: env(safe-area-inset-top);
		padding: calc(var(--status-bar-height) + 0.2em) 1.5em 1em;
		padding-left: calc(var(--window-left) + 1.5em);
		padding-right: calc(var(--window-right) + 1.5em);
		@include glass-effect;
		background: linear-gradient(135deg, rgba(255, 182, 193, 0.3) 20%, rgba(255, 192, 203, 0.4) 80%);
		backdrop-filter: blur(10px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
		border-bottom: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 0 0 20px 20px;
		flex-shrink: 0;
		transition: all 0.3s $ease-bounce;
		height: auto;
		min-height: calc(var(--status-bar-height) + 4em);

		.game-info {
			display: flex;
			justify-content: space-around;
			margin-bottom: 0.5em;
			opacity: 1;
			transform: translateY(0);
			transition: all 0.3s $ease-bounce;

			.info-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 0.5em;
				background: rgba(255, 255, 255, 0.8);
				padding: 0.5em 1em;
				border-radius: 12px;
				border: 2px solid rgba(255, 255, 255, 0.4);

				.label {
					font-size: 0.875em;
					color: #666;
					font-weight: bold;
					transition: color 0.3s ease;
				}

				.value {
					font-size: 1.25em;
					font-weight: bold;
					color: #333;
					line-height: 1;
					font-size: 1.5em;

					&.highlight {
						animation: scoreUp 0.5s $ease-bounce;
						color: #FFD700;
					}

					&.warning {
						color: #FF4500;
						animation: timeWarning 0.8s ease-in-out infinite;
					}
				}
			}
		}

		.game-controls {
			display: flex;
			justify-content: center;
			gap: 1em;
			margin-top: 0.5em;

			.control-btn {
				background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
				color: #333;
				border: none;
				padding: 0.8em 1.5em;
				border-radius: 15px;
				font-size: 0.9em;
				font-weight: 600;
				letter-spacing: 0.05em;
				display: flex;
				justify-content: center;
				align-items: center;
				transition: all 0.3s $ease-bounce;
				position: relative;
				overflow: hidden;
				min-width: 7em;
				height: 3.2em;
				box-shadow: 0 4px 15px rgba(255, 182, 193, 0.4);
				border: 2px solid rgba(255, 255, 255, 0.4);
				backdrop-filter: blur(5px);

				&::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(
						90deg,
						transparent,
						rgba(255, 255, 255, 0.2),
						transparent
					);
					transition: 0.5s;
				}

				&:hover::before {
					left: 100%;
				}

				text {
					position: relative;
					z-index: 1;
					font-weight: 600;
					text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
				}

				&.restart {
					background: linear-gradient(135deg, #FF69B4, #FF1493);
					color: white;

					&:active:not(.disabled) {
						transform: translateY(2px) scale(0.98);
						box-shadow: 0 2px 8px rgba(255, 20, 147, 0.3);
					}

					&.disabled {
						background: linear-gradient(135deg, #f0f0f0, #e8e8e8);
						border: 2px solid rgba(0, 0, 0, 0.05);
						color: #999;
						box-shadow: none;
						cursor: not-allowed;

						&::before {
							display: none;
						}
					}

					&:hover:not(.disabled) {
						transform: translateY(-2px);
						box-shadow: 0 8px 20px rgba(255, 20, 147, 0.4);
					}
				}

				&.difficulty {
					background: linear-gradient(135deg, #4169E1, #1E90FF);
					color: white;

					&:hover:not(.disabled) {
						transform: translateY(-2px);
						box-shadow: 0 8px 20px rgba(30, 144, 255, 0.4);
					}

					&:active:not(.disabled) {
						transform: translateY(2px) scale(0.98);
						box-shadow: 0 2px 8px rgba(30, 144, 255, 0.3);
					}
				}
			}
		}
	}

	// 游戏内容区域
	.game-content {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		padding: 20rpx;
		min-height: 0;
		box-sizing: border-box;

		.idiom-game {
			width: 600rpx;
			min-height: 600rpx;
			max-height: 800rpx;
			height: calc(100% - 40rpx);
			margin: auto;
			background: rgba(255, 255, 255, 0.95);
			border-radius: 30rpx;
			box-shadow: 0 15rpx 35rpx rgba(0, 0, 0, 0.1);
			overflow: hidden;
			border: 3rpx solid rgba(255, 192, 203, 0.5);
			display: flex;
			flex-direction: column;

			.idiom-area {
				padding: 30rpx 30rpx 0;
				text-align: center;

				.idiom-container {
					display: flex;
					justify-content: center;
					gap: 20rpx;
					margin: 20rpx 0;

					.char-box {
						width: 100rpx;
						height: 120rpx;
						background: #fff;
						border-radius: 15rpx;
						border: 2rpx solid rgba(255, 192, 203, 0.5);
						display: flex;
						flex-direction: column;
						align-items: center;
						justify-content: center;
						position: relative;
						transition: all 0.3s ease;

						&.blank {
							background: rgba(255, 192, 203, 0.1);
							border: 2rpx dashed rgba(255, 192, 203, 0.5);
							cursor: pointer;

							&:hover {
								transform: translateY(-2rpx);
								box-shadow: 0 4rpx 12rpx rgba(255, 192, 203, 0.3);
							}
						}

						&.filled {
							background: rgba(255, 192, 203, 0.2);
							border: 2rpx solid rgba(255, 192, 203, 0.8);
						}

						&.error {
							animation: shake 0.5s ease-in-out;
							border-color: rgba(255, 0, 0, 0.5);
							background: rgba(255, 0, 0, 0.1);
						}

						.char {
							font-size: 48rpx;
							font-weight: bold;
							color: #333;
							line-height: 1;

							&.input {
								color: #FF69B4;
							}
						}

						.pinyin {
							font-size: 20rpx;
							color: #666;
							margin-top: 8rpx;
						}

						.placeholder {
							font-size: 36rpx;
							color: #ccc;
							animation: pulse 1.5s infinite;
						}
					}
				}

				.explanation {
					margin-top: 20rpx;
					padding: 0 20rpx;
					background: rgba(255, 255, 255, 0.8);
					border-radius: 15rpx;
					font-size: 26rpx;
					color: #666;
					line-height: 1.4;
				}
			}

			.options-area {
				flex: 1;
				padding: 20rpx;
				display: flex;
				flex-direction: column;
				min-height: 0;

				.options-grid {
					display: grid;
					grid-template-columns: repeat(4, 1fr);
					gap: 15rpx;
					padding: 15rpx;

					.option-btn {
						margin: 0;
						padding: 0;
						height: 80rpx;
						font-size: 36rpx;
						font-weight: bold;
						background: linear-gradient(135deg,
							rgba(255, 255, 255, 0.9),
							rgba(255, 240, 245, 0.9));
						border: none;
						border-radius: 15rpx;
						box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
						transition: all 0.3s ease;

						&:active {
							transform: translateY(2rpx) scale(0.98);
							box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.1);
						}

						&.used {
							opacity: 0.5;
							background: #f5f5f5;
							cursor: not-allowed;
						}
					}
				}
			}

			.function-area {
				padding: 20rpx;
				display: flex;
				gap: 20rpx;
				justify-content: center;

				.func-btn {
					flex: 1;
					max-width: 200rpx;
					height: 80rpx;
					font-size: 28rpx;
					border: none;
					border-radius: 40rpx;
					background: linear-gradient(135deg, #4169E1, #1E90FF);
					color: white;
					box-shadow: 0 4rpx 12rpx rgba(65, 105, 225, 0.3);

					&.skip {
						background: linear-gradient(135deg, #FFA500, #FF8C00);
					}
				}
			}
		}
	}

	// 尾部区域
	.footer {
		position: relative;
		padding: 0.5em 1.5em;
		padding-left: calc(var(--window-left) + 1.5em);
		padding-right: calc(var(--window-right) + 1.5em);
		padding-bottom: constant(safe-area-inset-bottom);
		padding-bottom: env(safe-area-inset-bottom);
		@include glass-effect;
		background: linear-gradient(135deg, rgba(255, 182, 193, 0.2) 20%, rgba(255, 192, 203, 0.3) 80%);
		backdrop-filter: blur(10px);
		box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.05);
		border-top: 3px solid rgba(255, 255, 255, 0.3);
		border-radius: 20px 20px 0 0;
		flex-shrink: 0;
		z-index: 1;
		transition: all 0.3s $ease-bounce;

		.game-tips {
			display: flex;
			flex-direction: column;
			max-width: 600rpx;
			margin: 0 auto;

			.tip-item {
				display: flex;
				align-items: center;
				gap: 0.5em;
				color: #666;
				background: rgba(255, 255, 255, 0.8);
				margin: 0.3em 0;
				padding: 0.8em 1em;
				border-radius: 12px;
				border: 2px solid rgba(255, 255, 255, 0.4);
				font-size: 0.875em;
				line-height: 1;
				transition: all 0.3s ease;

				.uni-icons {
					flex-shrink: 0;
					margin-top: 0.125em;
					color: #FFA500;
					font-size: 1.2em;
				}

				text {
					flex: 1;
					font-weight: bold;
				}

				&:hover {
					color: #333;
					transform: scale(1.02) translateX(0.25em);
					background: rgba(255, 255, 255, 0.9);

					.uni-icons {
						color: #FFA500;
						transform: rotate(10deg);
					}
				}
			}
		}
	}
}

@keyframes shake {
	0%, 100% { transform: translateX(0); }
	20%, 60% { transform: translateX(-5rpx); }
	40%, 80% { transform: translateX(5rpx); }
}

@keyframes pulse {
	0%, 100% { opacity: 0.5; }
	50% { opacity: 1; }
}

@keyframes scoreUp {
	0% { transform: scale(1); }
	50% { transform: scale(1.2); }
	100% { transform: scale(1); }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-0.5em); }
}

@keyframes starPop {
	0% { transform: scale(0) rotate(-180deg); }
	100% { transform: scale(1) rotate(0deg); }
}

@keyframes starPulse {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.1);
		opacity: 0.8;
	}
}

@keyframes starFloat {
	0%, 100% {
		transform: translateY(-50%) rotate(0deg);
	}
	50% {
		transform: translateY(-80%) rotate(15deg);
	}
}

.animated {
	animation-duration: $animation-normal;
	animation-fill-mode: both;
}

.bounce { animation: bounce 2s infinite; }
.fade-in { animation-name: fadeIn; }
.pop { animation-name: pop; }

.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }

@keyframes slideUpFade {
	from {
		opacity: 0;
		transform: translateY(10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.difficulty-list {
	display: flex;
	flex-direction: column;
	gap: 1em;
	margin: 1em 0;
	padding: 0.5em;
	width: 100%;

	.difficulty-item {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 240, 245, 0.9));
		padding: 0.8em 1.5em;
		border-radius: 16px;
		border: 3px solid rgba(255, 182, 193, 0.3);
		cursor: pointer;
		transition: all 0.3s $ease-bounce;
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 50%;
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent);
			pointer-events: none;
		}

		&:hover {
			transform: translateY(-3px) scale(1.02);
			box-shadow: 0 8px 20px rgba(255, 182, 193, 0.5);
			border-color: rgba(255, 182, 193, 0.8);
			background: linear-gradient(135deg, rgba(255, 240, 245, 0.95), rgba(255, 228, 225, 0.95));

			.difficulty-name {
				color: #FF1493;
			}

			.difficulty-desc {
				color: #FF69B4;
			}
		}

		&:active {
			transform: translateY(0) scale(0.98);
			box-shadow: 0 4px 10px rgba(255, 182, 193, 0.3);
		}

		.difficulty-name {
			font-size: 1.3em;
			font-weight: bold;
			color: #FF69B4;
			display: block;
			transition: all 0.3s ease;
			text-shadow: 1px 1px 2px rgba(255, 182, 193, 0.2);
		}

		.difficulty-desc {
			font-size: 1em;
			color: #FF8DA1;
			transition: all 0.3s ease;
			font-weight: 500;
		}

		// 为不同难度等级添加不同的左边框颜色
		&:nth-child(1) {
			border-left: 6px solid #98FB98;  // 浅绿色表示简单
		}
		&:nth-child(2) {
			border-left: 6px solid #87CEEB;  // 天蓝色表示中等
		}
		&:nth-child(3) {
			border-left: 6px solid #DDA0DD;  // 梅红色表示困难
		}
		&:nth-child(4) {
			border-left: 6px solid #FFD700;  // 金色表示专家
		}
	}
}

.popup-content {
	padding: 1.5em;
	border-radius: 1.5em;
	background: rgba(255, 255, 255, 0.95);
	box-shadow: 0 8px 32px rgba(255, 182, 193, 0.3);
	box-sizing: border-box;
	width: calc(100vw - 4em);
	max-width: 400px;
	max-height: 85vh;
	overflow-y: auto;
	border: 3px solid rgba(255, 192, 203, 0.5);
	margin: 0 2em;

	.popup-title {
		font-size: 2em;
		font-weight: bold;
		color: #FF69B4;
		text-align: center;
		margin-bottom: 1em;
		text-shadow: 2px 2px 4px rgba(255, 182, 193, 0.3);
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: -0.3em;
			left: 50%;
			transform: translateX(-50%);
			width: 60%;
			height: 4px;
			background: linear-gradient(90deg, transparent, #FFB6C1, transparent);
			border-radius: 2px;
		}
	}

	.popup-score {
		text-align: center;
		margin: 1em 0;
		padding: 1em;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 240, 245, 0.9));
		border-radius: 16px;
		border: 2px solid rgba(255, 182, 193, 0.3);
		box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
		animation: slideUpFade 0.5s ease-out forwards;

		.score-label {
			display: block;
			font-size: 1em;
			color: #FF69B4;
			margin-bottom: 0.5em;
		}

		.score-value {
			display: block;
			font-size: 2.5em;
			font-weight: bold;
			color: #FF1493;
			text-shadow: 2px 2px 4px rgba(255, 182, 193, 0.3);
		}
	}

	.popup-stats {
		display: flex;
		justify-content: space-between;
		gap: 1em;
		margin: 1.5em 0;

		.stat-item {
			flex: 1;
			text-align: center;
			padding: 1em;
			background: rgba(255, 255, 255, 0.9);
			border-radius: 12px;
			border: 2px solid rgba(255, 182, 193, 0.3);
			transition: all 0.3s ease;

			&:hover {
				transform: translateY(-4px);
				box-shadow: 0 6px 15px rgba(255, 182, 193, 0.3);
			}

			&.correct {
				background: linear-gradient(135deg, #98FB98, #90EE90);
				.stat-value { color: #228B22; }
			}

			&.wrong {
				background: linear-gradient(135deg, #FFB6C1, #FFA07A);
				.stat-value { color: #DC143C; }
			}

			&.skipped {
				background: linear-gradient(135deg, #87CEEB, #87CEFA);
				.stat-value { color: #4169E1; }
			}

			.stat-value {
				display: block;
				font-size: 1.8em;
				font-weight: bold;
				margin-bottom: 0.2em;
			}

			.stat-label {
				display: block;
				font-size: 0.9em;
				color: #666;
				font-weight: 500;
			}
		}
	}

	.popup-best {
		text-align: center;
		font-size: 1.4em;
		font-weight: bold;
		color: #FFD700;
		margin: 1em auto;
		text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
		animation: starPulse 1s ease-in-out infinite;
		position: relative;
		width: 7em;

		&::before,
		&::after {
			content: '⭐';
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			font-size: 0.8em;
			animation: starFloat 2s ease-in-out infinite;
		}

		&::before {
			left: -1.5em;
			animation-delay: -0.5s;
		}

		&::after {
			right: -1.5em;
			animation-delay: -1s;
		}
	}

	.popup-buttons {
		display: flex;
		justify-content: center;
		gap: 1em;
		margin-top: 1.5em;

		.popup-btn {
			flex: 1;
			max-width: 160px;
			height: 3em;
			border: none;
			border-radius: 1.5em;
			font-size: 1em;
			font-weight: bold;
			color: white;
			transition: all 0.3s ease;

			&.difficulty {
				background: linear-gradient(135deg, #4169E1, #1E90FF);
				box-shadow: 0 4px 12px rgba(30, 144, 255, 0.3);

				&:hover {
					transform: translateY(-2px);
					box-shadow: 0 6px 15px rgba(30, 144, 255, 0.4);
				}
			}

			&.restart {
				background: linear-gradient(135deg, #FF69B4, #FF1493);
				box-shadow: 0 4px 12px rgba(255, 20, 147, 0.3);

				&:hover {
					transform: translateY(-2px);
					box-shadow: 0 6px 15px rgba(255, 20, 147, 0.4);
				}
			}

			&:active {
				transform: translateY(1px);
			}
		}
	}
}

@keyframes popIn {
	0% {
		opacity: 0;
		transform: scale(0.8) translateY(20px);
	}
	100% {
		opacity: 1;
		transform: scale(1) translateY(0);
	}
}

.animal-icon {
	width: 75%;
	height: 75%;
	object-fit: contain;
	transform: scale(1);
	transition: all 0.3s $ease-bounce;
	filter: drop-shadow(2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2));
}

.card-face.back:hover .animal-icon {
	transform: scale(1.1) rotate(5deg);
}

.uni-popup {
	.uni-popup__wrapper {
		padding: 0 !important;
		width: 100vw !important;
		display: flex;
		justify-content: center;
		align-items: center;
	}
}

@keyframes timeWarning {
	0%, 100% {
		color: #FF4500;
		transform: scale(1);
		text-shadow: 0 0 8px rgba(255, 69, 0, 0.6);
	}
	50% {
		color: #FF0000;
		transform: scale(1.2);
		text-shadow: 0 0 12px rgba(255, 0, 0, 0.8);
	}
}
</style>
