import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtButton } from 'taro-ui'
import { updateUserInfo } from '../../actions/counter'
import send from '../../service/api'
import './index.scss'


@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  toUpdateUserInfo (openid, session_key, userid) {
    dispatch(updateUserInfo(openid, session_key, userid))
  }
}))
class Index extends Component {

  config = {
    navigationBarTitleText: '循道'
  }

  constructor(props) {
    super(props)
    this.state = {
      showBt: false,
      isOpened: false
    }
  }
  componentWillReceiveProps (nextProps) {
  }
  componentWillMount () {
  }
  componentWillUnmount () {
  }

  componentDidShow () {
    let _this = this
    Taro.login({
      success(res) {
        send.get('getOpen_id', {code: res.code}).then((res) => {
          switch (res.data.code) {
            case 0:
              // 未授权
              _this.props.toUpdateUserInfo(res.data.openid, res.data.session_key, '')
              Taro.showModal({
                title: '提示',
                content: `您的账号尚未进行授权，请先进行授权`,
                showCancel: false
              }).then(res => {
                _this.setState({
                  showBt: true
                })
              })
              break
            case 1:
              _this.props.toUpdateUserInfo(res.data.openid, res.data.session_key, res.data.userid)
              // 已授权进入订单界面
              Taro.redirectTo({
                url: '/pages/order/index'
              })
              break
          }
        })
      }
    })
  }

  getPhoneNumber = (e) => {
    let _this = this
    let openid = this.props.counter.openid
    let sessionKey = this.props.counter.session_key
    if (e.detail.errMsg == 'getPhoneNumber:ok') {
      send.get('getPhone', {encryptedData: e.detail.encryptedData, iv: e.detail.iv, session_key: sessionKey}).then((res) => {
        send.post('updateOpenid', {openid: openid, fmobile: res.data.phoneNumber}).then((res) => {
          switch (res.data.code) {
            case '1':
              _this.props.toUpdateUserInfo(openid, sessionKey, res.data.userid)
              Taro.showToast({
                title: '授权成功',
                icon: 'success',
                duration: 1000
              }).then(
                Taro.navigateTo({
                  url: '/pages/order/index'
                })
              )
              break
            default:
              Taro.showToast({
                title: '授权失败',
                icon: 'none',
                duration: 1500
              })
          }
        })
      })
    } else {
      Taro.showModal({
        title: '提示',
        content: `为了更好地使用循道小程序，请允许小程序获取您微信绑定的手机号。`,
        showCancel: false
      }).then(res => {
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
          {this.state.showBt && 
            <View className='Authorization'>
            <AtButton circle type="primary" openType="getPhoneNumber" onGetPhoneNumber={this.getPhoneNumber}>微信授权登录</AtButton>
          </View>
          }
        </View>
      </View>
    )
  }
}

export default Index
