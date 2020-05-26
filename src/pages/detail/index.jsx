import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import QR from 'wxmp-qrcode'
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
class Detail extends Component {

  config = {
    navigationBarTitleText: '订单详情'
  }

  constructor(props) {
    super(props)
    this.state = {
      id: '',
      orderDeatil: {
        surveyList: []
      },
      canvasId: 'evaluate_qrcode',
      QRdata: 'http://118.25.129.9:8087/a/evaluate.html?id=123'
    }
  }
  componentWillMount () {
    this.setState({
      id: this.$router.params.id
    })
    // QR.draw('http://baidu.com', 'myCanvas')
  }
  
  componentDidMount () {
    this.getOrdeDetail(this.state.id)
  }

  previewImage = (picList, currentPic) => {
    Taro.previewImage({
      urls: picList,
      current: currentPic
    })
  }

  getOrdeDetail = (id) => {
    send.post('cos/orderDetail', {id: id}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          let tmpInfo = {... res.data.data}
          let tmpSurveyList = res.data.data.surveyList.map(item => {
            return item.replace(/[\r\n]/g,"")
          })
          let tmpInstallImgListt = res.data.data.installList.map(item => {
            return item.replace(/[\r\n]/g,"")
          })
          tmpInfo.surveyList = tmpSurveyList
          tmpInfo.installList = tmpInstallImgListt
          this.setState({
            orderDeatil: tmpInfo
          })
          if (tmpInfo.evaluate_status == 0 && tmpInfo.fstatus == 4) {
            QR.draw('http://118.25.129.9:8087/a/evaluate.html?id=' + id, 'evaluate_qrcode')
          }
          break
        default:
          Taro.showToast({
            title: '订单详情获取失败',
            icon: 'none',
            duration: 1500
          })
      }
    })
  }

  render () {
    let orderDeatil = this.state.orderDeatil
    let surveyImgList = null
    let installImgList = null
    if (orderDeatil.surveyList && orderDeatil.surveyList.length > 0) {
      // surveyImgList = orderDeatil.surveyList.map((survey, idx) => {
      //   return {
      //     url: survey.replace(/[\r\n]/g,"")
      //   }
      // })
      surveyImgList = orderDeatil.surveyList.map((survey, idx) => {
        return <View onClick={this.previewImage.bind(this, orderDeatil.surveyList, survey)} key={survey}><Image mode="aspectFit" key={survey} src={survey}/></View>
      })
    }
    if (orderDeatil.installList && orderDeatil.installList.length > 0) {
      installImgList = orderDeatil.installList.map((install, idx) => {
        return <View onClick={this.previewImage.bind(this, orderDeatil.installList, install)} key={install}><Image mode="aspectFit" key={install} src={install}/></View>
      })
    }
    return (
      <View className='Detail'>
        <View className="topInfo">
          <View className="itemBar">
            <View>
              <Text>工单号：</Text>
              <Text>{orderDeatil.workno}</Text>
            </View>
          </View>
          <View className="itemBar">
            <View>
              <Text>车主姓名：</Text>
              <Text>{orderDeatil.driver_name}</Text>
            </View>
          </View>
          <View className="itemBar">
            <View>
              <Text>车主电话：</Text>
              <Text>{orderDeatil.driver_phone}</Text>
            </View>
          </View>
          <View className="itemBar">
            <View>
              <Text>建桩联系人：</Text>
              <Text>{orderDeatil.construct_stake_contact}</Text>
            </View>
          </View>
          <View className="itemBar">
            <View>
              <Text>建桩联系电话：</Text>
              <Text>{orderDeatil.construct_stake_phone}</Text>
            </View>
          </View>
          <View className="itemBar">
          <View>
            <Text>建桩地址：</Text>
            <Text>{orderDeatil.construct_stake_address}</Text>
          </View>
        </View>
        </View>
        <View className="submitInfo">
          <Text>勘察图片：</Text>
          <View className="imgList">
            { surveyImgList }
          </View>
          <Text>勘察备注：</Text>
          <View className="note">
            <Text>{ orderDeatil.survey_note }</Text>
            {/* <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' disabled maxLength={200} height={300} value={orderDeatil.survey_note}/> */}
          </View>
          <Text>安装图片：</Text>
          <View className="imgList">
          { installImgList }
          </View>
          <View className="itemBar">
            <View>
              <Text>SN码：</Text>
              <Text>{orderDeatil.sn}</Text>
            </View>
          </View>
          <Text>安装备注：</Text>
          <View className="note">
          <Text>{ orderDeatil.install_note }</Text>
            {/* <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' disabled maxLength={200} height={300} value={orderDeatil.install_note}/> */}
          </View>
        </View>
        <View className="evaluate">
          {
            orderDeatil.evaluate_status == 0 && orderDeatil.fstatus == 4 && <Text>扫描下方二维码对师傅进行评价</Text>
          }
          <canvas id="evaluate_qrcode" canvas-id="evaluate_qrcode"></canvas>
        </View>
      </View>
    )
  }
}

export default Detail
