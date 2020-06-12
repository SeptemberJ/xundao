import Taro, { Component } from '@tarojs/taro'
import { View, Text, Canvas, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtImagePicker, AtButton, AtTextarea } from 'taro-ui'
import './index.scss'
import { changeTab } from '../../actions/counter'
import send from '../../service/api'

var COS = require('cos-wx-sdk-v5')


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
      files: [],
      wholeFiles: [], // 完整图片list占位
      timeStamp: [], // 图片命名时间戳list占位
      note: ''
    }
  }
  componentWillMount () {
    this.setState({
      id: this.$router.params.id,
      workno: this.$router.params.workno
    })
  }
  componentDidShow () {
    // 获取定位
    this.checkAuth()
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

  submit2 = () => {
    // const pages = getCurrentPages(); //获取当前页面js里面的pages里的所有信息。
    // const prevPage = pages[pages.length - 2]; 
    // prevPage.setData({  // 将我们想要传递的参数在这里直接setData。上个页面就会执行这里的操作。
    //   currentTabIdx: 1,
    // })
    // Taro.navigateBack()
    Taro.redirectTo({
      url: '/pages/order/index?tab=' + 1
    })
  }

  submit = () => {
    // 校验
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
    send.post('cos/uploadSurvey', {id: this.state.id, surveyNote: this.state.note, fcontent: JSON.stringify(fcontent)}).then((res) => {
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
        <View className="picList">
          <Text>请选择要上传的图片</Text>
          <AtImagePicker
            sourceType={['camera']}
            files={this.state.files}
            onChange={this.onChange}
            onImageClick={this.onImageClick}
          />
        </View>
        <View className="note">
          <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={200} height={300} autoHeight placeholder='请输入勘察备注' value={this.state.note} onChange={e => this.changeNote(e)}/>
        </View>
        <View style="width:90%;margin-top:40px;">
          <AtButton loading={this.state.loading} type='primary' onClick={this.submit}>提交</AtButton>
        </View>
      </View>
    )
  }
}
