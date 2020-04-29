import Taro, { Component } from '@tarojs/taro'
import { View, Button, Text, Canvas, Image } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { formatTime } from '../../utils/index'
import { AtNavBar, AtImagePicker } from 'taro-ui'
import './index.scss'

@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
}))
export default class Picture extends Component {

  config = {
    navigationBarTitleText: '图片'
  }

  constructor(props) {
    super(props)
    this.state = {
      files: [],
      img: 'https://hbimg.huabanimg.com/a111ea2e9fc5024d15194c7e022ecf28f66470b64759-0Ky12e_sq75sf'
    }
  }
  onChange = (files, doType, index) => {
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
            height = maxHeight// maxHeight.toFixed(2);
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
                  // files[0].file.path = res.tempFilePath
                  that.setState({
                    img: res.tempFilePath,
                    files: files
                  })
                  // Taro.hideToast()
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
  handleClickBack = () => {
    Taro.redirectTo({
      url: '/pages/index/index'
    })
  }

  render () {
    const style = {
      paddingTop: Taro.$navBarMarginTop + 'px'
    }
    return (
      <View className='Image' style={style}>
        <AtNavBar
          onClickLeftIcon={this.handleClickBack}
          color='#000'
          title='照片上传'
          leftIconType='chevron-left'
        />
        <AtImagePicker
          sourceType={['camera']}
          files={this.state.files}
          onChange={this.onChange}
          onImageClick={this.onImageClick}
        />
        <Canvas class='canvas' style="width:100%;height:100vh;top:30px;opacity: 0;" canvasId="firstCanvas"></Canvas>
      </View>
    )
  }
}
