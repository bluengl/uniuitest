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
					<text class="label">连击次数</text>
					<text class="value" :class="{'combo': combo > 0}">{{combo}}</text>
				</view>
				<view class="info-item">
					<text class="label">剩余时间</text>
					<text class="value" :class="{
						'time-warning': totalTimeLeft <= gameConfig.warningTime,
						'time-critical': totalTimeLeft <= gameConfig.criticalTime
					}">{{Math.ceil(totalTimeLeft)}}</text>
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
			<view class="math-game" :class="{'game-started': gameStarted}">
				<!-- 题目显示区域 -->
				<view class="question-area">
					<view class="timer-bar" :style="{ width: timeProgress + '%' }"></view>
					<view class="question-container">
						<text class="question-text">{{currentQuestion}}</text>
						<view class="input-display">{{userInput || '?'}}</view>
					</view>
				</view>

				<!-- 答题区域 -->
				<view class="answer-area">
					<!-- 数字键盘 -->
					<view class="number-pad">
						<view class="number-grid">
							<button v-for="num in numbers"
								:key="num"
								class="num-btn"
								@click="appendNumber(num)">
								{{num}}
							</button>
							<button class="num-btn func-btn" @click="clearInput">清除</button>
							<button class="num-btn" @click="appendNumber(0)">0</button>
							<button class="num-btn func-btn" @click="submitAnswer">确定</button>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 尾部区域 -->
		<view class="footer">
			<view class="game-tips">
				<view class="tip-item">
					<uni-icons type="info" size="16" color="#666"></uni-icons>
					<text>输入答案后点击确定，或按回车键提交</text>
				</view>
				<view class="tip-item">
					<uni-icons type="star" size="16" color="#666"></uni-icons>
					<text>快速答对题目可以获得额外分数</text>
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
				<view class="popup-score">得分: {{score}}</view>
				<view class="popup-stats">
					<text>答对: {{correctCount}} 题</text>
					<text>答错: {{wrongCount}} 题</text>
					<text>最大连击: {{maxCombo}} 次</text>
				</view>
				<view class="popup-best" v-if="isBestScore">新纪录！</view>
				<view class="popup-buttons">
					<button class="popup-btn" @click="showDifficultyPopup">
						<text>选择难度</text>
					</button>
					<button class="popup-btn" @click="restartGame">
						<text>再玩一次</text>
					</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script>
    import { playSound } from '@/utils/sound'

	export default {
		data() {
			return {
				score: 0,
				combo: 0,
				maxCombo: 0,
				correctCount: 0,
				wrongCount: 0,
				gameStarted: false,
				isBestScore: false,
				currentLevel: 1,
				timeProgress: 100,
				totalTimeLeft: 30, // 总时间30秒
				totalTimeProgress: 100,
				gameConfig: {
					totalTime: 30, // 可配置的总时间（秒）
					warningTime: 10, // 开始警告的时间（秒）
					criticalTime: 5 // 危险时间（秒）
				},
				currentQuestion: '',
				userInput: '',
				expectedAnswer: null,
				timer: null,
				totalTimer: null, // 总时间计时器
				numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
				bestScores: {
					1: 0,
					2: 0,
					3: 0,
					4: 0
				},
				sounds: {
					click: null,
					success: null,
					fail: null,
					gameOver: null,
					pop: null
				},
				difficulties: [
					{
						id: 1,
						name: '初级',
						desc: '10以内加减法 (15秒/题)',
						timeLimit: 15,
						operations: ['+', '-'],
						maxNumber: 10
					},
					{
						id: 2,
						name: '中级',
						desc: '20以内加减法，10以内乘法 (12秒/题)',
						timeLimit: 12,
						operations: ['+', '-', '*'],
						maxNumber: 20
					},
					{
						id: 3,
						name: '高级',
						desc: '50以内运算，含简单除法 (10秒/题)',
						timeLimit: 10,
						operations: ['+', '-', '*', '/'],
						maxNumber: 50
					},
					{
						id: 4,
						name: '专家',
						desc: '100以内综合运算 (8秒/题)',
						timeLimit: 8,
						operations: ['+', '-', '*', '/'],
						maxNumber: 100
					}
				]
			}
		},
		created() {
			// 从本地存储加载最高分
			try {
				const savedScores = uni.getStorageSync('mathGameBestScores');
				if (savedScores) {
					const parsed = JSON.parse(savedScores);
					this.bestScores = {
						1: parsed[1] || 0,
						2: parsed[2] || 0,
						3: parsed[3] || 0,
						4: parsed[4] || 0
					};
				}
			} catch (e) {
				console.error('读取最高分失败:', e);
			}

			// 显示难度选择弹窗
			this.$nextTick(() => {
				this.showDifficultyPopup();
			});
		},
		methods: {
			// 初始化游戏
			initGame() {
				if (this.timer) clearInterval(this.timer);
				if (this.totalTimer) clearInterval(this.totalTimer);
				this.score = 0;
				this.combo = 0;
				this.maxCombo = 0;
				this.correctCount = 0;
				this.wrongCount = 0;
				this.gameStarted = true;
				this.isBestScore = false;
				this.userInput = '';
				this.totalTimeLeft = this.gameConfig.totalTime; // 重置总时间为30秒
				this.totalTimeProgress = 100;
				this.startTotalTimer(); // 启动总倒计时
				this.generateQuestion();
			},

			// 生成新题目
			generateQuestion() {
				const difficulty = this.difficulties.find(d => d.id === this.currentLevel);
				const operation = difficulty.operations[Math.floor(Math.random() * difficulty.operations.length)];
				let num1, num2;

				switch (operation) {
					case '+':
						num1 = Math.floor(Math.random() * difficulty.maxNumber) + 1;
						num2 = Math.floor(Math.random() * (difficulty.maxNumber - num1)) + 1;
						this.expectedAnswer = num1 + num2;
						break;
					case '-':
						num1 = Math.floor(Math.random() * difficulty.maxNumber) + 1;
						num2 = Math.floor(Math.random() * num1) + 1;
						this.expectedAnswer = num1 - num2;
						break;
					case '*':
						const maxFactor = Math.min(10, Math.floor(Math.sqrt(difficulty.maxNumber)));
						num1 = Math.floor(Math.random() * maxFactor) + 1;
						num2 = Math.floor(Math.random() * maxFactor) + 1;
						this.expectedAnswer = num1 * num2;
						break;
					case '/':
						num2 = Math.floor(Math.random() * 9) + 1;
						this.expectedAnswer = Math.floor(Math.random() * 9) + 1;
						num1 = num2 * this.expectedAnswer;
						break;
				}

				this.currentQuestion = `${num1} ${operation} ${num2} =`;
				this.startTimer();
			},

			// 开始计时器
			startTimer() {
				if (this.timer) clearInterval(this.timer);
				const difficulty = this.difficulties.find(d => d.id === this.currentLevel);
				const timeLimit = difficulty.timeLimit * 1000; // 转换为毫秒
				const startTime = Date.now();

				this.timeProgress = 100;
				this.timer = setInterval(() => {
					const elapsed = Date.now() - startTime;
					this.timeProgress = Math.max(0, 100 - (elapsed / timeLimit) * 100);

					if (elapsed >= timeLimit) {
						this.handleTimeout();
					}
				}, 100);
			},

			// 开始总倒计时
			startTotalTimer() {
				if (this.totalTimer) clearInterval(this.totalTimer);
				const startTime = Date.now();
				const totalTime = this.gameConfig.totalTime * 1000; // 转换为毫秒

				this.totalTimer = setInterval(() => {
					const elapsed = Date.now() - startTime;
					const remaining = totalTime - elapsed;
					this.totalTimeLeft = remaining / 1000;
					this.totalTimeProgress = (remaining / totalTime) * 100;
					if (remaining <= 0) {
						this.handleTotalTimeout();
					}
				}, 100);
			},

			// 处理总时间结束
			handleTotalTimeout() {
				if (this.totalTimer) {
					clearInterval(this.totalTimer);
					this.totalTimer = null;
				}
				this.gameOver();
			},

			// 处理单题超时
			handleTimeout() {
				if (this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
				// 超时扣分而不是结束游戏
				this.wrongAnswer();
				this.generateQuestion(); // 直接生成新题目
			},

			// 添加数字
			appendNumber(num) {
				if (!this.gameStarted) return;
				if (this.userInput.length < 4) {
					this.userInput += num;
					playSound('click');
				} else {
					playSound('fail');
				}
			},

			// 清除输入
			clearInput() {
				// 如果游戏未开始
				if (!this.gameStarted) return;
				this.userInput = '';
				playSound('click');
			},

			// 提交答案
			submitAnswer() {
				// 如果游戏未开始
				if (!this.gameStarted) return;
				// 如果输入为空，播放失败音效	
				if (!this.userInput) {
					playSound('fail');
					return;
				}

				const userAnswer = parseInt(this.userInput);
				if (userAnswer === this.expectedAnswer) {
					this.correctAnswer();
				} else {
					this.wrongAnswer();
				}

				this.userInput = '';
				this.generateQuestion();
			},

			// 答对处理
			correctAnswer() {
				this.correctCount++;
				this.combo++;

				// 播放音效
				playSound('success');

				// 如果连击数增加，播放连击音效
				if (this.combo >= 3) {
					setTimeout(() => playSound('pop'), 200);
				}

				this.maxCombo = Math.max(this.maxCombo, this.combo);

				// 计算得分
				let points = 10;
				// 连击奖励
				if (this.combo >= 10) points += 20;
				else if (this.combo >= 5) points += 10;
				else if (this.combo >= 3) points += 5;

				// 时间奖励
				const timeBonus = Math.floor(this.timeProgress / 20);
				points += timeBonus;

				this.score += points;
			},

			// 答错处理
			wrongAnswer() {
				this.wrongCount++;
				this.combo = 0;
				this.score = Math.max(0, this.score - 5);
				playSound('fail');
			},

			// 重新开始
			handleRestart() {
				if (this.gameStarted) {
					playSound('click');
					this.restartGame();
				}
			},

			// 重新开始游戏
			restartGame() {
				if (this.timer) clearInterval(this.timer);
				if (this.totalTimer) clearInterval(this.totalTimer);
				this.$refs.gameOverPopup.close();
				this.$refs.difficultyPopup.close();
				this.initGame();
			},

			// 显示难度选择
			showDifficultyPopup() {
				playSound('click');
				this.$refs.gameOverPopup.close();
				this.$refs.difficultyPopup.open();
			},

			// 选择难度
			selectDifficulty(level) {
				this.currentLevel = level;
				playSound('click');
				this.$refs.difficultyPopup.close();
				this.initGame();
			},

			// 游戏结束
			gameOver() {
				this.gameStarted = false;
				if (this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
				if (this.totalTimer) {
					clearInterval(this.totalTimer);
					this.totalTimer = null;
				}
				playSound('gameOver');

				// 检查是否创造新纪录
				if (this.score > (this.bestScores[this.currentLevel] || 0)) {
					this.isBestScore = true;
					this.bestScores[this.currentLevel] = this.score;
					// 保存最高分
					try {
						uni.setStorageSync('mathGameBestScores', JSON.stringify(this.bestScores));
					} catch (e) {
						console.error('保存最高分失败:', e);
					}
				}

				// 显示游戏结束弹窗
				this.$refs.gameOverPopup.open();
			},
		},
		beforeDestroy() {
			console.log('beforeDestroy');
			this.$nextTick(() => {
				this.gameStarted = false;
				if (this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
				if (this.totalTimer) {
					clearInterval(this.totalTimer);
					this.totalTimer = null;
				}
				this.$refs.gameOverPopup && this.$refs.gameOverPopup.close && this.$refs.gameOverPopup.close();
				this.$refs.difficultyPopup && this.$refs.difficultyPopup.close && this.$refs.difficultyPopup.close();
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
		padding: calc(var(--status-bar-height) + 0.2em) 1.5em 0.8em;
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
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: 8rpx;
			margin-bottom: 0.4em;
			padding: 0 8rpx;

			.info-item {
				display: flex;
				flex-direction: column;
				align-items: center;
				gap: 2rpx;
				background: rgba(255, 255, 255, 0.8);
				padding: 4rpx 8rpx;
				border-radius: 10rpx;
				border: 2rpx solid rgba(255, 255, 255, 0.4);

				.label {
					font-size: 22rpx;
					color: #666;
					font-weight: bold;
					transition: color 0.3s ease;
				}

				.value {
					font-size: 30rpx;
					font-weight: bold;
					color: #333;
					line-height: 1.1;

					&.highlight {
						animation: scoreUp 0.5s $ease-bounce;
						color: #FFD700;
					}

					&.combo {
						color: #FF4500;
						text-shadow: 0 0 5rpx rgba(255, 69, 0, 0.3);
					}

					&.time-warning {
						color: #FF0000;
						animation: timeWarning 1s ease-in-out infinite;
						text-shadow: 0 0 5rpx rgba(255, 0, 0, 0.3);
					}

					&.time-critical {
						color: #FF0000;
						animation: timeCritical 0.5s ease-in-out infinite;
						text-shadow: 0 0 8rpx rgba(255, 0, 0, 0.6);
						font-weight: 900;
					}
				}
			}
		}

		.game-controls {
			display: flex;
			justify-content: center;
			gap: 0.8em;
			margin-top: 0.4em;

			.control-btn {
				background: linear-gradient(135deg, #FFB6C1, #FFC0CB);
				color: #333;
				border: none;
				padding: 0.4em 1em;
				border-radius: 12px;
				font-size: 0.85em;
				font-weight: 600;
				letter-spacing: 0.05em;
				display: flex;
				justify-content: center;
				align-items: center;
				transition: all 0.3s $ease-bounce;
				position: relative;
				overflow: hidden;
				min-width: 6em;
				height: 3.2em;
				box-shadow: 0 2px 8px rgba(255, 182, 193, 0.4);
				border: 1px solid rgba(255, 255, 255, 0.4);
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
						transform: translateY(1px) scale(0.98);
						box-shadow: 0 1px 4px rgba(255, 20, 147, 0.3);
					}

					&:hover:not(.disabled) {
						transform: translateY(-1px);
						box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4);
					}
				}

				&.difficulty {
					background: linear-gradient(135deg, #4169E1, #1E90FF);
					color: white;

					&:hover:not(.disabled) {
						transform: translateY(-1px);
						box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
					}

					&:active:not(.disabled) {
						transform: translateY(1px) scale(0.98);
						box-shadow: 0 1px 4px rgba(30, 144, 255, 0.3);
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
		height: calc(100vh - var(--window-top) - var(--window-bottom));

		.math-game {
			width: 540rpx;
			min-height: 600rpx;
			max-height: 760rpx;
			height: calc(100% - 40rpx);
			margin: auto;
			background: rgba(255, 255, 255, 0.95);
			border-radius: 30rpx;
			box-shadow: 0 15rpx 35rpx rgba(0, 0, 0, 0.1),
						0 3rpx 10rpx rgba(0, 0, 0, 0.05);
			overflow: hidden;
			border: 3rpx solid rgba(255, 192, 203, 0.5);
			animation: floatGame 3s ease-in-out infinite;
			position: relative;
			z-index: 1;
			display: flex;
			flex-direction: column;

			&::after {
				content: '';
				position: absolute;
				top: -2px;
				left: -2px;
				right: -2px;
				bottom: -2px;
				background: linear-gradient(45deg,
					rgba(255, 192, 203, 0.5),
					rgba(255, 182, 193, 0.2),
					rgba(255, 192, 203, 0.5));
				border-radius: 32px;
				z-index: -1;
				animation: borderGlow 3s linear infinite;
			}

			.question-area {
				position: relative;
				padding: 20rpx;
				text-align: center;
				border-bottom: 3rpx solid rgba(255, 192, 203, 0.3);
				background: linear-gradient(135deg,
					rgba(255, 182, 193, 0.1) 0%,
					rgba(255, 192, 203, 0.2) 100%);
				flex: 0 0 auto;

				.timer-bar {
					position: absolute;
					top: 0;
					left: 0;
					height: 8rpx;
					background: linear-gradient(to right,
						rgba(76, 175, 80, 0.8),
						rgba(139, 195, 74, 0.8));
					border-radius: 0 4rpx 4rpx 0;
					transition: width 0.1s linear;
					box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
				}

				.question-container {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 20rpx;
					margin: 20rpx auto;
					padding: 20rpx;
					background: rgba(255, 255, 255, 0.8);
					border-radius: 25rpx;
					border: 2rpx dashed rgba(255, 192, 203, 0.5);
					box-shadow: 0 4rpx 15rpx rgba(255, 192, 203, 0.15);
					width: 480rpx;
					min-height: 120rpx;
					flex-wrap: nowrap;
					white-space: nowrap;

					.question-text {
						font-size: 56rpx;
						font-weight: bold;
						color: #FF69B4;
						text-shadow: 2rpx 2rpx 4rpx rgba(255, 105, 180, 0.2);
						animation: bounceIn 0.5s ease-out;
						flex-shrink: 0;
						padding: 0 10rpx;
					}

					.input-display {
						min-width: 120rpx;
						text-align: center;
						font-size: 56rpx;
						font-weight: bold;
						color: #FF69B4;
						background: rgba(255, 255, 255, 0.9);
						border-radius: 15rpx;
						border: 3rpx solid rgba(255, 192, 203, 0.5);
						padding: 0 20rpx;
						animation: floatInput 2s ease-in-out infinite;
						flex-shrink: 0;

						&:empty::before {
							content: '?';
							color: #FFC0CB;
							animation: pulse 1.5s ease-in-out infinite;
						}
					}
				}
			}

			.answer-area {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: flex-end;
				min-height: 0;
				padding: 20rpx;
				background: linear-gradient(135deg,
					rgba(255, 255, 255, 0.9) 0%,
					rgba(255, 240, 245, 0.9) 100%);

				.number-pad {
					margin-top: 20rpx;
					padding: 20rpx;
					flex: 1;
					min-height: 0;
					display: flex;
					flex-direction: column;

					.number-grid {
						flex: 1;
						min-height: 0;
						display: grid;
						grid-template-columns: repeat(3, 1fr);
						gap: 15rpx;

						.num-btn {
							margin: 0;
							padding: 0;
							font-size: 40rpx;
							font-weight: bold;
							background: linear-gradient(135deg,
								rgba(255, 255, 255, 0.9),
								rgba(255, 240, 245, 0.9));
							border: none;
							border-radius: 20rpx;
							box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
							transition: all 0.3s ease;
							display: flex;
							align-items: center;
							justify-content: center;
							height: 100%;

							&:active {
								transform: translateY(2rpx) scale(0.98);
								box-shadow: 0 2rpx 5rpx rgba(0, 0, 0, 0.1);
							}

							&:hover {
								transform: translateY(-2rpx);
								box-shadow: 0 6rpx 15rpx rgba(0, 0, 0, 0.15);
								background: linear-gradient(135deg,
									rgba(255, 182, 193, 0.2),
									rgba(255, 192, 203, 0.3));
							}

							&.func-btn {
								background: linear-gradient(135deg,
									#FF69B4,
									#FF1493);
								color: white;
								font-weight: bold;
								text-shadow: 1rpx 1rpx 2rpx rgba(0, 0, 0, 0.2);

								&:hover {
									background: linear-gradient(135deg,
										#FF1493,
										#FF69B4);
								}
							}
						}
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

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-0.5em); }
}

@keyframes scoreUp {
	0% { transform: scale(1); }
	50% { transform: scale(1.2); }
	100% { transform: scale(1); }
}

@keyframes shake {
	0%, 100% { transform: translateX(0); }
	20%, 60% { transform: translateX(-0.5em); }
	40%, 80% { transform: translateX(0.5em); }
}

@keyframes patternMove {
	0% { transform: translate(0, 0) rotate(0deg); }
	100% { transform: translate(-1em, -1em) rotate(360deg); }
}

@keyframes sparkle {
	0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
	50% { transform: scale(1) rotate(180deg); opacity: 1; }
}

@keyframes starPop {
	0% { transform: scale(0) rotate(-180deg); }
	100% { transform: scale(1) rotate(0deg); }
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
		opacity: 0.5;
	}
	50% {
		transform: scale(1.2);
		opacity: 1;
	}
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-0.5em); }
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

@keyframes buttonPulse {
	0% {
		box-shadow: 0 4px 8px rgba(255, 182, 193, 0.3);
		transform: scale(1);
	}
	50% {
		box-shadow: 0 6px 12px rgba(255, 182, 193, 0.5);
		transform: scale(1.02);
	}
	100% {
		box-shadow: 0 4px 8px rgba(255, 182, 193, 0.3);
		transform: scale(1);
	}
}

.difficulty-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 30rpx;
	margin: 1em 0;
	padding: 0.5em;
	width: 600rpx;

	.difficulty-item {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 240, 245, 0.9));
		padding: 40rpx 30rpx;
		border-radius: 25rpx;
		border: 4rpx solid rgba(255, 182, 193, 0.3);
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		aspect-ratio: 1;
		box-shadow: 0 10rpx 20rpx rgba(0, 0, 0, 0.1);

		&::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.5), transparent 70%);
			opacity: 0;
			transition: opacity 0.3s ease;
		}

		&::after {
			content: '';
			position: absolute;
			top: -2rpx;
			left: -2rpx;
			right: -2rpx;
			bottom: -2rpx;
			border-radius: 25rpx;
			background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.8), transparent);
			opacity: 0;
			transition: opacity 0.3s ease;
			z-index: -1;
		}

		&:hover {
			transform: translateY(-8rpx) scale(1.03);
			box-shadow: 0 15rpx 30rpx rgba(0, 0, 0, 0.15);
			border-color: rgba(255, 182, 193, 0.8);
			z-index: 1;

			&::before {
				opacity: 1;
			}

			&::after {
				opacity: 1;
				animation: borderRotate 2s linear infinite;
			}

			.difficulty-name {
				transform: translateY(-5rpx) scale(1.1);
				letter-spacing: 2rpx;
			}

			.difficulty-desc {
				transform: translateY(5rpx);
				opacity: 0.9;
			}
		}

		&:active {
			transform: translateY(2rpx) scale(0.98);
			box-shadow: 0 5rpx 10rpx rgba(0, 0, 0, 0.1);
			transition: all 0.1s ease;
		}

		.difficulty-name {
			font-size: 40rpx;
			font-weight: bold;
			margin-bottom: 15rpx;
			transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
			text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.1);
			position: relative;

			&::after {
				content: '';
				position: absolute;
				bottom: -6rpx;
				left: 50%;
				transform: translateX(-50%) scaleX(0);
				width: 100%;
				height: 3rpx;
				background: currentColor;
				transition: transform 0.3s ease;
			}
		}

		.difficulty-desc {
			font-size: 24rpx;
			text-align: center;
			transition: all 0.3s ease;
			line-height: 1.4;
			opacity: 0.8;
			padding: 0 10rpx;
		}

		// 为不同难度等级添加不同的样式
		&:nth-child(1) {
			background: linear-gradient(135deg, rgba(152, 251, 152, 0.3), rgba(152, 251, 152, 0.1));
			border-color: rgba(60, 179, 113, 0.3);
			.difficulty-name {
				color: #2E8B57;
				&::after { background: #2E8B57; }
			}
			.difficulty-desc { color: #3CB371; }
			&:hover {
				background: linear-gradient(135deg, rgba(152, 251, 152, 0.4), rgba(152, 251, 152, 0.2));
				border-color: rgba(60, 179, 113, 0.8);
				box-shadow: 0 15rpx 30rpx rgba(60, 179, 113, 0.2);
			}
		}
		&:nth-child(2) {
			background: linear-gradient(135deg, rgba(135, 206, 235, 0.3), rgba(135, 206, 235, 0.1));
			border-color: rgba(65, 105, 225, 0.3);
			.difficulty-name {
				color: #4169E1;
				&::after { background: #4169E1; }
			}
			.difficulty-desc { color: #1E90FF; }
			&:hover {
				background: linear-gradient(135deg, rgba(135, 206, 235, 0.4), rgba(135, 206, 235, 0.2));
				border-color: rgba(65, 105, 225, 0.8);
				box-shadow: 0 15rpx 30rpx rgba(65, 105, 225, 0.2);
			}
		}
		&:nth-child(3) {
			background: linear-gradient(135deg, rgba(221, 160, 221, 0.3), rgba(221, 160, 221, 0.1));
			border-color: rgba(147, 112, 219, 0.3);
			.difficulty-name {
				color: #9370DB;
				&::after { background: #9370DB; }
			}
			.difficulty-desc { color: #8B008B; }
			&:hover {
				background: linear-gradient(135deg, rgba(221, 160, 221, 0.4), rgba(221, 160, 221, 0.2));
				border-color: rgba(147, 112, 219, 0.8);
				box-shadow: 0 15rpx 30rpx rgba(147, 112, 219, 0.2);
			}
		}
		&:nth-child(4) {
			background: linear-gradient(135deg, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.1));
			border-color: rgba(218, 165, 32, 0.3);
			.difficulty-name {
				color: #DAA520;
				&::after { background: #DAA520; }
			}
			.difficulty-desc { color: #B8860B; }
			&:hover {
				background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.2));
				border-color: rgba(218, 165, 32, 0.8);
				box-shadow: 0 15rpx 30rpx rgba(218, 165, 32, 0.2);
			}
		}
	}
}

@keyframes borderRotate {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.popup-content {
	padding: 40rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.95);
	box-shadow: 0 8px 32px rgba(255, 182, 193, 0.3);
	max-width: 90vw;
	max-height: 85vh;
	overflow-y: auto;
	border: 3rpx solid rgba(255, 192, 203, 0.5);

	.popup-title {
		font-size: 48rpx;
		font-weight: bold;
		color: #FF69B4;
		text-align: center;
		margin-bottom: 30rpx;
		text-shadow: 2rpx 2rpx 4rpx rgba(255, 182, 193, 0.3);
		position: relative;

		&::after {
			content: '';
			position: absolute;
			bottom: -10rpx;
			left: 50%;
			transform: translateX(-50%);
			width: 60%;
			height: 4rpx;
			background: linear-gradient(90deg, transparent, #FFB6C1, transparent);
			border-radius: 2rpx;
		}
	}

	.popup-score,
	.popup-moves {
		text-align: center;
		font-size: 1.2em;
		margin: 0.5em 0;
		padding: 0.8em;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 240, 245, 0.9));
		border-radius: 12px;
		border: 2px solid rgba(255, 182, 193, 0.3);
		color: #FF69B4;
		font-weight: bold;
		box-shadow: 0 2px 8px rgba(255, 182, 193, 0.2);
		animation: slideUpFade 0.5s ease-out forwards;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(255, 182, 193, 0.3);
		}
	}

	.popup-score {
		animation-delay: 0.2s;
		background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 223, 0, 0.2));
		border-color: rgba(255, 215, 0, 0.3);
		color: #FF8C00;
	}

	.popup-best {
		text-align: center;
		font-size: 1.4em;
		font-weight: bold;
		color: #FFD700;
		margin: 1em auto;
		width: 8em;
		text-shadow: 0 2px 4px rgba(255, 215, 0, 0.3);
		animation: starPulse 1s ease-in-out infinite;
		position: relative;

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

.popup-buttons {
	display: flex;
	gap: 1.2em;
	margin-top: 2em;
	padding: 0 1em;

	.popup-btn {
		flex: 1;
		background: linear-gradient(135deg, #4169E1, #1E90FF);
		color: white;
		border: none;
		padding: 1em;
		border-radius: 15px;
		font-size: 1em;
		font-weight: 600;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: all 0.3s $ease-bounce;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4px 15px rgba(65, 105, 225, 0.3);
		border: 2px solid rgba(255, 255, 255, 0.3);
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

		&:hover {
			transform: translateY(-3px);
			box-shadow: 0 8px 25px rgba(65, 105, 225, 0.4);
		}

		&:active {
			transform: translateY(0);
			box-shadow: 0 4px 15px rgba(65, 105, 225, 0.3);
		}

		text {
			position: relative;
			z-index: 1;
			font-weight: 600;
			text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
			font-size: 1em;
			letter-spacing: 0.05em;
		}

		&:first-child {
			background: linear-gradient(135deg, #FF69B4, #FF1493);
			box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);

			&:hover {
				box-shadow: 0 8px 25px rgba(255, 20, 147, 0.4);
			}
		}
	}
}

// 添加弹窗动画
.uni-popup {
	.popup-content {
		animation: popIn 0.4s $ease-bounce forwards;
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

@keyframes floatGame {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10px);
	}
}

@keyframes floatInput {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-5px);
	}
}

@keyframes glow {
	0%, 100% {
		box-shadow: 0 0 10px rgba(139, 195, 74, 0.5);
	}
	50% {
		box-shadow: 0 0 20px rgba(139, 195, 74, 0.8);
	}
}

@keyframes bounceIn {
	0% {
		opacity: 0;
		transform: scale(0.3);
	}
	50% {
		opacity: 0.9;
		transform: scale(1.1);
	}
	80% {
		opacity: 1;
		transform: scale(0.89);
	}
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes tada {
	0% {
		transform: scale(1);
	}
	10%, 20% {
		transform: scale(0.9) rotate(-3deg);
	}
	30%, 50%, 70%, 90% {
		transform: scale(1.1) rotate(3deg);
	}
	40%, 60%, 80% {
		transform: scale(1.1) rotate(-3deg);
	}
	100% {
		transform: scale(1) rotate(0);
	}
}

@keyframes buttonPop {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes shimmer {
	0% {
		background-position: -200% 0;
	}
	100% {
		background-position: 200% 0;
	}
}

@keyframes borderGlow {
	0%, 100% {
		opacity: 0.5;
	}
	50% {
		opacity: 1;
	}
}

@keyframes twinkle {
	0%, 100% {
		opacity: 0.3;
		transform: scale(1);
	}
	50% {
		opacity: 0.8;
		transform: scale(1.2);
	}
}

@keyframes timeWarning {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
		text-shadow: 0 0 5rpx rgba(255, 0, 0, 0.3);
	}
	50% {
		transform: scale(1.2);
		opacity: 0.8;
		text-shadow: 0 0 10rpx rgba(255, 0, 0, 0.6);
	}
}

@keyframes timeCritical {
	0%, 100% {
		transform: scale(1.1);
		opacity: 1;
		text-shadow: 0 0 8rpx rgba(255, 0, 0, 0.6);
	}
	50% {
		transform: scale(1.3);
		opacity: 0.9;
		text-shadow: 0 0 15rpx rgba(255, 0, 0, 0.8);
	}
}
</style>
