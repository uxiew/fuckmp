<script setup lang="ts">
import { onReady, ref } from 'vue'

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

const poptpTop = ref(0)
const NAV_HEIGHT = ref(0)
const height = ref(0)
const show1 = ref(false)
const title1 = ref('请选择')
const title2 = ref('请选择')
const title3 = ref('请选择')
const title4 = ref('请选择')
const title5 = ref('请选择')
const show2 = ref(false)
const show3 = ref(false)
const show4 = ref(false)
const show5 = ref(false)
const data1 = ref([])
const data2 = ref([{
  name: '美食',
  value: 'food',
  children: [{
    name: '火锅',
    value: 'chafing dish',
    children: [{
      name: '川味火锅',
      value: 'SiChuan chafing dish'
    }, {
      name: '老北京火锅',
      value: 'Beijing chafing dish'
    }, {
      name: '牛肉火锅',
      value: 'Beef chafing dish'
    }]
  }, {
    name: '西餐',
    value: 'western food',
    children: [{
      name: '意大利菜',
      value: 'Italy food'
    }, {
      name: '法国菜',
      value: 'France food'
    }, {
      name: '汉堡',
      value: 'Hamburg'
    }]
  }]
}, {
  name: '旅游',
  value: 'tour',
  children: [{
    name: '周边游',
    value: 'tour around',
    children: [{
      name: '景点',
      value: 'Scenic spot'
    }, {
      name: '公园',
      value: 'Park'
    }, {
      name: '名胜古迹',
      value: 'Historical sites'
    }]
  }, {
    name: '海外游',
    value: 'tour aboard',
    children: [{
      name: '美国游',
      value: 'American tour'
    }, {
      name: '欧洲游',
      value: 'Europe tour'
    }, {
      name: '东南亚游',
      value: 'Southease Asia tour'
    }]
  }]
}])
const data3 = ref([{
  name: '采购部',
  value: 'DP_01',
  children: [{
    name: '采购一科',
    value: 'DP_0101'
  }, {
    name: '采购二科',
    value: 'DP_0102'
  }, {
    name: '采购三科',
    value: 'DP_0103'
  }]
}, {
  name: '制造部',
  value: 'DP_02',
  children: [{
    name: '制造一科',
    value: 'DP_0201'
  }, {
    name: '制造二科',
    value: 'DP_0202'
  }, {
    name: '制造三科',
    value: 'DP_0203'
  }]
}])

function setData(patch: Record<string, any>) {
  if (Object.prototype.hasOwnProperty.call(patch, 'poptpTop')) poptpTop.value = patch['poptpTop']
  if (Object.prototype.hasOwnProperty.call(patch, 'NAV_HEIGHT')) NAV_HEIGHT.value = patch['NAV_HEIGHT']
  if (Object.prototype.hasOwnProperty.call(patch, 'height')) height.value = patch['height']
  if (Object.prototype.hasOwnProperty.call(patch, 'show1')) show1.value = patch['show1']
  if (Object.prototype.hasOwnProperty.call(patch, 'title1')) title1.value = patch['title1']
  if (Object.prototype.hasOwnProperty.call(patch, 'title2')) title2.value = patch['title2']
  if (Object.prototype.hasOwnProperty.call(patch, 'title3')) title3.value = patch['title3']
  if (Object.prototype.hasOwnProperty.call(patch, 'title4')) title4.value = patch['title4']
  if (Object.prototype.hasOwnProperty.call(patch, 'title5')) title5.value = patch['title5']
  if (Object.prototype.hasOwnProperty.call(patch, 'show2')) show2.value = patch['show2']
  if (Object.prototype.hasOwnProperty.call(patch, 'show3')) show3.value = patch['show3']
  if (Object.prototype.hasOwnProperty.call(patch, 'show4')) show4.value = patch['show4']
  if (Object.prototype.hasOwnProperty.call(patch, 'show5')) show5.value = patch['show5']
  if (Object.prototype.hasOwnProperty.call(patch, 'data1')) data1.value = patch['data1']
  if (Object.prototype.hasOwnProperty.call(patch, 'data2')) data2.value = patch['data2']
  if (Object.prototype.hasOwnProperty.call(patch, 'data3')) data3.value = patch['data3']
}

