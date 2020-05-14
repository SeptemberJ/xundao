import Taro, { Component } from '@tarojs/taro'
import { Provider } from '@tarojs/redux'

import Index from './pages/index'

import configStore from './store'

import './app.scss'

// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

const store = configStore()

class App extends Component {

  config = {
    pages: [
      'pages/loading/index',
      'pages/survey/index',
      'pages/install/index',
      'pages/image/index',
      'pages/order/index',
      'pages/detail/index'
    ],
    window: {
      // navigationStyle: 'custom',
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#ffffff', // #6190e8
      navigationBarTitleText: 'WeChat',
      navigationBarTextStyle: 'black'
    },
    permission: {
      'scope.userLocation': {
        desc: "你的位置信息将用于拍摄图片时的信息显示"
      }
    }
  }

  componentDidMount () {
    Taro.getSystemInfo({
      success(res) {
        console.log(res)
      }
    })
  }

  componentDidShow () {}

  componentDidHide () {}

  componentDidCatchError () {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render () {
    return (
      <Provider store={store}>
        <Index />
      </Provider>
    )
  }
}
Taro.getSystemInfo({})
.then(res  => {
  Taro.$navBarMarginTop =  res.statusBarHeight// * 2 > 63 ? 63  : res.statusBarHeight * 2
  Taro.$windowWidth =  res.windowWidth
  Taro.$windowHeight =  res.windowHeight
})
Taro.render(<App />, document.getElementById('app'))
