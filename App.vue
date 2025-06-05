<script>
	export default {
		onLaunch: function() {
			console.warn('当前组件仅支持 uni_modules 目录结构 ，请升级 HBuilderX 到 3.1.0 版本以上！')
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	@import '@/static/customicons.css';
	@import '@/static/styles/global.scss';
	
	/* #ifndef APP-NVUE */
	/* 设置基准字体大小 */
	html {
		font-size: $base-font-size;
	}
	
	/* 设置整个项目的背景色 */
	page {
		background-color: $background-light;
		font-size: 1rem;
	}
	/* #endif */

	.example-info {
		font-size: 0.875em;
		color: $text-primary;
		padding: $spacing-sm;
	}
</style>