const showPop1 = () => {
  setData({
    show1: true
  });
}

const showPop2 = () => {
  setData({
    show2: true
  });
}

const showPop3 = () => {
  setData({
    show3: true
  });
}

const showPop4 = () => {
  setData({
    show4: true
  });
}

const showPop5 = () => {
  setData({
    show5: true
  });
}

const navigateBack = () => {
  wxSafe.navigateBack();
}

const handleselected1 = (e) => {
  let data = e.detail;
  title1.value = "";
  for (var i = 0; i < data.length; i++) {
    title1.value += data[i].name + ' ';
  }
  setData({
    show1: false,
    title1: title1.value
  });
}

const handleselected2 = (e) => {
  let data = e.detail;
  console.log(data);
  title2.value = "";
  for (var i = 0; i < data.length; i++) {
    title2.value += data[i].name + ' ';
  }
  setData({
    show2: false,
    title2: title2.value
  });
}

const handleselected3 = (e) => {
  let data = e.detail;
  title3.value = "";
  for (var i = 0; i < data.length; i++) {
    title3.value += data[i].name + ' ';
  }
  setData({
    show3: false,
    title3: title3.value
  });
}

const handleselected4 = (e) => {
  let data = e.detail;
  title4.value = "";
  for (var i = 0; i < data.length; i++) {
    title4.value += data[i].name + ' ';
  }
  setData({
    show4: false,
    title4: title4.value
  });
}

const handleselected5 = (e) => {
  console.log(e, '121212');
  let data = e.detail;
  title5.value = "";
  for (var i = 0; i < data.length; i++) {
    title5.value += data[i].name + ' ';
  }
  setData({
    show5: false,
    title5: title5.value
  });
}

onReady(() => {
  console.log(data2.value);
  setData({
    data1: [{
      name: '美食',
      value: 'food',
      children: [{
        name: '火锅',
        value: 'chafing dish',
        children: [{
          name: '川味火锅',
          value: 'SiChuan chafing dish'
        }, {
          name: '老北京火锅',
          value: 'Beijing chafing dish'
        }, {
          name: '牛肉火锅',
          value: 'Beef chafing dish'
        }]
      }, {
        name: '西餐',
        value: 'western food',
        children: [{
          name: '意大利菜',
          value: 'Italy food'
        }, {
          name: '法国菜',
          value: 'France food'
        }, {
          name: '汉堡',
          value: 'Hamburg'
        }]
      }]
    }, {
      name: '旅游',
      value: 'tour',
      children: [{
        name: '周边游',
        value: 'tour around',
        children: [{
          name: '景点',
          value: 'Scenic spot'
        }, {
          name: '公园',
          value: 'Park'
        }, {
          name: '名胜古迹',
          value: 'Historical sites'
        }]
      }, {
        name: '海外游',
        value: 'tour aboard',
        children: [{
          name: '美国游',
          value: 'American tour'
        }, {
          name: '欧洲游',
          value: 'Europe tour'
        }, {
          name: '东南亚游',
          value: 'Southease Asia tour'
        }]
      }]
    }, {
      name: '旅游',
      value: 'tour',
      children: [{
        name: '周边游',
        value: 'tour around',
        children: [{
          name: '景点',
          value: 'Scenic spot'
        }, {
          name: '公园',
          value: 'Park'
        }, {
          name: '名胜古迹',
          value: 'Historical sites'
        }]
      }, {
        name: '海外游',
        value: 'tour aboard',
        children: [{
          name: '美国游',
          value: 'American tour'
        }, {
          name: '欧洲游',
          value: 'Europe tour'
        }, {
          name: '东南亚游',
          value: 'Southease Asia tour'
        }]
      }]
    }, {
      name: '旅游',
      value: 'tour',
      children: [{
        name: '周边游',
        value: 'tour around',
        children: [{
          name: '景点',
          value: 'Scenic spot'
        }, {
          name: '公园',
          value: 'Park'
        }, {
          name: '名胜古迹',
          value: 'Historical sites'
        }]
      }, {
        name: '海外游',
        value: 'tour aboard',
        children: [{
          name: '美国游',
          value: 'American tour'
        }, {
          name: '欧洲游',
          value: 'Europe tour'
        }, {
          name: '东南亚游',
          value: 'Southease Asia tour'
        }]
      }]
    }]
  });
})

