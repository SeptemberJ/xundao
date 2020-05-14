import Taro, { Component } from '@tarojs/taro'
import { View, Text, Canvas, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { formatTime } from '../../utils/index'
import { AtImagePicker, AtButton, AtTextarea } from 'taro-ui'
import './index.scss'
import send from '../../service/api'
var COS = require('cos-wx-sdk-v5')
var cos = new COS({
  SecretId: 'AKIDQdcMwIWBF5TcWCk3IWXO3UihRvKVf8tR',
  SecretKey: 'ThfOuKWTDhvt89uPekbCXhgT0A7pHXYK',
});
// cos.putBucket({
//   Bucket: 'liubaitest-1257359561', // qpy1992-1257359561
//   Region: 'ap-shanghai',
// }, function (err, data) {
//   console.log('err---')
//   console.log(err || data);
// })
cos.getService(function (err, data) {
  console.log('getService---')
  console.log(data && data.Buckets);
});

@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
}))
export default class Picture extends Component {

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
      note: '',
      img: 'https://hbimg.huabanimg.com/a111ea2e9fc5024d15194c7e022ecf28f66470b64759-0Ky12e_sq75sf'
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
    this.setState({
      files
    })
    console.log(index, files, files.length, (files[files.length - 1]).file.path)
    cos.postObject({
      Bucket: 'qpy1992-1257359561',
      Region: 'ap-shanghai',
      Key: this.state.workno + '/survey/' + files.length + '.png',
      FilePath: (files[files.length - 1]).file.path,
      onProgress: function (info) {
        console.log('onProgress---');
        console.log(JSON.stringify(info));
      }
    }, function (err, data) {
      console.log('function back---');
      console.log(err || data);
    })
    // if (doType == 'remove') {
    //   this.setState({
    //     files
    //   })
    // } else {
    //   var that = this
    //   // 绘制画布
    //   Taro.getImageInfo({
    //     src: files[files.length - 1].url,
    //     success: (res) => {
    //       console.log(res)
    //       // cos.postObject({
    //       //     Bucket: 'qpy1992-1257359561',
    //       //     Region: 'ap-shanghai',
    //       //     Key: 'workno/survey/1.png',
    //       //     FilePath: filePath,
    //       //     onProgress: function (info) {
    //       //         console.log(JSON.stringify(info));
    //       //     }
    //       // }, function (err, data) {
    //       //     console.log(err || data);
    //       // })
    //     }
    //   })
    // }
  }
  onChange2 = (files, doType, index) => {
    console.log(index, files)
    if (doType == 'remove') {
      this.setState({
        files
      })
    } else {
      var that = this
      // 绘制画布
      Taro.getImageInfo({
        src: files[files.length - 1].url,
        success: (res) => {
          console.log(res)
          // 图片比列
          var maxWidth = Taro.$windowWidth
          var maxHeight = Taro.$windowHeight
          var width = res.width, height = res.height;
          if (width > maxWidth) {
            //超出限制宽度
            height = (maxWidth / width) * height;
            width = parseInt(maxWidth);
          }
          if (res.height > maxHeight && maxHeight) {
            //超出限制高度
            // var ratio = that.data.thumbHeight / res.height;//计算比例
            width = (maxHeight / height) * width.toFixed(2);
            height = maxHeight // maxHeight.toFixed(2);
          }
          console.log(maxWidth, maxHeight, width, height)
          let ctx = Taro.createCanvasContext('firstCanvas', this.$scope)
          ctx.drawImage(res.path, 0, 0, width, height)
          ctx.setFillStyle('#000000')
          ctx.setFontSize(12)
          ctx.fillText(formatTime(new Date()), 10, 20)
          ctx.stroke()
          ctx.draw(false, () => {
            setTimeout(()=> {
              Taro.canvasToTempFilePath({
                canvasId: 'firstCanvas',
                success: (res) => {
                  console.log(res)
                  files[files.length - 1].url = res.tempFilePath
                  that.setState({
                    img: res.tempFilePath,
                    files: files
                  })
                  // cos.postObject({
                  //     Bucket: 'qpy1992-1257359561',
                  //     Region: 'ap-shanghai',
                  //     Key: '目标路径/' + filename,
                  //     FilePath: filePath,
                  //     onProgress: function (info) {
                  //         console.log(JSON.stringify(info));
                  //     }
                  // }, function (err, data) {
                  //     console.log(err || data);
                  // })
                },
                fail: (res) => {
                  console.log(res)
                }
              })
            }, 600)
          })
        }
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
  checkAuth2 = () => {
    Taro.getSetting({
      success: (res) => {
        console.log(res)
        if (!res.authSetting['scope.userLocation']) {
          Taro.showModal({
            title: '授权请求',
            content: `尚未允许使用您的位置信息，请点击确认进行授权`,
            success (e) {
              if (e.confirm) {
                Taro.openSetting({
                  success (e) {
                    console.log(e)
                  },
                  fail (err) {
                    console.log('err2', err)
                  }
                })
              }
            }
          })
        }
      }
    })
  }
  onFail = (mes) => {
    console.log(mes)
  }
  onImageClick = (index, file) => {
    let urls = this.state.files.map(item => {
      return item.url
    })
    console.log(urls)
    Taro.previewImage({
      current: file.url,
      urls: urls
    })
  }
  submit = () => {
    this.setState({
      loading: true
    })
    let fcontent = this.state.files.map((item, id) => {
      return {
        fobjectname: this.state.workno + '/survey/' + (id + 1) + '.png',
        lng: this.state.longitude,
        lat: this.state.latitude
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
    const style = {
      paddingTop: Taro.$navBarMarginTop + 'px'
    }
    return (
      <View className='Image' style={style}>
        <View className="picList">
          <Text>请选择要上传的图片{ this.state.workno }</Text>
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
        {/* <Canvas class='canvas' style="width:100%;height:100vh;top:30px;opacity: 0;" canvasId="firstCanvas"></Canvas> */}
      </View>
    )
  }
}
