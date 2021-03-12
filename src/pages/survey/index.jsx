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
      ftype: '',
      curDate: '',
      sendbzdate: '请选择',
      plandate: '请选择',
      confirmdate: '请选择',
      files: [],
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
          // let tmpWholeFiles = []
          // let tmpTimeStamp = []
          let tmpSurveyList = res.data.data.surveyList.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            // let fileName  = item.fbojectname.split('/')[2]
            // tmpTimeStamp.push(fileName.split('_')[0])
            // tmpWholeFiles.push(url)
            let obj = {
              file: {
                path: url
              },
              fileName: item.fbojectname,
              url: url
            }
            return obj
          })
          tmpInfo.surveyList = tmpSurveyList
          this.setState({
            isbz: tmpInfo.fisbz,
            ftype: tmpInfo.ftype === '替换桩' ? '1' : (tmpInfo.ftype === '新建桩' ? '0' : ''),
            files: tmpSurveyList,
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
    // console.log(doType, index, files)
    let stateFiles = this.state.files
    
    // 添加图片
    if (doType == 'add') {
      files.map((item, idx) => {
        if (idx >= stateFiles.length) {
          // 新增的才需要上传
          let newestFile = item
          // 上传COS
          cos.postObject({
            Bucket: 'xundao-1302369589',
            Region: 'ap-shanghai',
            Key: this.state.workno + '/survey/' + item.file.path.slice(11),
            FilePath: item.file.path,
            onProgress: (info) => {
              // console.log(JSON.stringify(info))
            }
          }, (err, data) => {
            if (data) {
              stateFiles.push({...newestFile, ...{fileName: this.state.workno + '/survey/' + item.file.path.slice(11)}})
              this.setState({
                files: stateFiles
              })
            }
            if (err) {
              Taro.showModal({
                title: '提示',
                content: `图片上传失败`,
                showCancel: false
              })
            }
          })
        }
      })
    }
    // 移除图片
    if (doType == 'remove') {
      this.setState({
        files: files
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
  handleChange_ftype (value) {
    this.setState({
      ftype: value
    })
    if (value != 1) {
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
    this.state.files.map((item, idx) => {
      if (item) {
        fcontent.push({
          fobjectname: item.fileName,
          lng: this.state.longitude,
          lat: this.state.latitude
        })
      }
    })
    send.post('cos/uploadSurvey',{survey: JSON.stringify({fstatus: '1', id: this.state.id, surveyNote: this.state.note, isbz: this.state.isbz, ftype: this.state.ftype, fcontent: JSON.stringify(fcontent)})}).then((res) => {
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
    if (this.state.ftype == '') {
      Taro.showToast({
        title: '请先选择建桩类型',
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
    this.state.files.map((item, idx) => {
      if (item) {
        fcontent.push({
          fobjectname: item.fileName,
          lng: this.state.longitude,
          lat: this.state.latitude
        })
      }
    })
    send.post('cos/uploadSurvey',{survey: JSON.stringify({id: this.state.id, surveyNote: this.state.note, isbz: this.state.isbz, ftype: this.state.ftype, fcontent: JSON.stringify(fcontent)})}).then((res) => {
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
        <View className="contentBar">
          <Text className="columnTit">建桩类型</Text>
          <AtRadio
            options={[
              { label: '新建桩', value: '0' },
              { label: '替换桩', value: '1' }
            ]}
            value={this.state.ftype}
            onClick={this.handleChange_ftype.bind(this)}
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
