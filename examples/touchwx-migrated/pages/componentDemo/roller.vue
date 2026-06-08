<script setup lang="ts">
import { ref } from 'vue'

const wxSafe = typeof wx !== 'undefined'
  ? wx
  : {
      STATUS_BAR_HEIGHT: 20,
      DEFAULT_HEADER_HEIGHT: 46,
      DEFAULT_CONTENT_HEIGHT: 667,
      WIN_WIDTH: 375,
      navigateBack() {},
      navigateTo() {},
      showToast() {},
      setStorageSync() {},
      createMapContext() {
        return { moveToLocation() {} }
      },
      openSysMap() {}
    }

const NAV_HEIGHT = ref(0)
const imgSrc = ref('http://images.uileader.com/20180413/724c6ad5-b6e0-4971-adeb-f4f502c7243e.png')
const imgSrc2 = ref('http://images.uileader.com/20180413/71ed499e-df2f-4bfd-9270-eed0171fa752.png')
const Notify = ref([])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc')) imgSrc.value = patch['imgSrc']
  if (Object.prototype.hasOwnProperty.call(patch, 'imgSrc2')) imgSrc2.value = patch['imgSrc2']
  if (Object.prototype.hasOwnProperty.call(patch, 'Notify')) Notify.value = patch['Notify']
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const rollerData = () => {
  Notify.value = [{
    "title": "商城即将上线1"
  }, {
    "title": "商城即将上线2"
  }, {
    "title": "商城即将上线3"
  }];
  console.log(Notify.value);
  setData({
    Notify: Notify.value
  });
}

</script>

<template>
<view>
      <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
      <ui-row height="46">
        <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
            <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
        </ui-col>
        <ui-col vertical-align="middle" align="center">
          <view>滚动公告</view>
        </ui-col>
        <ui-col vertical-align="middle" align="center" width="60">
        </ui-col>
      </ui-row>
    </ui-nav-bar>
    <view style="height:{{NAV_HEIGHT}}"></view>
      <view class="sample_title">基本使用</view>
      <view class="sample_content">
        <ui-roller>
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">1touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">2touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">3touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">4touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>


        </ui-roller>
      </view>

      <view class="sample_title">自定义滚动速度 300毫秒</view>
      <view class="sample_content">
        <ui-roller  speed="300">
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>
          <ui-roller-item>
            <ui-row>
              <ui-col span="1">
                <text style="color:#F00;">荐</text>
              </ui-col>
              <ui-col span="11">touchui 让企业移动开发降低80%成本</ui-col>
            </ui-row>
          </ui-roller-item>
        </ui-roller>
      </view>

      <view class="sample_title">自定义单行滚动</view>
      <view class="sample_content">
        <ui-row height="30">
          <ui-col span="2" vertical-align="middle">
            <image src="{{imgSrc}}" style="width:100%;height:11px;" width="100%" mode="aspectFill"></image>
          </ui-col>
          <ui-col span="10" space-left="10">
            <ui-roller autoplay="2000">
              <ui-roller-item>
                <ui-row>
                  <ui-col span="1">
                    <text style="color:#F00;">荐</text>
                  </ui-col>
                  <ui-col span="11">
                    <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                  </ui-col>
                  
                </ui-row>
              </ui-roller-item>
              <ui-roller-item>
                <ui-row>
                  <ui-col span="1">
                    <text style="color:#F00;">荐</text>
                  </ui-col>
                  <ui-col span="11">
                    <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                  </ui-col>
                </ui-row>
              </ui-roller-item>
              <ui-roller-item>
                <ui-row>
                  <ui-col span="1">
                    <text style="color:#F00;">荐</text>
                  </ui-col>
                  <ui-col span="11">
                    <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                  </ui-col>
                </ui-row>
              </ui-roller-item>
            </ui-roller>
          </ui-col>
        </ui-row>
      </view>

      <view class="sample_title">多行滚动 自定义滚动时间 5秒</view>
      <view class="sample_content">
        <ui-row height="40">
          <ui-col span="2" vertical-align="middle">
            <image style="width:45px;height:45px;" src="{{imgSrc2}}" mode="aspectFill"></image>
          </ui-col>
          <ui-col span="10">
            <ui-roller autoplay="5000" height=60>
              <ui-roller-item>
                <view class="item">
                  <ui-row>
                    <ui-col span="1"><text style="color:#F00;">荐</text></ui-col>
                    <ui-col span="11">
                      <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                    </ui-col>
                  </ui-row>
                </view>
                <view class="item">
                  <ui-row>
                    <ui-col span="1"><text style="color:#F00;">荐</text></ui-col>
                    <ui-col span="11">
                      <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                    </ui-col>
                    
                  </ui-row>
                </view>
              </ui-roller-item>
              <ui-roller-item>
                <view class="item">
                  <ui-row>
                    <ui-col span="1"><text style="color:#F00;">荐</text></ui-col>
                    <ui-col span="11">
                      <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                    </ui-col>
                  </ui-row>
                </view>
                <view class="item">
                  <ui-row>
                    <ui-col span="1"><text style="color:#F00;">荐</text></ui-col>
                    <ui-col span="11">
                      <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                    </ui-col>
                  </ui-row>
                </view>
              </ui-roller-item>
              <ui-roller-item>
                <view class="item">
                  <ui-row>
                    <ui-col span="1"><text style="color:#F00;">荐</text></ui-col>
                    <ui-col span="11">
                      <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                    </ui-col>
                  </ui-row>
                </view>
                <view class="item">
                  <ui-row>
                    <ui-col span="1"><text style="color:#F00;">荐</text></ui-col>
                    <ui-col span="11">
                      <text block class="roller-text">touchui 让企业移动开发降低80%成本</text>
                    </ui-col>
                  </ui-row>
                </view>
              </ui-roller-item>
            </ui-roller>
          </ui-col>
        </ui-row>
      </view>

    

    <view class="sample_title">动态加载数据</view>
    <view class="sample_content">
      <ui-roller speed="1000" wx:if="{{Notify.length > 0}}">
          <ui-roller-item wx:for="{{Notify}}" wx:key="index" wx:for-item="item">
              <ui-row>
                  <ui-col span="1">
                      <text style="color:#F00;">荐</text>
                  </ui-col>
                  <ui-col span="11">{{item.title}}</ui-col>
              </ui-row>
          </ui-roller-item>
      </ui-roller>
    </view>
    <button bindtap="rollerData">加载</button>

  </view>
</template>

<style lang="scss" scoped>
// roller.less
.item{
  height: 20px;
  line-height: 20px;
}
.roller-text{
  /* migrated less mixin: .mix-text-overflow(); */
}
</style>
