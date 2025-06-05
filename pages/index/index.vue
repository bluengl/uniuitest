<template>
	<view class="container">
		
		<!-- 状态栏占位符 -->
		<view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
		
		<view class="menu-btn" :class="{ 'hidden': isDrawerOpen }" @click="openDrawer">
			<uni-icons type="bars" size="24" color="rgba(51, 51, 51, 0.75)"></uni-icons>
		</view>

		<view class="sound-btn" :class="{ 'hidden': isDrawerOpen }" @click="bgmEnabled ? pauseBGM() : playBGM()">
			<uni-icons :type="bgmEnabled ? 'sound-filled' : 'sound'" size="24" color="rgba(51, 51, 51, 0.75)"></uni-icons>
		</view>

		<!-- 抽屉菜单 -->
		<uni-drawer ref="drawer" mode="left" :mask-click="true" @close="closeDrawer" @change="onDrawerChange">
			<view class="drawer-content">
				<view class="drawer-header animated fade-in">
					<!-- 登录组件 -->
					<Login />
					<view class="drawer-title-wrap">
						<text class="drawer-title animated pop delay-1">游戏菜单</text>
						<text class="drawer-subtitle animated fade-in delay-2">选择你喜欢的游戏</text>
					</view>
				</view>
				<scroll-view class="drawer-list" scroll-y>
					<view
						v-for="(game, index) in games"
						:key="index"
						class="drawer-item animated slide-in-left"
						:style="{ animationDelay: `${index * 0.1}s` }"
						@click="navigateToGame(game)"
					>
						<text class="drawer-item-title">{{game.name}}</text>
						<view v-if="game.isNew" class="drawer-item-badge">
							<text class="star">⭐</text>
						</view>
					</view>
				</scroll-view>
			</view>
		</uni-drawer>

		<view class="content safe-area-inset">
			<view class="game-list">
				<view
					v-for="(game, index) in games"
					:key="index"
					class="game-card animated fade-in-up"
					:class="[
						`delay-${index}`,
						{ 'hover-scale': true }
					]"
				>
					<image class="game-image animated" :src="game.image" mode="aspectFill"></image>
					<view class="game-info animated fade-in" :style="{ animationDelay: `${index * 0.1 + 0.3}s` }">
						<view class="game-title-wrap">
							<text class="game-title">{{game.name}}</text>
							<view v-if="game.isNew" class="game-badge animated swing infinite">新</view>
						</view>
						<view class="divider"></view>
						<text class="game-desc">{{game.desc}}</text>
					</view>
					<view
						class="start-button animated fade-in"
						:style="{ animationDelay: `${index * 0.1 + 0.4}s` }"
						@touchstart="(e) => onTouchStart(index, e)"
						@touchend="(e) => onTouchEnd(index, e)"
						@click="navigateToGame(game)"
					>
						<text>开始游戏</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { playBGM, pauseBGM, playSound } from '@/utils/sound.js'
	import { getImagePath } from '@/utils/path'
	import { http } from '@/utils/index.js'
	import { API } from '@/config/index.js'
	import Login from '@/components/Login.vue'
	
	export default {
		components: {
			Login
		},
		data() {
			return {
				games: [{
					name: '记忆翻牌',
					desc: '考验记忆力的经典游戏，找出所有配对的卡片。',
					icon: 'refresh',
					path: '/pages/games/memory/index',
					isNew: true,
					image: getImagePath('games/memory.png'),
				}, {
					name: '趣味数学',
					desc: '简单有趣的数学计算游戏，提升计算能力。',
					icon: 'calculator',
					path: '/pages/games/math/index',
					image: getImagePath('games/math.png'),
				}, /*{
					name: '拼图游戏',
					desc: '移动方块还原完整图片，锻炼空间思维。',
					icon: 'puzzle-piece',
					path: '/pages/games/puzzle/index',
					isNew: true,
					image: getImagePath('games/puzzle.png'),
				}, {
					name: '连线游戏',
					desc: '连接相关的物品，考验反应和判断能力。',
					icon: 'connection',
					path: '/pages/games/connection/index',
					image: getImagePath('games/connection.png'),
				}, */{
					name: '成语填空',
					desc: '学习中国传统成语，提升语言文字能力。',
					icon: 'font',
					path: '/pages/games/idiom/index',
					image: getImagePath('games/idiom.png'),
				}/*, {
					name: '打地鼠',
					desc: '考验反应力和手眼协调能力的经典游戏。',
					icon: 'hand-down',
					path: '/pages/games/mole/index',
					isNew: true,
					image: getImagePath('games/mole.png'),
				}*/],
				bgmEnabled: false,
				pressedIndex: -1,
				isScrolling: false,
				scrollTimeout: null,
				touchStartTime: 0,
				touchStartY: 0,
				isDrawerOpen: false,
				statusBarHeight: 0
			}
		},
		methods: {
			// 初始化页面
			initPage () {
				const baseQuery = () => {
					this.queryGameList()
				}
				if (!uni.getStorageSync('systemConfig')) {
					this.getConfig().then(() => {
						baseQuery()
					})
				} else {
					baseQuery()
				}
			},
			// 获取后台配置信息
			getConfig () {
				return http.post(API.base.getSystemConfig).then(res => {
					uni.setStorageSync('systemConfig', res || {})
				})
			},
			// 查询游戏列表
			queryGameList () {
				http.post(API.game.gameList, {}, {
					showLoading: true,
				}).then(res => {
					this.games = []
					// 遍历res，将游戏信息添加到games中
					res.forEach(game => {
						this.games.push({
							id: game.gameId,
							name: game.gameName,
							desc: game.gameDescription,
							icon: game.gameIcon,
							isNew: game.isNew === '1',
							image: getImagePath(game.gameBg),
							path: `/pages/games/${game.gameCode}/index?gameId=${game.gameId}`,
						})
					})
				})
			},
			baseTestRequest () {
				http.post(API.base.getOpenId, {}, {
					showLoading: true,
				}).then(res => {
					console.log(res)
				})
			},
			groupTestRequest () {
				http.post(API.group.groupList, {}, {
					showLoading: true,
				}).then(res => {
					console.log(res)
				})
			},
			userTestRequest () {
				http.post(API.user.getCurrentAvatar, {}, {
					showLoading: true,
					loadingText: '加载中...'
				}).then(res => {
					console.log(res)
				})
			},
			handleScroll() {
				this.isScrolling = true
				if (this.scrollTimeout) {
					clearTimeout(this.scrollTimeout)
				}
				this.scrollTimeout = setTimeout(() => {
					this.isScrolling = false
				}, 150)
			},
			setupScrollListener() {
				// 使用 uni-app 的页面滚动事件
				uni.$on('page-scroll', this.handleScroll)
			},
			removeScrollListener() {
				uni.$off('page-scroll', this.handleScroll)
			},
			openDrawer() {
				playSound('click')
				this.$refs.drawer.open()
			},
			closeDrawer() {
				this.$refs.drawer.close()
			},
			async playBGM() {
				playBGM().then(() => {
					this.bgmEnabled = true
				}).catch(() => {
					this.bgmEnabled = false
				})
				playSound('click')
			},
			async pauseBGM() {
				pauseBGM().then(() => {
					this.bgmEnabled = false
				}).catch(() => {
					this.bgmEnabled = true
				})
				playSound('click')
			},
			navigateToGame(game) {
				try {
					playSound('click')
					uni.navigateTo({
						url: game.path,
						animationType: 'slide-in-right',
						success: () => {
							console.log('成功导航到游戏:', game.name)
							this.closeDrawer()
						},
						fail: (error) => {
							console.error('导航失败:', error)
							uni.showToast({
								title: '打开游戏失败',
								icon: 'none'
							})
						}
					})
				} catch (error) {
					console.error('导航出错:', error)
					uni.showToast({
						title: '打开游戏失败',
						icon: 'none'
					})
				}
			},
			onTouchStart(index, event) {
				this.touchStartTime = Date.now()
				this.touchStartY = event.touches[0].clientY
				this.pressedIndex = index
			},
			onTouchEnd(index, event) {
				const touchEndTime = Date.now()
				const touchDuration = touchEndTime - this.touchStartTime

				// 如果触摸时间小于200ms，且垂直移动距离小于10px，则认为是点击操作
				if (touchDuration < 200 && !this.isScrolling) {
					// playSound('click')
				}

				this.pressedIndex = -1
				this.touchStartTime = 0
				this.touchStartY = 0
			},
			onDrawerChange(e) {
				this.isDrawerOpen = e
			}
		},
		async onLoad(options) {
			try {
				// 获取系统信息
				let statusBarHeight = 0;

				// #ifdef MP-WEIXIN
				// 使用新的 API 获取窗口信息
				const windowInfo = wx.getWindowInfo();
				statusBarHeight = windowInfo.statusBarHeight;

				// 获取设备信息
				const deviceInfo = wx.getDeviceInfo();
				// 获取系统设置
				const systemSetting = wx.getSystemSetting();
				// 获取应用基础信息
				const appBaseInfo = wx.getAppBaseInfo();

				console.log('设备信息:', deviceInfo);
				console.log('系统设置:', systemSetting);
				console.log('应用信息:', appBaseInfo);
				// #endif

				// #ifndef MP-WEIXIN
				const systemInfo = uni.getSystemInfoSync();
				statusBarHeight = systemInfo.statusBarHeight;
				// #endif

				this.statusBarHeight = statusBarHeight;
				this.initPage()

				// 设置滚动监听
				this.$nextTick(() => {
					this.setupScrollListener();
				});
				if (options.openDrawer) {
					this.$nextTick(() => {
						this.$refs.drawer.open()
					})
				} else {
					this.isDrawerOpen = false
				}
			} catch (error) {
				console.warn('初始化失败:', error);
			}
		},
		onUnload() {
			try {
				// 移除滚动监听
				this.removeScrollListener()
				if (this.scrollTimeout) {
					clearTimeout(this.scrollTimeout)
				}
			} catch (error) {
				console.warn('清理资源失败:', error)
			}
		}
	}
