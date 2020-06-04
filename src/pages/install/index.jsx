import Taro, { Component } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtImagePicker, AtButton, AtTextarea, AtRadio, AtInput } from 'taro-ui'
import './index.scss'
import { changeTab } from '../../actions/counter'
import send from '../../service/api'
var COS = require('cos-wx-sdk-v5')
var cos = new COS({
  SecretId: 'AKIDQdcMwIWBF5TcWCk3IWXO3UihRvKVf8tR',
  SecretKey: 'ThfOuKWTDhvt89uPekbCXhgT0A7pHXYK',
});
// cos.getService(function (err, data) {
//   console.log('getService---')
//   console.log(data && data.Buckets);
// });

@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  changeTab (tabIdx) {
    dispatch(changeTab(tabIdx))
  }
}))
export default class SubmitAZ extends Component {

  config = {
    navigationBarTitleText: '安装结果提交'
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
      SNCode: '',
      note: '',
      isbz: '',
      cable: '',
      pipe: '',
      fmeter: ''
    }
  }
  componentWillMount () {
    this.setState({
      id: this.$router.params.id,
      workno: this.$router.params.workno
    })
  }
  componentDidShow () {
    // 检查定位
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
      // 上传图片到COS
      cos.postObject({
        Bucket: 'qpy1992-1257359561',
        Region: 'ap-shanghai',
        Key: this.state.workno + '/install/' + curTimeStamp + '_' + oldWholeFiles.length + '.png',
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
                    console.log(e)
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
    // if (!this.state.SNCode) {
    //   Taro.showToast({
    //     title: '请先扫SN码',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    if (this.state.isbz == '') {
      Taro.showToast({
        title: '请先选择是否报桩',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.cable == '') {
      Taro.showToast({
        title: '请先选择电缆',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.pipe == '') {
      Taro.showToast({
        title: '请先选择管材',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (!this.state.fmeter) {
      Taro.showToast({
        title: '请先输入米数',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // 校验通过
    let fcontent = []
    let installInfo = {
      id: this.state.id,
      installNote: this.state.note,
      sn: this.state.SNCode,
      isbz: this.state.isbz == "null" ? null : this.state.isbz,
      cable: this.state.cable,
      pipe: this.state.pipe,
      fmeter: this.state.fmeter,
      fcontent: []
    }
    this.setState({
      loading: true
    })
    this.state.wholeFiles.map((item, idx) => {
      if (item) {
        fcontent.push({
          fobjectname: this.state.workno + '/install/' + this.state.timeStamp[idx] + '_' + (idx + 1) + '.png',
          lng: this.state.longitude,
          lat: this.state.latitude
        })
      }
    })
    installInfo.fcontent = JSON.stringify(fcontent)
    send.post('cos/uploadInstall', {install: JSON.stringify(installInfo)}).then((res) => {
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
            url: '/pages/order/index?tab=' + 2
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

  handleChange_isbz (value) {
    this.setState({
      isbz: value
    })
  }
  handleChange_cable (value) {
    this.setState({
      cable: value
    })
  }
  handleChange_pipe (value) {
    this.setState({
      pipe: value
    })
  }

  handleChange_fmeter (value) {
    this.setState({
      fmeter: value
    })
  }

  scanCode = () => {
    Taro.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        this.setState({
          SNCode: res.result
        })
      }
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
        <View className="SNCode">
          <Text>SN码：{ this.state.SNCode }</Text>
          <AtButton type='primary' size="small" onClick={this.scanCode}>点击扫码</AtButton>
        </View>
        <View className="contentBar">
          <Text className="columnTit">是否报桩</Text>
          <AtRadio
            options={[
              { label: '是', value: '1'},
              { label: '否', value: 'null' }
            ]}
            value={this.state.isbz}
            onClick={this.handleChange_isbz.bind(this)}
          />
        </View>
        <View className="contentBar">
          <Text className="columnTit">电缆</Text>
          <AtRadio
            options={[
              { label: 'YJV 3*6', value: '0'},
              { label: 'YJV 3*4', value: '1' }
            ]}
            value={this.state.cable}
            onClick={this.handleChange_cable.bind(this)}
          />
        </View>
        <View className="contentBar">
          <Text className="columnTit">管材</Text>
          <AtRadio
            options={[
              { label: 'YJV 3*6', value: '0'},
              { label: 'YJV 3*4', value: '1' }
            ]}
            value={this.state.pipe}
            onClick={this.handleChange_pipe.bind(this)}
          />
        </View>
        <View className="SNCode">
          <AtInput style="text-align:right;"
            name='fmeter'
            title='米数：'
            confirmType="完成"
            type='digit'
            placeholder='请输入米数'
            value={this.state.fmeter}
            onChange={this.handleChange_fmeter.bind(this)}
          />
        </View>
        <View className="note">
          <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={200} height={300} autoHeight placeholder='请输入安装备注' value={this.state.note} onChange={e => this.changeNote(e)}/>
        </View>
        <View style="width:90%;margin-top:40px;">
          <AtButton loading={this.state.loading} type='primary' onClick={this.submit}>提交</AtButton>
        </View>
      </View>
    )
  }
}
