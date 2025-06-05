<template>
	<view class="container">
	  <!-- 头部区域 -->
	  <view class="header">
		<view class="game-info">
		  <!-- 这是游戏信息 -->
		</view>
		<view class="game-controls">
		  这是游戏控制按钮
		</view>
	  </view>
  
	  <!-- 游戏内容区域 -->
	  <view class="game-content">
		<!-- 这是游戏主体内容 -->
	  </view>
  
	  <!-- 尾部区域 -->
	  <view class="footer">
		<view class="game-tips">
		  <!-- 这是游戏说明 -->
		</view>
	  </view>
  
	  <!-- 游戏结束弹窗 -->
	  <uni-popup ref="gameOverPopup" type="center">
		<view class="popup-content animated pop">
		  <view class="popup-title">太棒了！</view>
		  <view class="stars">
			<view class="star" v-for="n in 3" :key="n"></view>
		  </view>
		  <view class="popup-moves">用了 {{moves}} 步完成</view>
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
			</view>
		  </view>
		</view>
	  </uni-popup>
	</view>
  </template>
  
  <script>
  
  import { playSound } from '@/utils/sound'
  import { getImagePath } from '@/utils/path'
  
  export default {
	data() {
	  return {
		cards: [],
		moves: 0,
		bestMoves: {
		  1: 0, // 初级最佳步数
		  2: 0, // 中级最佳步数
		  3: 0, // 高级最佳步数
		  4: 0  // 专家最佳步数
		},
		flippedCards: [],
		canFlip: true,
		gameStarted: false,
		isBestScore: false,
		currentLevel: 1,
		difficulties: [
		  {
			id: 1,
			name: '初级',
			desc: '4 x 4 网格 (8对卡牌)',
			size: 4,
			rows: 4,
			cols: 4,
			pairs: 8
		  },
		  {
			id: 2,
			name: '中级',
			desc: '4 x 5 网格 (10对卡牌)',
			size: 5,
			rows: 4,
			cols: 5,
			pairs: 10
		  },
		  {
			id: 3,
			name: '高级',
			desc: '4 x 6 网格 (12对卡牌)',
			size: 6,
			rows: 4,
			cols: 6,
			pairs: 12
		  },
		  {
			id: 4,
			name: '专家',
			desc: '6 x 6 网格 (18对卡牌)',
			size: 6,
			rows: 6,
			cols: 6,
			pairs: 18
		  }
		],
		animalIcons: [
		  { icon: getImagePath('games/memory/icons/a-birdanimal.png'), color: '#87CEEB' },
		  { icon: getImagePath('games/memory/icons/a-chickenanimal.png'), color: '#FFB6C1' },
		  { icon: getImagePath('games/memory/icons/a-cowanimal.png'), color: '#F4A460' },
		  { icon: getImagePath('games/memory/icons/a-deeranimal.png'), color: '#DEB887' },
		  { icon: getImagePath('games/memory/icons/a-doganimal.png'), color: '#CD853F' },
		  { icon: getImagePath('games/memory/icons/a-dolphinanimal.png'), color: '#00CED1' },
		  { icon: getImagePath('games/memory/icons/a-eaglehawkanimal.png'), color: '#8B4513' },
		  { icon: getImagePath('games/memory/icons/a-elephantanimal.png'), color: '#A9A9A9' },
		  { icon: getImagePath('games/memory/icons/a-fishanimal.png'), color: '#4682B4' },
		  { icon: getImagePath('games/memory/icons/a-fishanimal3.png'), color: '#20B2AA' },
		  { icon: getImagePath('games/memory/icons/a-horseanimal.png'), color: '#8B4513' },
		  { icon: getImagePath('games/memory/icons/a-monkeyanimal.png'), color: '#D2691E' },
		  { icon: getImagePath('games/memory/icons/a-octopusanimal.png'), color: '#FF1493' },
		  { icon: getImagePath('games/memory/icons/a-penguinanimal.png'), color: '#4682B4' },
		  { icon: getImagePath('games/memory/icons/a-piganimal.png'), color: '#FFB6C1' },
		  { icon: getImagePath('games/memory/icons/a-sharkanimal.png'), color: '#4169E1' },
		  { icon: getImagePath('games/memory/icons/a-sheepanimal.png'), color: '#F5DEB3' },
		  { icon: getImagePath('games/memory/icons/a-snakeanimal.png'), color: '#32CD32' },
		  { icon: getImagePath('games/memory/icons/a-tigeranimal.png'), color: '#FFA500' },
		  { icon: getImagePath('games/memory/icons/a-turtletortoiseanimal.png'), color: '#2E8B57' },
		  { icon: getImagePath('games/memory/icons/cow.png'), color: '#8B4513' },
		  { icon: getImagePath('games/memory/icons/crab.png'), color: '#FF4500' },
		  { icon: getImagePath('games/memory/icons/fish.png'), color: '#1E90FF' }
		],
		sounds: {}
	  }
	},
	created() {
	  // 从本地存储加载各难度的最佳步数
	  try {
		const savedBestMoves = uni.getStorageSync('memoryGameBestMoves');
		if (savedBestMoves) {
		  const parsed = JSON.parse(savedBestMoves);
		  // 确保所有难度级别都有初始值
		  this.bestMoves = {
			1: parsed[1] || 0,
			2: parsed[2] || 0,
			3: parsed[3] || 0,
			4: parsed[4] || 0
		  };
		}
	  } catch (e) {
		console.error('读取最佳步数失败:', e);
		// 确保在出错时也能正确初始化
		this.bestMoves = {
		  1: 0,
		  2: 0,
		  3: 0,
		  4: 0
		};
	  }
	  this.initGame();
	  // 显示难度选择弹窗
	  this.$nextTick(() => {
		this.showDifficultyPopup();
	  });
	},
	methods: {
	  initGame() {
		// 重置游戏状态
		this.moves = 0;
		this.flippedCards = [];
		this.canFlip = true;
		this.isBestScore = false;
		this.gameStarted = false;
  
		// 根据难度级别设置图标
		const difficulty = this.difficulties.find(d => d.id === this.currentLevel)
		const pairCount = difficulty.pairs
  
		// 随机选择需要的图标对数
		const shuffledIcons = [...this.animalIcons].sort(() => Math.random() - 0.5)
		const selectedIcons = shuffledIcons.slice(0, pairCount)
		const cardPairs = [...selectedIcons, ...selectedIcons]
  
		// 随机打乱卡片
		for (let i = cardPairs.length - 1; i > 0; i--) {
		  const j = Math.floor(Math.random() * (i + 1));
		  [cardPairs[i], cardPairs[j]] = [cardPairs[j], cardPairs[i]];
		}
  
		// 创建卡片对象数组
		this.cards = cardPairs.map(({icon, color}) => ({
		  icon,
		  color,
		  isFlipped: false,
		  isMatched: false,
		  isWrong: false
		}));
	  },
	  handleRestart() {
		if (this.gameStarted) {
		  playSound('click');
		  this.restartGame();
		}
	  },
	  async flipCard(index) {
		if (!this.canFlip || this.cards[index].isFlipped || this.cards[index].isMatched) return;
  
		playSound('click');
		this.cards[index].isFlipped = true;
		this.flippedCards.push(index);
  
		if (this.flippedCards.length === 2) {
		  if (++this.moves >= 1) {
			this.gameStarted = true
		  }
		  this.canFlip = false
  
		  const [firstIndex, secondIndex] = this.flippedCards
		  const firstCard = this.cards[firstIndex]
		  const secondCard = this.cards[secondIndex]
  
		  if (firstCard.icon === secondCard.icon) {
			// 匹配成功
			playSound('success');
			firstCard.isMatched = true
			secondCard.isMatched = true
  
			// 检查游戏是否结束
			if (this.cards.every(card => card.isMatched)) {
			  // 检查是否为当前难度的最佳步数
			  const currentBest = this.bestMoves[this.currentLevel];
			  if (!currentBest || this.moves < currentBest) {
				this.bestMoves[this.currentLevel] = this.moves;
				this.isBestScore = true;
				try {
				  uni.setStorageSync('memoryGameBestMoves', JSON.stringify(this.bestMoves));
				} catch (e) {
				  console.error('保存最佳步数失败:', e);
				}
			  }
  
			  setTimeout(() => {
				playSound('gameOver');
				this.gameStarted = false
				this.$refs.gameOverPopup.open()
			  }, 500)
			}
		  } else {
			// 匹配失败
			playSound('fail');
			firstCard.isWrong = true
			secondCard.isWrong = true
  
			await new Promise(resolve => setTimeout(resolve, 1000))
			firstCard.isFlipped = false
			secondCard.isFlipped = false
			firstCard.isWrong = false
			secondCard.isWrong = false
		  }
  
		  this.flippedCards = []
		  this.canFlip = true
		}
	  },
	  restartGame() {
		this.gameStarted = false
		this.$refs.difficultyPopup.close()
		this.$refs.gameOverPopup.close()
		this.initGame()
	  },
	  showDifficultyPopup() {
		playSound('click');
		this.$refs.difficultyPopup.open()
	  },
	  selectDifficulty(level) {
		playSound('click');
		this.currentLevel = level
		this.$refs.difficultyPopup.close()
		this.$refs.gameOverPopup.close()
		this.initGame()
	  }
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
  
	  .card-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 20rpx;
		width: 650rpx;
		aspect-ratio: 1;
		opacity: 1;
		transform: scale(1);
		transition: all 0.3s $ease-bounce;
		margin: auto;
  
		@media screen and (max-width: 768px) {
		  gap: 15rpx;
		  width: 680rpx;
		}
  
		// 根据难度级别动态设置列数
		&[data-level="1"] {
		  grid-template-columns: repeat(4, 1fr);
		}
  
		&[data-level="2"] {
		  grid-template-columns: repeat(6, 1fr);
		}
  
		&[data-level="3"] {
		  grid-template-columns: repeat(8, 1fr);
		}
  
		&[data-level="4"] {
		  grid-template-columns: repeat(10, 1fr);
		}
  
		&.game-started {
		  .card {
			cursor: pointer;
		  }
		}
  
		.card {
		  position: relative;
		  width: 100%;
		  aspect-ratio: 1;
		  perspective: 1000rpx;
		  @include hover-scale;
  
		  &.shake {
			animation: shake 0.5s ease-in-out;
		  }
  
		  .card-inner {
			position: absolute;
			width: 100%;
			height: 100%;
			transform-style: preserve-3d;
			transition: transform $transition-normal $ease-bounce;
  
			&.flipped {
			  transform: rotateY(180deg);
			}
  
			.card-face {
			  position: absolute;
			  width: 100%;
			  height: 100%;
			  backface-visibility: hidden;
			  @include glass-effect;
			  border-radius: $border-radius-md;
			  box-shadow: $shadow-sm;
			  @include flex-center;
			  overflow: hidden;
  
			  &.front {
				background: linear-gradient(135deg, #fff, #f8f8f8);
				border: 2rpx solid rgba(255, 255, 255, 0.5);
  
				.uni-icons {
				  font-size: 60rpx;
				  opacity: 0.4;
				  transform: rotate(-5deg);
				  transition: all 0.3s ease;
				}
  
				&:hover .uni-icons {
				  opacity: 0.6;
				  transform: rotate(5deg) scale(1.1);
				}
			  }
  
			  &.back {
				transform: rotateY(180deg);
				border: 2rpx solid rgba(255, 255, 255, 0.8);
  
				.uni-icons {
				  font-size: 80rpx;
				  filter: drop-shadow(2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2));
				  transform: scale(1);
				  transition: all 0.3s $ease-bounce;
				}
  
				&:hover .uni-icons {
				  transform: scale(1.1) rotate(5deg);
				}
			  }
			}
		  }
  
		  &.matched .card-inner {
			animation: matched 0.5s $ease-bounce both;
  
			.card-face.back {
			  background: $gradient-cool;
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
	0% { transform: scale(1); }
	50% { transform: scale(1.05); }
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
	display: flex;
	flex-direction: column;
	gap: 1em;
	margin: 1em 0;
	padding: 0.5em;
  
	.difficulty-item {
	  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 240, 245, 0.9));
	  padding: 0.8em 3em;
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
	padding: 1.4em 2em;
	border-radius: 2em;
	background: rgba(255, 255, 255, 0.95);
	box-shadow: 0 8px 32px rgba(255, 182, 193, 0.3);
	max-width: 90vw;
	max-height: 85vh;
	overflow-y: auto;
	border: 3px solid rgba(255, 192, 203, 0.5);
  
	.popup-title {
	  font-size: 1.8em;
	  font-weight: bold;
	  color: #FF69B4;
	  text-align: center;
	  margin-bottom: 1.2em;
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
  </style>
  