</script>

<template>
<view>
  <ui-nav-bar slot="nav-bar" custom-style="{{ {borderBottom:'1px solid rgba(231, 231, 231, 0.6)',backgroundColor:'#fff'} }}">
    <ui-row height="46">
      <ui-col vertical-align="middle" align="center" width="60" bindtap="navigateBack">
          <ui-icon type="arrow-left" size="16" color="#333"></ui-icon>
      </ui-col>
      <ui-col vertical-align="middle" align="center">
        <view>级联选择器</view>
      </ui-col>
      <ui-col vertical-align="middle" align="center" width="60">
        
      </ui-col>
    </ui-row>
  </ui-nav-bar>
  <view style="height:{{NAV_HEIGHT}}"></view>

  <view class="sample_title">右侧弹出</view>
  <ui-row height="40" border-top border-bottom>
    <ui-col span="3" vertical-align="middle" align="right" space-right="10">
      附近
    </ui-col>
    <ui-col span="9" bindtap="showPop2" vertical-align="middle">
      {{title2}}
    </ui-col>
  </ui-row>
  <ui-popup show="{{show2}}" position="right" width="80%" top="{{ poptpTop }}" mask-style="{{ {backgroundColor:'rgba(255,255,255,0.6)'} }}">
    <ui-cascader bindselected="handleselected2" data="{{data2}}" height="{{height}}"></ui-cascader>
  </ui-popup>

    <view class="sample_title">自定义颜色</view>
    <ui-row height="40" border-top border-bottom>
      <ui-col span="3" vertical-align="middle" align="right" space-right="10">
        附近
      </ui-col>
      <ui-col span="9" bindtap="showPop4" vertical-align="middle">
        {{title4}}
      </ui-col>
    </ui-row>
    <ui-popup show="{{show4}}" position="bottom" width="100%" height="300">
      <ui-cascader bindselected="handleselected4" data="{{data2}}" theme-color="red"></ui-cascader>
    </ui-popup>

    <view class="sample_title">二级联动</view>
    <ui-row height="40" border-top border-bottom>
      <ui-col span="3" vertical-align="middle" align="right" space-right="10">
        请选择部门
      </ui-col>
      <ui-col span="9" bindtap="showPop5" vertical-align="middle">
        {{title5}}
      </ui-col>
    </ui-row>
    <ui-popup show="{{show5}}" position="top" width="100%" height="300" top="{{ poptpTop }}" mask-style="{{ {backgroundColor:'rgba(255,255,255,0.6)',top:poptpTop+'px'} }}">
      <ui-cascader show-title="{{false}}" bindselected="handleselected5" data="{{data3}}"></ui-cascader>
    </ui-popup>

    <view class="sample_title">动态加载数据</view>
    <ui-row height="40" border-top border-bottom>
      <ui-col span="3" vertical-align="middle" align="right" space-right="10">
        所在地区
      </ui-col>
      <ui-col span="9" bindtap="showPop1" vertical-align="middle">
        {{title1}}
      </ui-col>
    </ui-row>
    <ui-popup show="{{show1}}" position="bottom" width="100%" height="300">
      <ui-cascader data="{{data1}}" bindselected="handleselected1" ></ui-cascader>
    </ui-popup>
  </view>
</template>

<style lang="css" scoped>

</style>
