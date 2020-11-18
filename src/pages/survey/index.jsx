import Taro, { Component } from '@tarojs/taro'
import { View, Text, Canvas, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtImagePicker, AtButton, AtTextarea, AtRadio } from 'taro-ui'
import './index.scss'
import { changeTab } from '../../actions/counter'
import {formatTime} from '../../utils/index'
import send from '../../service/api'

var COS = require('cos-wx-sdk-v5')
var cos = new COS({
  SecretId: 'AKIDiA5qKXzAG6ubMqH8vIQsjbDZetTmnQhm',
  SecretKey: 'xf0mHsCcnmNjocZFrCJAg81dyZuy812n',
})

@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  changeTab (tabIdx ) {
    dispatch(changeTab(tabIdx))
  }
}))
export default class SubmitKC extends Component {

  config = {
    navigationBarTitleText: '勘察结果提交'
  }

  constructor(props) {
    super(props)
    this.state = {
      id: '',
      workno: '',
      latitude: '',
      longitude: '',
      loading: false,
      isbz: '',
      curDate: '',
      sendbzdate: '请选择',
      plandate: '请选择',
      confirmdate: '请选择',
      files: [],
      wholeFiles: [], // 完整图片list占位
      timeStamp: [], // 图片命名时间戳list占位
      note: ''
    }
  }
  componentWillMount () {
    this.setState({
      curDate: formatTime(new Date()),
      id: this.$router.params.id,
      workno: this.$router.params.workno
    })
  }
  componentDidMount () {
    this.getOrdeDetail(this.state.id)
  }
  componentDidShow () {
    // 获取定位
    this.checkAuth()
  }
  getOrdeDetail = (id) => {
    send.post('cos/orderDetail', {id: id}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          let tmpInfo = {... res.data.data}
          let tmpWholeFiles = []
          let tmpTimeStamp = []
          let tmpSurveyList = res.data.data.surveyList.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            let fileName  = item.fbojectname.split('/')[2]
            tmpTimeStamp.push(fileName.split('_')[0])
            tmpWholeFiles.push(url)
            let obj = {
              file: {
                path: url
              },
              url: url
            }
            return obj
          })
          tmpInfo.surveyList = tmpSurveyList
          this.setState({
            isbz: tmpInfo.fisbz,
            files: tmpSurveyList,
            wholeFiles: tmpWholeFiles,
            timeStamp: tmpTimeStamp,
            note: tmpInfo.survey_note
          })
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
  onChange = (files, doType, index) => {
    console.log(doType, index, files)
    let removePathIdx = null
    let len = files.length
    let oldWholeFiles = [...this.state.wholeFiles]
    let oldTimeStamp = [...this.state.timeStamp]
    let curTimeStamp = (new Date()).getTime()
    
    // 添加图片
    if (doType == 'add') {
      let newestFile = files[len - 1]
      oldWholeFiles.push(newestFile.url)
      oldTimeStamp.push(curTimeStamp)
      this.setState({
        files: files,
        wholeFiles: oldWholeFiles,
        timeStamp: oldTimeStamp
      })
      
      cos.postObject({
        Bucket: 'xundao-1302369589',
        Region: 'ap-shanghai',
        Key: this.state.workno + '/survey/' + curTimeStamp + '_' + oldWholeFiles.length + '.png',
        FilePath: (files[files.length - 1]).file.path,
        onProgress: function (info) {
          // console.log(JSON.stringify(info))
        }
      }, function (err, data) {
        // console.log(err || data)
      })
    }
    // 移除图片
    if (doType == 'remove') {
      removePathIdx = oldWholeFiles.indexOf(this.state.files[index].url)
      oldWholeFiles.splice(removePathIdx, 1, null)
      oldTimeStamp.splice(removePathIdx, 1, null)
      this.setState({
        files: files,
        wholeFiles: oldWholeFiles,
        timeStamp: oldTimeStamp
      })
    }
  }

  checkAuth = () => {
    Taro.getSetting({
      success: (res) => {
        console.log(res)
        if (!res.authSetting['scope.userLocation']) {
          Taro.showModal({
            title: '授权请求',
            content: `尚未允许使用您的位置信息，请点击确认进行授权`,
            showCancel: false,
            success (e) {
              if (e.confirm) {
                Taro.openSetting({
                  success (e) {
                    // console.log(e)
                  }
                })
              }
            }
          })
        } else {
          this.getLocation()
        }
      }
    })
  }

  // 图片预览
  onImageClick = (index, file) => {
    let urls = this.state.files.map(item => {
      return item.url
    })
    Taro.previewImage({
      current: file.url,
      urls: urls
    })
  }

  handleChange_isbz (value) {
    this.setState({
      isbz: value
    })
    if (value != 2) {
      this.setState({
        sendbzdate: '请选择',
        plandate: '请选择',
        confirmdate: '请选择'
      })
    }
  }

  onDateChange_send = (e) => {
    this.setState({
      sendbzdate: e.detail.value
    })
  }

  onDateChange_plan = (e) => {
    this.setState({
      plandate: e.detail.value
    })
  }

