<template>
	<view 
		class="animation-container"
		:class="[type, {active: active}]"
		:style="containerStyle"
		@animationend="onAnimationEnd"
	>
		<slot></slot>
	</view>
</template>

<script>
	export default {
		name: 'GameAnimation',
		props: {
			// 动画类型
			type: {
				type: String,
				default: 'bounce'
			},
			// 动画持续时间
			duration: {
				type: Number,
				default: 300
			},
			// 动画延迟时间
			delay: {
				type: Number,
				default: 0
			},
			// 动画次数
			iterations: {
				type: Number,
				default: 1
			},
			// 是否自动播放
			autoPlay: {
				type: Boolean,
				default: true
			}
		},
		data() {
			return {
				active: false
			}
		},
		computed: {
			containerStyle() {
				return {
					'animation-duration': `${this.duration}ms`,
					'animation-delay': `${this.delay}ms`,
					'animation-iteration-count': this.iterations === -1 ? 'infinite' : this.iterations
				}
			}
		},
		mounted() {
			if (this.autoPlay) {
				this.play()
			}
		},
		methods: {
			play() {
				this.active = false
				// 强制重绘
				this.$nextTick(() => {
					this.active = true
				})
			},
			stop() {
				this.active = false
			},
			onAnimationEnd() {
				this.$emit('end')
			}
		}
	}
</script>

<style lang="scss">
.animation-container {
	display: inline-block;
	
	&.active {
		animation-fill-mode: both;
	}
	
	// 弹跳动画
	&.bounce {
		&.active {
			animation-name: bounce;
		}
	}
	
	// 淡入动画
	&.fade-in {
		&.active {
			animation-name: fadeIn;
		}
	}
	
	// 缩放动画
	&.scale {
		&.active {
			animation-name: scale;
		}
	}
	
	// 摇晃动画
	&.shake {
		&.active {
			animation-name: shake;
		}
	}
	
	// 旋转动画
	&.rotate {
		&.active {
			animation-name: rotate;
		}
	}
	
	// 弹入动画
	&.bounce-in {
		&.active {
			animation-name: bounceIn;
		}
	}
	
	// 弹出动画
	&.bounce-out {
		&.active {
			animation-name: bounceOut;
		}
	}
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes scale {
	0% { transform: scale(1); }
	50% { transform: scale(1.2); }
	100% { transform: scale(1); }
}

@keyframes shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-5px); }
	75% { transform: translateX(5px); }
}

@keyframes rotate {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
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
	100% {
		opacity: 1;
		transform: scale(1);
	}
}

@keyframes bounceOut {
	0% {
		opacity: 1;
		transform: scale(1);
	}
	50% {
		opacity: 0.9;
		transform: scale(1.1);
	}
	100% {
		opacity: 0;
		transform: scale(0.3);
	}
}
</style> 