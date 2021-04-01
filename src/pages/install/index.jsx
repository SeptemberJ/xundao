import Taro, { Component } from '@tarojs/taro'
import { View, Text, Picker } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtImagePicker, AtButton, AtTextarea, AtRadio, AtInput, AtModal, AtIcon } from 'taro-ui'
import './index.scss'
import { changeTab } from '../../actions/counter'
import send from '../../service/api'
var COS = require('cos-wx-sdk-v5')
var cos = new COS({
  SecretId: 'AKIDiA5qKXzAG6ubMqH8vIQsjbDZetTmnQhm',
  SecretKey: 'xf0mHsCcnmNjocZFrCJAg81dyZuy812n',
})

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
      isOpened: false,
      cartype: '',
      hosts: '',
      carTypeList: [],
      selectorChecked: '请选择',
      // carTypeInfo: {detail: {cable: '', pipe: ''}}, // 弹出的电缆和管材信息
      pureInstallList: ['是', '否'],
      pureInstall: '',
      fnumber: '', // 型号
      selectorPost: '', // 立柱fname
      selectorLeakpro: '', // 漏保fname
      post: '', // 立柱fnumber
      leakpro: '', // 漏保fnumber
      postList: [],
      leakList: [],
      latitude: '',
      longitude: '',
      loading: false,
      files1: [], // 1.条形码；2.电源点、3.人桩合影、4.桩前5米、5.其它
      files2: [],
      files3: [],
      files4: [],
      files5: [],
      videoInfo: {url: '', name: ''}, // 视频
      checkSN: 'N', //  Y - 可以为空 N - 不可以为空
      SNCode: '',
      note: '',
      sdcostnote: '',
      isbz: '',
      cable: '请选择',
      pipe: '请选择',
      fmeter: '',
      overPList: [], // 超标项目list
      productions: [],
      overcost: 0, // 超标费用
      discount: 0 // 优惠
    }
  }
  componentWillMount () {
    this.setState({
      id: this.$router.params.id,
      workno: this.$router.params.workno,
      cartype: this.$router.params.cartype,
      hosts: this.$router.params.hosts
    })
    this.getCarTypeList(this.$router.params.cartype, this.$router.params.id, this.$router.params.hosts)
    this.checkSNCode(this.$router.params.id)
    // this.getOrdeDetail(this.$router.params.id)
  }
  componentDidShow () {
    // 检查定位
    this.checkAuth()
  }

  componentDidUpdate(prevProps, prevState) {
    // if (prevState.fmeter !== this.state.fmeter) {
    //   this.setState({
    //     productions: [],
    //     overcost: 0,
    //     discount: 0
    //   })
    //   this.getOverPList(this.state.id, this.state.fmeter)
    // } else {
    //   if (prevState.productions !== this.state.productions) {
    //     this.updateSum(this.state.productions)
    //   }
    // }
  }
  getCurFnumber = (item) => {
    return item.age >= 18;
  }
  getOrdeDetail = (id, carTypeList) => {
    send.post('cos/installDetail', {id: id}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          let cablePipeList = []
          let tmpInfo = {... res.data.data}
          let curType = carTypeList.filter((carType) => {
            return carType.fnumber == tmpInfo.number
          })
          if (curType.length > 0) {
            cablePipeList = curType[0].detail.map(item => {
              item.valueStr = '电缆： ' + item.cable + '\xa0\xa0\xa0|\xa0\xa0\xa0' + '管材： '+ item.pipe
              return item
            })
          }
          
          this.setState({
            fnumber: tmpInfo.number,
            pureInstall: tmpInfo.isinstall,
            SNCode: tmpInfo.sn,
            cablePipeList: cablePipeList,
            post: tmpInfo.post,
            selectorPost: tmpInfo.fpost ? tmpInfo.fpost : '请选择',
            leakpro: tmpInfo.leakpro,
            selectorLeakpro: tmpInfo.fleakpro ? tmpInfo.fleakpro : '请选择',
            cable: tmpInfo.cable ? tmpInfo.cable : '请选择',
            pipe: tmpInfo.pipe ? tmpInfo.pipe : '请选择',
            fmeter: tmpInfo.fmeter,
            overcost: tmpInfo.price,
            discount: tmpInfo.price - tmpInfo.price1,
            note: tmpInfo.install_note,
            sdcostnote: tmpInfo.sdcostnote
          })
          this.setState({
            selectorChecked: curType.length > 0 ? curType[0].fname : '请选择',
            // carTypeInfo: {detail: curType[0].detail},
            postList: curType.length > 0 ? curType[0].postList : [],
            leakList: curType.length > 0 ? curType[0].leakList : [],
            videoInfo: {
              src: tmpInfo.installList6[0] ? tmpInfo.installList6[0].url : '',
              name: tmpInfo.installList6[0] ? tmpInfo.installList6[0].fbojectname : ''
            }
            // isOpened: true
          })
          let tmpSurveyList1 = tmpInfo.installList.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            let obj = {
              file: {
                path: url
              },
              fileName: item.fbojectname,
              url: url
            }
            return obj
          })
          this.setState({
            files1: tmpSurveyList1
          })
          let tmpSurveyList2 = tmpInfo.installList2.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            let obj = {
              file: {
                path: url
              },
              fileName: item.fbojectname,
              url: url
            }
            return obj
          })
          this.setState({
            files2: tmpSurveyList2
          })
          let tmpSurveyList3 = tmpInfo.installList3.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            let obj = {
              file: {
                path: url
              },
              fileName: item.fbojectname,
              url: url
            }
            return obj
          })
          this.setState({
            files3: tmpSurveyList3
          })
          let tmpSurveyList4 = tmpInfo.installList4.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            let obj = {
              file: {
                path: url
              },
              fileName: item.fbojectname,
              url: url
            }
            return obj
          })
          this.setState({
            files4: tmpSurveyList4
          })
          let tmpSurveyList5 = tmpInfo.installList5.map(item => {
            let url = item.url.replace(/[\r\n]/g,"")
            let obj = {
              file: {
                path: url
              },
              fileName: item.fbojectname,
              url: url
            }
            return obj
          })
          this.setState({
            files5: tmpSurveyList5
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
  
  onChange = (type, files, doType, index) => {
    // console.log(doType, index, files, type)
    let stateFiles = this.state['files' + type]
    // 添加图片
    if (doType == 'add') {
      files.map((item, idx) => {
        if (idx >= stateFiles.length) {
          // 新增的才需要上传
          let newestFile = item
          // 上传图片到COS
          cos.postObject({
            Bucket: 'xundao-1302369589',
            Region: 'ap-shanghai',
            Key: this.state.workno + '/install/' + item.file.path.slice(11),
            FilePath: item.file.path,
            onProgress: function (info) {
              // console.log(JSON.stringify(info))
            }
          }, (err, data) => {
            if (data) {
              stateFiles.push({...newestFile, ...{fileName: this.state.workno + '/install/' + item.file.path.slice(11)}})
              switch (type) {
                case 1:
                  this.setState({
                    files1: stateFiles
                  })
                  break
                case 2:
                  this.setState({
                    files2: stateFiles
                  })
                  break
                case 3:
                  this.setState({
                    files3: stateFiles
                  })
                  break
                case 4:
                  this.setState({
                    files4: stateFiles
                  })
                  break
                case 5:
                  this.setState({
                    files5: stateFiles
                  })
                  break
              }
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
      switch (type) {
        case 1:
          this.setState({
            files1: files
          })
          break
        case 2:
          this.setState({
            files2: files
          })
          break
        case 3:
          this.setState({
            files3: files
          })
          break
        case 4:
          this.setState({
            files4: files
          })
          break
        case 5:
          this.setState({
            files5: files
          })
          break
      }
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
  onImageClick = (type, index, file) => {
    let Files = []
    switch (type) {
      case 1:
        Files = this.state.files1
        break
      case 2:
        Files = this.state.files2
        break
      case 3:
        Files = this.state.files3
        break
      case 4:
        Files = this.state.files4
        break
      case 5:
        Files = this.state.files5
        break
    }
    let urls = Files.map(item => {
      return item.url
    })
    Taro.previewImage({
      current: file.url,
      urls: urls
    })
  }

  // 视频
  chooseVideo = () => {
    wx.chooseVideo({
      maxDuration: 20,
      success: (res) => {
        console.log(res)
        if (res.duration > 20) {
          Taro.showToast({
            title: '视频时长太长,最多20秒!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        cos.postObject({
          Bucket: 'xundao-1302369589',
          Region: 'ap-shanghai',
          Key: this.state.workno + '/install/' + res.tempFilePath.slice(11),
          FilePath: res.tempFilePath,
          onProgress: (info) => {
            // console.log(JSON.stringify(info))
          }
        }, function (err, data) {
          console.log(err || data)
          if (data) {
            this.setState({
              videoInfo: {
                src: res.tempFilePath,
                name: this.state.workno + '/install/' + res.tempFilePath.slice(11),
              }
            })
          }
          if (err) {
            Taro.showModal({
              title: '提示',
              content: `视频上传失败`,
              showCancel: false
            })
          }
        })
      }
    })
  }

  saveTemporary = () => {
    // 什么都没填写时不能暂存
    if (this.state.files1.length == 0 && this.state.files2.length == 0 && this.state.files3.length == 0 && this.state.files4.length == 0 && this.state.selectorChecked == '请选择' && this.state.selectorPost == '请选择' && this.state.selectorLeakpro == '请选择' && this.state.cable == '请选择' && this.state.pipe == '请选择' && !this.state.fmeter) {
      Taro.showToast({
        title: '没有填写任何内容无法暂存!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // 校验通过
    let fcontent = []
    let arrIdx = [1, 2, 3, 4, 5]
    let costTmp = this.state.productions.map(item => {
      return {
        fmodelcode: item.fmodelcode,
        fnum: item.unit,
        fprice: item.fprice
      }
    })
    let installInfo = {
      fstatus: '2',
      id: this.state.id,
      installNote: this.state.note,
      sdcostnote: this.state.sdcostnote,
      ispure: this.state.pureInstall,
      sn: this.state.SNCode,
      // isbz: this.state.isbz == "null" ? null : this.state.isbz,
      cable: this.state.cable === '请选择' ? '' : this.state.cable,
      pipe: this.state.pipe === '请选择' ? '': this.state.pipe ,
      fmeter: this.state.fmeter,
      fnumber: this.state.fnumber,
      post: this.state.selectorPost === '请选择' ? null : (this.state.selectorPost === '无' ? '' : this.state.post),
      leakpro: this.state.selectorLeakpro === '请选择' ? null : (this.state.selectorLeakpro === '无' ? '' : this.state.leakpro),
      price: this.state.overcost, // 超标费用
      price1: this.state.overcost - this.state.discount, // 实收
      price2: this.state.discount, // 优惠
      isinstall: this.state.pureInstall,
      fcontent: [],
      cost: JSON.stringify(costTmp)
    }
    this.setState({
      loading: true
    })
    arrIdx.map(idx => {
      let arrFiles = this.state['files' + idx ]
        if (arrFiles.length  > 0) {
          arrFiles.map((item) => {
            if (item) {
              fcontent.push({
                fobjectname: item.fileName,
                lng: this.state.longitude,
                lat: this.state.latitude,
                dirct: idx
              })
            }
          })
        }
    })
    if (this.state.videoInfo.src) {
      fcontent.push({
        fobjectname: this.state.videoInfo.name,
        lng: this.state.longitude,
        lat: this.state.latitude,
        dirct: 6
      })
    }
    installInfo.fcontent = JSON.stringify(fcontent)
    // console.log(fcontent)
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

  submit = () => {
    // 校验
    if (this.state.files1.length == 0) {
      Taro.showToast({
        title: '请先选择要上传的条形码照片',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.files2.length == 0) {
      Taro.showToast({
        title: '请先选择要上传的电源点照片',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.files3.length == 0) {
      Taro.showToast({
        title: '请先选择要上传的人桩合影照片',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.files4.length == 0) {
      Taro.showToast({
        title: '请先选择要上传的桩前5米照片',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // if (this.state.files5.length == 0) {
    //   Taro.showToast({
    //     title: '请先选择其他照片',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    if (this.state.selectorChecked == '请选择') {
      Taro.showToast({
        title: '请先选择型号',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.selectorPost == '请选择') {
      Taro.showToast({
        title: '请先选择立柱',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.selectorLeakpro == '请选择') {
      Taro.showToast({
        title: '请先选择漏保',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.checkSN == 'Y' && this.state.pureInstall == '否' && !this.state.SNCode) {
      Taro.showToast({
        title: '请先扫SN码',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.cable == '请选择') {
      Taro.showToast({
        title: '请先选择电缆',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.pipe == '请选择') {
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
    // if (this.state.total === '') {
    //   Taro.showToast({
    //     title: '请先输入实际费用',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    // 校验通过
    let fcontent = []
    let arrIdx = [1, 2, 3, 4, 5]
    let costTmp = this.state.productions.map(item => {
      return {
        fmodelcode: item.fmodelcode,
        fnum: item.unit,
        fprice: item.fprice
      }
    })
    let installInfo = {
      id: this.state.id,
      installNote: this.state.note,
      sdcostnote: this.state.sdcostnote,
      ispure: this.state.pureInstall,
      sn: this.state.SNCode,
      // isbz: this.state.isbz == "null" ? null : this.state.isbz,
      cable: this.state.cable,
      pipe: this.state.pipe,
      fmeter: this.state.fmeter,
      fnumber: this.state.fnumber,
      post: this.state.selectorPost === '无' ? '' : this.state.post,
      leakpro: this.state.selectorLeakpro === '无' ? '' : this.state.leakpro,
      price: this.state.overcost, // 超标费用
      price1: this.state.overcost - this.state.discount, // 实收
      price2: this.state.discount, // 优惠
      isinstall: this.state.pureInstall,
      fcontent: [],
      cost: JSON.stringify(costTmp)
    }
    this.setState({
      loading: true
    })
    arrIdx.map(idx => {
      let arrFiles = this.state['files' + idx ]
        if (arrFiles.length  > 0) {
          arrFiles.map((item) => {
            if (item) {
              fcontent.push({
                fobjectname: item.fileName,
                lng: this.state.longitude,
                lat: this.state.latitude,
                dirct: idx
              })
            }
          })
        }
    })
    if (this.state.videoInfo.src) {
      fcontent.push({
        fobjectname: this.state.videoInfo.name,
        lng: this.state.longitude,
        lat: this.state.latitude,
        dirct: 6
      })
    }
    installInfo.fcontent = JSON.stringify(fcontent)
    // console.log(fcontent)
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

  changeCostNote = (sdcostnote) => {
    this.setState({
      sdcostnote
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
    // this.setState({
    //   fmeter: value
    // })
    // this.getOverPList(this.state.id, value)
  }

  handleBulr_fmeter (value) {
    this.setState({
      fmeter: value
    })
    // this.getOverPList(this.state.id, value)
  }

  handleChange_fnum (idx, value) {
    const oldProductions = [...this.state.productions]
    oldProductions[idx].unit = value
    this.setState({
      productions: oldProductions
    })
  }

  handleChange_fprice (idx, value) {
    const oldProductions = [...this.state.productions]
    oldProductions[idx].fprice = value
    this.setState({
      productions: oldProductions
    })
  }

  updateSum (data) {
    let tmpSum = 0
    data.map(item =>{
      tmpSum += (item.fprice === '' ? 0 : Number(item.fprice))
    })
    this.setState({
      sum: tmpSum
    })
  }

  handleChange_overcost (val) {
    this.setState({
      overcost: val
    })
  }

  handleChange_discount (val) {
    this.setState({
      discount: val
    })
  }

  onAddOne = e => {
    const old = [...this.state.productions]
    const selector = this.state.overPList[e.detail.value]
    // selector.fnum = ''
    // selector.fprice = ''
    this.setState({
      productions: [...old, ...[selector]]
    })
  }

  onCarTypeChange = e => {
    const selector = this.state.carTypeList[e.detail.value]
    let cablePipeList = selector.detail.map(item => {
      item.valueStr = '电缆： ' + item.cable + '\xa0\xa0\xa0|\xa0\xa0\xa0' + '管材： '+ item.pipe
      return item
    })
    this.setState({
      selectorChecked: selector.fname,
      // carTypeInfo: selector,
      cablePipeList: cablePipeList,
      fnumber: selector.fnumber,
      postList: selector.postList,
      leakList: selector.leakList,
      selectorPost: '请选择',
      selectorLeakpro: '请选择',
      cable: '请选择',
      pipe: '请选择',
      // isOpened: true
    })
  }
  // 电缆和管材选择切换
  handleChange_cable_pipe = e => {
    const selector = this.state.cablePipeList[e.detail.value]
    this.setState({
      cable: selector.cable,
      pipe: selector.pipe,
      pureInstall: selector.isinstall,
    })
  }
  // 是否纯安装 否 可以切换选择
  onPureInstallChange = e => {
    const selector = this.state.pureInstallList[e.detail.value]
    this.setState({
      pureInstall: selector
    })
  }
  onPostChange = e => {
    const selector = this.state.postList[e.detail.value]
    this.setState({
      selectorPost: selector.fname,
      post: selector.fnumber
    })
  }

  onLeakChange = e => {
    const selector = this.state.leakList[e.detail.value]
    this.setState({
      selectorLeakpro: selector.fname,
      leakpro: selector.fnumber
    })
  }
  
  handleConfirmCarType = () => {
    this.setState({
      isOpened: false
    })
  }

  scanCode = () => {
    Taro.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        console.log('scan--', res)
        let SCODE = res.result
        send.post('order/sn', {sn: SCODE}).then((res) => {
          if (res.data.respCode == '-1') {
            Taro.showToast({
              title: res.data.message,
              icon: 'none',
              duration: 1500
            })
          } else {
            this.setState({
              SNCode: SCODE
            })
          }
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

  getCarTypeList = (cartype, id, hosts) => {
    send.post('order/cartype', {ftype: cartype, hosts: hosts}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            carTypeList: res.data.data
          })
          this.getOrdeDetail(id, res.data.data)
          break
        default:
          Taro.showToast({
            title: '车型型号获取失败',
            icon: 'none',
            duration: 1500
          })
      }
    })
  }
  checkSNCode = (id) => {
    send.post('order/nosn', {id: id}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            checkSN: res.data.data
          })
          break
        default:
          Taro.showToast({
            title: 'nosn获取失败',
            icon: 'none',
            duration: 1500
          })
      }
    })
  }

  getOverPList = (id, fmeter) => {
    send.post('order/cost', {id: id, fmeter: fmeter}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            overPList: res.data.data.map(item => {
              item.ifInput = !item.unit
              return item
            })
          })
          break
        default:
          this.setState({
            overPList: []
          })
          // Taro.showToast({
          //   title: '超标项目获取失败',
          //   icon: 'none',
          //   duration: 1500
          // })
      }
    })
  }

  render () {
    const productionList = this.state.productions.map((item, idx) => {
      return <View className="pListTit pLine" key={idx}>
        <Text>{ item.fmodel }</Text>
        <Text>{ item.fmax }</Text>
        {
          !item.ifInput && <Text className="TextAlignR">{ item.unit }</Text>
        }
        {
          !item.ifInput && <Text className="TextAlignR">{ item.fprice }</Text>
        }
        {
          item.ifInput && <View className="inputBlock">
          <View>
            <AtInput
                name='fnum'
                confirmType="完成"
                type='digit'
                value={item.unit}
                placeholder="请输入"
                onChange={this.handleChange_fnum.bind(this, idx)}
              />
          </View>
        </View>
        }
        {
          item.ifInput && <View className="inputBlock">
          <AtInput
              name='fprice'
              confirmType="完成"
              type='digit'
              value={item.fprice}
              placeholder="请输入"
              onChange={this.handleChange_fprice.bind(this, idx)}
            />
        </View>
        }
      </View>
    })
    return (
      <View className='Image'>
        <View className="picList">
          <Text>请选择要上传的条形码照片</Text>
          <AtImagePicker
            sourceType={['album', 'camera']}
            files={this.state.files1}
            onChange={this.onChange.bind(this, 1)}
            onImageClick={this.onImageClick.bind(this, 1)}
          />
          <Text>请选择要上传的电源点照片</Text>
          <AtImagePicker
            sourceType={['album', 'camera']}
            files={this.state.files2}
            onChange={this.onChange.bind(this, 2)}
            onImageClick={this.onImageClick.bind(this, 2)}
          />
          <Text>请选择要上传的人桩合影照片</Text>
          <AtImagePicker
            sourceType={['album', 'camera']}
            files={this.state.files3}
            onChange={this.onChange.bind(this, 3)}
            onImageClick={this.onImageClick.bind(this, 3)}
          />
          <Text>请选择要上传的桩前5米照片</Text>
          <AtImagePicker
            sourceType={['album', 'camera']}
            files={this.state.files4}
            onChange={this.onChange.bind(this, 4)}
            onImageClick={this.onImageClick.bind(this, 4)}
          />
          <Text>请选择要上传的其他（安装文档，入网协议等）照片</Text>
          <AtImagePicker
            sourceType={['album', 'camera']}
            files={this.state.files5}
            onChange={this.onChange.bind(this, 5)}
            onImageClick={this.onImageClick.bind(this, 5)}
          />
          <Text>请选择要上传的视频</Text>
          {
            (this.state.videoInfo.src) && <Video
              src={this.state.videoInfo.src}
              controls={true}
              autoplay={false}
              initialTime='0'
              id='video'
              loop={false}
              muted={false}
            />
          }
          <AtButton type='primary' size='small' onClick={this.chooseVideo.bind(this)}>选择视频</AtButton>
        </View>
        <View className="carType">
          <Text>型号：</Text>
          <Picker mode='selector' range={this.state.carTypeList} rangeKey="fname" onChange={this.onCarTypeChange}>
            { this.state.selectorChecked }
          </Picker>
        </View>
        
        <View className="carType">
          <Text>电缆</Text>
          <Picker mode='selector' range={this.state.cablePipeList} rangeKey="valueStr" onChange={this.handleChange_cable_pipe}>
            { this.state.cable }
          </Picker>
          {/* <AtRadio
            options={[
              { label: 'YJV 3*6', value: '0'},
              { label: 'YJV 3*4', value: '1' }
            ]}
            value={this.state.cable}
            onClick={this.handleChange_cable.bind(this)}
          /> */}
        </View>
        <View className="carType">
          <Text>管材</Text>
          <Picker mode='selector' range={this.state.cablePipeList} rangeKey="valueStr" onChange={this.handleChange_cable_pipe}>
            { this.state.pipe }
          </Picker>
          {/* <AtRadio
            options={[
              { label: 'JDG 25', value: '0'},
              { label: 'PVC 25', value: '1' }
            ]}
            value={this.state.pipe}
            onClick={this.handleChange_pipe.bind(this)}
          /> */}
        </View>

        {/* <View className="pureInstall">
          <Text>是否纯安装：</Text>
          {
            (this.state.pureInstall == '严格出') && <Text>{ this.state.pureInstall }</Text>
          }
          {
            (this.state.pureInstall != '严格出') && <Picker mode='selector' range={this.state.pureInstallList} onChange={this.onPureInstallChange}>
            { this.state.pureInstall }
          </Picker>
          }
        </View> */}
        <View className="SNCode">
          <Text>SN码：{ this.state.SNCode }</Text>
          <AtButton type='primary' size="small" onClick={this.scanCode}>点击扫码</AtButton>
        </View>
        <View className="carType">
          <Text>立柱：</Text>
          <Picker mode='selector' range={this.state.postList} rangeKey="fname" onChange={this.onPostChange}>
            { this.state.selectorPost }
          </Picker>
        </View>
        <View className="carType">
          <Text>漏保：</Text>
          <Picker mode='selector' range={this.state.leakList} rangeKey="fname" onChange={this.onLeakChange}>
            { this.state.selectorLeakpro }
          </Picker>
        </View>
        {/* <View className="contentBar">
          <Text className="columnTit">是否报桩</Text>
          <AtRadio
            options={[
              { label: '是', value: '1'},
              { label: '否', value: 'null' }
            ]}
            value={this.state.isbz}
            onClick={this.handleChange_isbz.bind(this)}
          />
        </View> */}
        
        <View className="SNCode">
          <AtInput style="text-align:right;"
            name='fmeter'
            title='米数：'
            confirmType="完成"
            type='digit'
            placeholder='请输入米数'
            value={this.state.fmeter}
            onChange={this.handleChange_fmeter.bind(this)}
            onBlur={this.handleBulr_fmeter.bind(this)}
          />
        </View>
        <View className="contentBar">
          <Text className="columnTit">超标项目 </Text>
          {/* <View className="pListTit" style="background: #F3F0F3;">
            <Text>规格</Text>
            <Text>最高价格</Text>
            <Text>实际用量</Text>
            <Text>实际收费</Text>
          </View>
          { productionList } */}
          <View className="pListTit" style="color:#f35957;margin-top: 6px;">
            <Text>实际费用金额</Text>
            <Text></Text>
            <Text></Text>
            <Text className="TextAlignR">{ this.state.overcost -  this.state.discount }</Text>
          </View>
          <View className="pListTit" style="color:#f35957;">
            <Text>请输入超标费用金额</Text>
            <Text></Text>
            <Text></Text>
            <View className="TextAlignR">
              <AtInput className="inputFee"
                name='total'
                confirmType="完成"
                type='digit'
                value={ this.state.overcost }
                placeholder="请输入"
                onChange={this.handleChange_overcost.bind(this)}
              />
            </View>
          </View>
          <View className="pListTit" style="color:#f35957;margin-bottom: 20px;">
            <Text>请输入优惠金额</Text>
            <Text></Text>
            <Text></Text>
            <View className="TextAlignR">
              <AtInput className="inputFee"
                  name='total'
                  confirmType="完成"
                  type='digit'
                  value={ this.state.discount }
                  placeholder="请输入"
                  onChange={this.handleChange_discount.bind(this)}
                />
            </View>
          </View>
          {/* <View class="plus">
            <Picker mode='selector' range={this.state.overPList} rangeKey="fmodel" onChange={this.onAddOne}>
              <AtIcon value='add' size='30' color='#6190e8'></AtIcon>
            </Picker>
          </View> */}
        </View>
        <View className="note">
          <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={200} height={300} autoHeight placeholder='请输入超标费用详细说明：如线缆超标X米，路面开挖X米' value={this.state.sdcostnote} onChange={e => this.changeCostNote(e)}/>
        </View>
        <View className="note">
          <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={200} height={300} autoHeight placeholder='请输入安装备注' value={this.state.note} onChange={e => this.changeNote(e)}/>
        </View>
        <View className="btBlock">
          <AtButton className="bt" loading={this.state.loading} disabled={this.state.loading} type='primary' onClick={this.submit}>提交</AtButton>
          <AtButton className="bt" loading={this.state.loading} disabled={this.state.loading} type='secondary' onClick={this.saveTemporary}>暂存</AtButton>
        </View>
        {/* <AtModal
          isOpened={this.state.isOpened}
          title='材料信息'
          confirmText='确认'
          onConfirm={ this.handleConfirmCarType }
          content={'电缆：' + this.state.carTypeInfo.detail.cable + '\n\r' + '管材：' + this.state.carTypeInfo.detail.pipe}
        /> */}
      </View>
    )
  }
}
