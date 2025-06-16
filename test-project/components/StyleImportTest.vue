<template>
  <view class="style-import-test">
    <view class="header">
      <text class="title">样式导入测试</text>
      <text class="subtitle">测试 SCSS 导入功能</text>
    </view>
    
    <view class="content">
      <view class="global-card">
        <text class="text-primary">这是使用全局样式的卡片</text>
      </view>
      
      <button class="global-button" @click="handleClick">
        全局按钮样式
      </button>
      
      <view class="local-styled-element">
        <text class="text-success">这是本地样式元素</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// JavaScript 中导入样式文件
import '../assets/css/global.scss'

const handleClick = () => {
  console.log('按钮被点击')
}
</script>

<style lang="scss">
// Style 标签中导入样式文件
@import '../assets/css/mixins.scss';

.style-import-test {
  @include flex-center;
  flex-direction: column;
  padding: $padding-base;
  
  .header {
    text-align: center;
    margin-bottom: $margin-base * 2;
    
    .title {
      font-size: $font-size-xl;
      color: $primary-color;
      font-weight: bold;
    }
    
    .subtitle {
      font-size: $font-size-base;
      color: #666;
      margin-top: $margin-base;
    }
  }
  
  .content {
    width: 100%;
    
    .local-styled-element {
      @include card-style;
      @include flex-center;
      margin-top: $margin-base;
      background: linear-gradient(45deg, $success-color, $secondary-color);
    }
  }
}
</style>
