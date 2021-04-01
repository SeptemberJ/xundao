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
      }
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
            return item.url.replace(/[\r\n]/g,"")
          })
          let tmpInstallImgList = res.data.data.installList.map(item => {
            return item.url.replace(/[\r\n]/g,"")
          })
          let tmpInstallImgList2 = res.data.data.installList2.map(item => {
            return item.url.replace(/[\r\n]/g,"")
          })
          let tmpInstallImgList3 = res.data.data.installList3.map(item => {
            return item.url.replace(/[\r\n]/g,"")
          })
          let tmpInstallImgList4 = res.data.data.installList4.map(item => {
            return item.url.replace(/[\r\n]/g,"")
          })
          let tmpInstallImgList5 = res.data.data.installList5.map(item => {
            return item.url.replace(/[\r\n]/g,"")
          })
          tmpInfo.surveyList = tmpSurveyList
          tmpInfo.installList = tmpInstallImgList
          tmpInfo.installList2 = tmpInstallImgList2
          tmpInfo.installList3 = tmpInstallImgList3
          tmpInfo.installList4 = tmpInstallImgList4
          tmpInfo.installList5 = tmpInstallImgList5
          this.setState({
            orderDeatil: tmpInfo
          })
          if (tmpInfo.evaluate_status == 0 && (tmpInfo.fstatus == 5 || tmpInfo.fstatus == 6 || tmpInfo.fstatus == 7 || tmpInfo.fstatus == 8)) {
            QR.draw('https://xundao.shkingdee-soft.com/1/evaluate.html?id=' + id, 'evaluate_qrcode')
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
    let installImgList2 = null
    let installImgList3 = null
    let installImgList4 = null
    let installImgList5 = null
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
    if (orderDeatil.installList2 && orderDeatil.installList2.length > 0) {
      installImgList2 = orderDeatil.installList2.map((install, idx) => {
        return <View onClick={this.previewImage.bind(this, orderDeatil.installList2, install)} key={install}><Image mode="aspectFit" key={install} src={install}/></View>
      })
    }
    if (orderDeatil.installList3 && orderDeatil.installList3.length > 0) {
      installImgList3 = orderDeatil.installList3.map((install, idx) => {
        return <View onClick={this.previewImage.bind(this, orderDeatil.installList3, install)} key={install}><Image mode="aspectFit" key={install} src={install}/></View>
      })
    }
    if (orderDeatil.installList4 && orderDeatil.installList4.length > 0) {
      installImgList4 = orderDeatil.installList4.map((install, idx) => {
        return <View onClick={this.previewImage.bind(this, orderDeatil.installList4, install)} key={install}><Image mode="aspectFit" key={install} src={install}/></View>
      })
    }
    if (orderDeatil.installList5 && orderDeatil.installList5.length > 0) {
      installImgList5 = orderDeatil.installList5.map((install, idx) => {
        return <View onClick={this.previewImage.bind(this, orderDeatil.installList5, install)} key={install}><Image mode="aspectFit" key={install} src={install}/></View>
      })
    }

    const productionList = orderDeatil.orderSdcost.map((item, idx) => {
      return <View className="pListTit" key={idx}>
        <Text>{ item.fmodel }</Text>
        <Text>{ item.fmax }</Text>
        <Text>{ item.fnum }</Text>
        <Text>{ item.fprice }元</Text>
      </View>
    })
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
          <View className="itemBar">
            <View>
              <Text>备注：</Text>
              <Text>{orderDeatil.fnote}</Text>
            </View>
          </View>
          <View className="itemBar">
            <View>
              <Text>服务商：</Text>
              <Text>{orderDeatil.serviceProvider}</Text>
            </View>
          </View>
          <View className="itemBar">
            <View>
              <Text>建桩类型：</Text>
              <Text>{orderDeatil.ftype}</Text>
            </View>
          </View>
          {
            orderDeatil.appdate && <View className="itemBar">
              <View>
                <Text>预约时间：</Text>
                <Text>{orderDeatil.appdate}</Text>
              </View>
            </View>
          }
          {
            // (orderDeatil.fstatus == 3 || orderDeatil.fstatus == 4) && <View className="itemBar">
            <View className="itemBar">
              <View>
                <Text>型号：</Text>
                <Text>{orderDeatil.fnumber}</Text>
              </View>
            </View>
          }
          {
            <View className="itemBar">
              <View>
                <Text>是否纯安装：</Text>
                <Text>{orderDeatil.isinstall}</Text>
              </View>
            </View>
          }
          {
            <View className="itemBar">
              <View>
                <Text>SN码：</Text>
                <Text>{orderDeatil.sn}</Text>
              </View>
            </View>
          }
          {
            <View className="itemBar">
              <View>
                <Text>立柱：</Text>
                <Text>{orderDeatil.post}</Text>
              </View>
            </View>
          }
          {
            <View className="itemBar">
              <View>
                <Text>漏保：</Text>
                <Text>{orderDeatil.leakpro}</Text>
              </View>
            </View>
          }
          {/* {
            (orderDeatil.fstatus == 3 || orderDeatil.fstatus == 4) && <View className="itemBar">
            <View>
              <Text>是否报桩：</Text>
              <Text>{orderDeatil.isbz}</Text>
            </View>
          </View>
          } */}
          {
            <View className="itemBar">
              <View>
                <Text>电缆：</Text>
                <Text>{orderDeatil.cable}</Text>
              </View>
            </View>
          }
          {
            <View className="itemBar">
              <View>
                <Text>管材：</Text>
                <Text>{orderDeatil.pipe}</Text>
              </View>
            </View>
          }
          {
            <View className="itemBar">
              <View>
                <Text>米数：</Text>
                <Text>{orderDeatil.fmeter}</Text>
              </View>
            </View>
          }
          <View className="itemBar" style="border-bottom: 0;">
            <View>
              <Text>超标项目：</Text>
              <Text> </Text>
            </View>
          </View>
          {/* <View className="pListTit" style="background: #F3F0F3;">
            <Text>规格</Text>
            <Text>最高价格</Text>
            <Text>实际用量</Text>
            <Text>实际收费</Text>
          </View>
          { productionList } */}
          <View className="pListTit">
            <Text style="color: #f35957;">实际费用金额</Text>
            <Text></Text>
            <Text></Text>
            <Text style="color: #f35957;">{ orderDeatil.price1 + '元' }</Text>
          </View>
          <View className="pListTit">
            <Text style="color: #f35957;">超标费用金额</Text>
            <Text></Text>
            <Text></Text>
            <Text style="color: #f35957;">{ orderDeatil.price + '元' }</Text>
          </View>
          <View className="pListTit">
            <Text style="color: #f35957;">优惠金额</Text>
            <Text></Text>
            <Text></Text>
            <Text style="color: #f35957;">{ orderDeatil.price2 + '元' }</Text>
          </View>
          <Text style="margin-top:10rpx;padding-top:10rpx;border-top:1rpx dashed #ccc;display:block;">超标备注：</Text>
          <View className="note">
            <Text>{ orderDeatil.sdcostnote }</Text>
          </View>
        </View>
        <View className="submitInfo">
          <Text style="margin-top:10px;display:inline-block;">勘察图片：</Text>
          <View className="imgList">
            { surveyImgList }
          </View>
          <Text>勘察备注：</Text>
          <View className="note">
            <Text>{ orderDeatil.survey_note }</Text>
            {/* <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' disabled maxLength={200} height={300} value={orderDeatil.survey_note}/> */}
          </View>
          <Text style="margin-top:10px;display:inline-block;">条形码照片：</Text>
          <View className="imgList">
            { installImgList }
          </View>
          <Text style="margin-top:10px;display:inline-block;">电源点照片：</Text>
          <View className="imgList">
            { installImgList2 }
          </View>
          <Text style="margin-top:10px;display:inline-block;">人桩合影照片：</Text>
          <View className="imgList">
            { installImgList3 }
          </View>
          <Text style="margin-top:10px;display:inline-block;">桩前5米照片：</Text>
          <View className="imgList">
            { installImgList4 }
          </View>
          <Text style="margin-top:10px;display:inline-block;">其他照片：</Text>
          <View className="imgList">
            { installImgList5 }
          </View>
          <Text style="margin-top:10px;display:inline-block;">视频</Text>
          {
            (orderDeatil.installList6[0]) && <View className="imgList">
              <Video
                src={orderDeatil.installList6[0].url}
                controls={true}
                autoplay={false}
                initialTime='0'
                id='video'
                loop={false}
                muted={false}
              />
            </View>
          }
          <Text>安装备注：</Text>
          <View className="note">
          <Text>{ orderDeatil.install_note }</Text>
            {/* <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' disabled maxLength={200} height={300} value={orderDeatil.install_note}/> */}
          </View>
        </View>
        <View className="evaluate">
          {
            (orderDeatil.evaluate_status == 0 && (orderDeatil.fstatus == 5 || orderDeatil.fstatus == 6 || orderDeatil.fstatus == 7 || orderDeatil.fstatus == 8)) && <Text>扫描下方二维码对师傅进行评价</Text>
          }
          <canvas id="evaluate_qrcode" canvas-id="evaluate_qrcode"></canvas>
        </View>
      </View>
    )
  }
}

export default Detail
