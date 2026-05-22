module.exports = {
  app: {
    window: {
      navigationBarBackgroundColor: '#1f2a44',
      navigationBarTextStyle: 'white',
      navigationBarTitleText: '真实示例'
    },
    tabBar: {
      color: '#8a93a6',
      selectedColor: '#1f7aec',
      backgroundColor: '#ffffff',
      borderStyle: 'black',
      list: [
        {
          pagePath: 'pages/index/index',
          text: '首页'
        },
        {
          pagePath: 'pages/profile',
          text: '资料'
        }
      ]
    }
  },
  project: {
    description: 'Vue3 微信小程序真实验收示例',
    projectname: 'vue3mp-real-miniprogram',
    libVersion: '2.19.4'
  },
  pageTitles: {
    index: '首页',
    profile: '资料'
  }
}