  onDateChange_confirm = (e) => {
    this.setState({
      confirmdate: e.detail.value
    })
  }

  saveTemporary = () => {
    let fcontent = []
    this.setState({
      loading: true
    })
    this.state.wholeFiles.map((item, idx) => {
      if (item) {
        fcontent.push({
          fobjectname: this.state.workno + '/survey/' + this.state.timeStamp[idx] + '_' + (idx + 1) + '.png',
          lng: this.state.longitude,
          lat: this.state.latitude
        })
      }
    })
    send.post('cos/uploadSurvey',{survey: JSON.stringify({fstatus: '1', id: this.state.id, surveyNote: this.state.note, isbz: this.state.isbz, fcontent: JSON.stringify(fcontent)})}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          Taro.showToast({
            title: '暂存成功',
            icon: 'success',
            duration: 1500
          }).then(
            this.setState({
              loading: false
            })
          )
          Taro.redirectTo({
            url: '/pages/order/index?tab=' + 0
          })
          break
        default:
          Taro.showToast({
            title: '暂存失败',
            icon: 'none',
            duration: 1500
          }).then(
            this.setState({
              loading: false
            })
          )
      }
    })
  }

  submit = () => {
    // 校验
    if (this.state.isbz == '') {
      Taro.showToast({
        title: '请先选择报装类型',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // if (this.state.isbz == 2 && this.state.sendbzdate == '请选择') {
    //   Taro.showToast({
    //     title: '请先选择递交报桩资料日期',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    // if (this.state.isbz == 2 && this.state.plandate == '请选择') {
    //   Taro.showToast({
    //     title: '请先选择出具方案日期',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    // if (this.state.isbz == 2 && this.state.confirmdate == '请选择') {
    //   Taro.showToast({
    //     title: '请先选择客户确认方案日期',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    if (this.state.files.length == 0) {
      Taro.showToast({
        title: '请先选择要上传的图片',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // 校验通过
    let fcontent = []
    this.setState({
      loading: true
    })
    this.state.wholeFiles.map((item, idx) => {
      if (item) {
        fcontent.push({
          fobjectname: this.state.workno + '/survey/' + this.state.timeStamp[idx] + '_' + (idx + 1) + '.png',
          lng: this.state.longitude,
          lat: this.state.latitude
        })
      }
    })
    send.post('cos/uploadSurvey',{survey: JSON.stringify({id: this.state.id, surveyNote: this.state.note, isbz: this.state.isbz, fcontent: JSON.stringify(fcontent)})}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          Taro.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 1500
          }).then(
            this.setState({
              loading: false
            })
          )
          Taro.redirectTo({
            url: '/pages/order/index?tab=' + 1
          })
          break
        default:
          Taro.showToast({
            title: '提交失败',
            icon: 'none',
            duration: 1500
          }).then(
            this.setState({
              loading: false
            })
          )
      }
    })
  }

  changeNote = (note) => {
    this.setState({
      note
    })
  }

  getLocation = () => {
    Taro.getLocation({
      type: 'wgs84',
      success: (res) => {
        this.setState({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail:  (err) => {
        console.log('err', err)
      }
    })
  }

  render () {
    return (
      <View className='Image'>
        <View className="contentBar">
          <Text className="columnTit">是否报装</Text>
          <AtRadio
            options={[
              { label: '无需报装', value: '0' },
              { label: '客户自报装', value: '1' },
              { label: '需要报装', value: '2' }
            ]}
            value={this.state.isbz}
            onClick={this.handleChange_isbz.bind(this)}
          />
        </View>
        {/* {
          this.state.isbz == 2 && <View className="carType">
          <Text>递交报装资料日期：</Text>
          <Picker mode='date' onChange={this.onDateChange_send} start={this.state.curDate}>
            { this.state.sendbzdate }
          </Picker>
        </View>
        }
        {
          this.state.isbz == 2 && <View className="carType">
            <Text>出具方案日期：</Text>
            <Picker mode='date' onChange={this.onDateChange_plan} start={this.state.curDate}>
              { this.state.plandate }
            </Picker>
          </View>
        }
        {
          this.state.isbz == 2 && <View className="carType">
            <Text>用户确认方案日期：</Text>
            <Picker mode='date' onChange={this.onDateChange_confirm} start={this.state.curDate}>
              { this.state.confirmdate }
            </Picker>
          </View>
        } */}
        <View className="picList">
          <Text>请选择要上传的图片</Text>
          <AtImagePicker
            sourceType={['album', 'camera']}
            files={this.state.files}
            onChange={this.onChange}
            onImageClick={this.onImageClick}
          />
        </View>
        <View className="note">
          <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={200} height={300} autoHeight placeholder='请输入勘察备注' value={this.state.note} onChange={e => this.changeNote(e)}/>
        </View>
        <View className="btBlock">
          <AtButton className="bt" loading={this.state.loading} disabled={this.state.loading} type='primary' onClick={this.submit}>提交</AtButton>
          <AtButton className="bt" loading={this.state.loading} disabled={this.state.loading} type='secondary' onClick={this.saveTemporary}>暂存</AtButton>
        </View>
      </View>
    )
  }
}
