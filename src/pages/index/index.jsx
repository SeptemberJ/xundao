import Taro, { Component } from '@tarojs/taro'
import { View, Button, Text, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtButton, AtModal } from 'taro-ui'
import { add, minus, asyncAdd } from '../../actions/counter'
import send from '../../service/api'
import './index.scss'


@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  add () {
    dispatch(add())
  },
  dec () {
    dispatch(minus())
  },
  asyncAdd () {
    dispatch(asyncAdd())
  }
}))
class Index extends Component {

  config = {
    navigationBarTitleText: '循道'
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpened: false
    }
  }
  componentWillReceiveProps (nextProps) {
    console.log(this.props, nextProps)
  }
  componentWillMount () {
    Taro.navigateTo({
      url: '/pages/image/index'
    })
    // Taro.login({
    //   success(res) {
    //     send.get('getOpen_id', {code: res.code}).then((res) => {
    //       console.log(res)
    //     })
    //   }
    // })
  }
  componentWillUnmount () {
  }

  componentDidShow () { }

  componentDidHide () { }
  getPhoneNumber = (e) => {
    if (e.detail.errMsg == 'getPhoneNumber:ok') {
      send.get('getPhone', {encryptedData: e.detail.encryptedData, iv: e.detail.iv, session_key: ''}).then((res) => {
        console.log(res)
      })
    } else {
      this.setState({
        isOpened: true
      })
    }
  }
  handleConfirm = () => {
    this.setState({
      isOpened: false
    })
  }

  render () {
    return (
      <View className='Index'>
        <View className='topBlock'></View>
        <View className='mainBlock'>
          <View className='logoBlock'>
            <Image src='https://camo.githubusercontent.com/3e1b76e514b895760055987f164ce6c95935a3aa/687474703a2f2f73746f726167652e333630627579696d672e636f6d2f6d74642f686f6d652f6c6f676f2d3278313531333833373932363730372e706e67'/>
            <Text>循道</Text>
          </View>
          <View className='Authorization'>
            <AtButton circle type="primary" openType="getPhoneNumber" onGetPhoneNumber={this.getPhoneNumber}>微信授权登录</AtButton>
          </View>
        </View>
        {/* <Button className='add_btn' onClick={this.props.add}>+</Button>
        <Button className='dec_btn' onClick={this.props.dec}>-</Button>
        <Button className='dec_btn' onClick={this.props.asyncAdd}>async</Button>
        <View><Text>{this.props.counter.num}</Text></View>
        <View><Text>Hello, World</Text></View> */}
        <AtModal
          isOpened={this.state.isOpened}
          title='提示'
          confirmText='确认'
          onConfirm={ this.handleConfirm }
          content='为了更好地使用循道小程序，请允许小程序获取您微信绑定的手机号。'
        />
      </View>
    )
  }
}

export default Index