</script>

<style lang="scss">
@import '@/static/styles/global.scss';

	.container {
	min-height: 100vh;
	background: $gradient-primary;
	padding: 0;
	position: relative;
	overflow: hidden;

	.menu-btn, .sound-btn {
		position: fixed;
		top: calc(var(--status-bar-height) + $spacing-xs);
		z-index: 998;
		width: 2.5em;
		height: 2.5em;
		@include flex-center;
		@include glass-effect;
		border-radius: $border-radius-full;
		box-shadow: $shadow-sm;
		transition: all $transition-normal ease;

		&.hidden {
			opacity: 0;
			pointer-events: none;
		}

		&:active {
			transform: scale(0.92);
			background: rgba(255, 255, 255, 0.85);
		}
	}

	.menu-btn {
		left: calc(0.75em + var(--window-left));
	}

	.sound-btn {
		right: calc(0.75em + var(--window-right));
	}

	.drawer-content {
		height: 100%;
		background: linear-gradient(135deg, #fff6f6 0%, #f0f7ff 100%);

		.drawer-header {
			padding: calc(var(--status-bar-height)) 0 1.25em;
			background: linear-gradient(135deg, #FFE5F1 0%, #E8F7FF 100%);

			.drawer-title-wrap {
				padding: 1.25em;
				.drawer-title {
					font-size: 1.5em;
					font-weight: bold;
					color: #333;
					display: block;
					margin-bottom: 0.3125em;
				}

				.drawer-subtitle {
					font-size: 0.875em;
					color: #666;
				}
			}
		}

		.drawer-list {
			height: calc(100% - 7.5em);
			padding: 0.625em;

			.drawer-item {
				display: flex;
				align-items: center;
				justify-content: space-between;
				padding: 1em 1.25em;
				margin-bottom: 0.625em;
				background: rgba(255, 255, 255, 0.9);
				backdrop-filter: blur(0.625em);
				border-radius: 0.9375em;
				box-shadow: 0 0.125em 0.5em rgba(0, 0, 0, 0.05);
				transition: all 0.3s ease;

				&:active {
					transform: scale(0.98);
					background: rgba(255, 255, 255, 0.95);
				}

				.drawer-item-title {
					font-size: 1em;
					color: #333;
				}

				.drawer-item-badge {
					.star {
						font-size: 1em;
						animation: swing 1s ease infinite;
					}
				}
			}
		}
	}

	.content {
		min-height: 100vh;
		padding: calc(var(--status-bar-height) + 3.15em) 1.25em 1.25em;
		box-sizing: border-box;

		.game-list {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(18.75em, 1fr));
			gap: 1.25em;
			padding-bottom: calc(1.25em + var(--window-bottom));

			.game-card {
				background: rgba(255, 255, 255, 0.95);
				backdrop-filter: blur(0.625em);
				border-radius: 1.5em;
				overflow: hidden;
				box-shadow: 0 0.5em 2em rgba(0, 123, 255, 0.15),
							0 0.25em 1em rgba(255, 182, 193, 0.1);
				transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
				border: 0.1875em solid #fff;
				position: relative;

				&::before {
					content: '';
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					height: 0.25em;
					background: linear-gradient(90deg, #FF6B6B, #FFE66D, #4ECDC4, #45B7D1);
					opacity: 0;
					transition: opacity 0.3s ease;
				}

				&.hover-scale:active {
					transform: translateY(-0.625em) scale(1.02);
					box-shadow: 0 1em 3em rgba(0, 123, 255, 0.2),
								0 0.5em 1.5em rgba(255, 182, 193, 0.15);

					&::before {
						opacity: 1;
					}
				}

				.game-image {
					width: 100%;
					height: 12.5em;
					object-fit: cover;
					transition: transform 0.4s ease;
					border-bottom: 0.25em solid rgba(0, 123, 255, 0.1);

					&:active {
						transform: scale(1.05);
					}
				}

				.game-info {
					padding: 1.5em;
					background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.98) 100%);

					.game-title-wrap {
						display: flex;
						align-items: center;
						gap: 0.625em;
						margin-bottom: 0.625em;

						.game-title {
							font-size: 1.375em;
							font-weight: bold;
							color: #333;
							background: linear-gradient(45deg, #2D3436, #4834D4);
							-webkit-background-clip: text;
							-webkit-text-fill-color: transparent;
							text-shadow: 0.0625em 0.0625em 0.125em rgba(0,0,0,0.1);
						}

						.game-badge {
							background: linear-gradient(45deg, #FF6B6B, #FFD93D);
							color: white;
							padding: 0.375em 0.75em;
							border-radius: 1em;
							font-size: 0.875em;
							font-weight: bold;
							box-shadow: 0 0.125em 0.375em rgba(255,107,107,0.3);
							animation: bounce 2s ease infinite;
						}
					}

					.divider {
						height: 0.125em;
						background: linear-gradient(90deg, rgba(0,123,255,0.1), rgba(255,182,193,0.1));
						margin: 0.75em 0;
						border-radius: 0.0625em;
					}

					.game-desc {
						font-size: 0.9375em;
						color: #666;
						line-height: 1.5;
						text-shadow: 0.0625em 0.0625em 0.125em rgba(0,0,0,0.05);
					}
				}

				.start-button {
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 1em;
					background: linear-gradient(45deg, #4ECDC4, #45B7D1);
					color: white;
					font-size: 1.125em;
					font-weight: bold;
					transition: all 0.3s ease;
					position: relative;
					overflow: hidden;

					&::before {
						content: '';
						position: absolute;
						top: 0;
						left: -100%;
						width: 100%;
						height: 100%;
						background: linear-gradient(90deg,
							rgba(255,255,255,0) 0%,
							rgba(255,255,255,0.2) 50%,
							rgba(255,255,255,0) 100%);
						transition: left 0.5s ease;
					}

					&:active {
						background: linear-gradient(45deg, #45B7D1, #4ECDC4);
						transform: scale(0.98);

						&::before {
							left: 100%;
						}
					}
				}
			}
		}
	}
}

@keyframes float1 {
	0%, 100% { transform: translate(0, 0) rotate(0deg); }
	50% { transform: translate(-1.875em, 1.875em) rotate(15deg); }
}

@keyframes float2 {
	0%, 100% { transform: translate(0, 0) rotate(0deg); }
	50% { transform: translate(1.875em, -1.875em) rotate(-15deg); }
}

@keyframes swing {
	0%, 100% { transform: rotate(-10deg); }
	50% { transform: rotate(10deg); }
}

.animated {
	animation-duration: 0.6s;
	animation-fill-mode: both;
}

.fade-in {
	animation-name: fadeIn;
}

.fade-in-up {
	animation-name: fadeInUp;
}

.slide-in-left {
	animation-name: slideInLeft;
}

.pop {
	animation-name: pop;
}

.delay-0 { animation-delay: 0s; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translate3d(0, 1.25em, 0);
	}
	to {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
}

@keyframes slideInLeft {
	from {
		opacity: 0;
		transform: translate3d(-1.25em, 0, 0);
	}
	to {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
}

@keyframes pop {
	0% { transform: scale(0.8); opacity: 0; }
	50% { transform: scale(1.1); opacity: 0.8; }
	100% { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-0.25em); }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-0.5em); }
}

@keyframes pulse {
	0% { transform: scale(1); }
	50% { transform: scale(1.05); }
	100% { transform: scale(1); }
	}
</style>

