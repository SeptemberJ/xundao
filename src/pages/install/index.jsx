import Taro, { Component } from '@tarojs/taro'
import { View, Text, Picker } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { AtImagePicker, AtButton, AtTextarea, AtRadio, AtInput, AtModal, AtIcon } from 'taro-ui'
import './index.scss'
import { changeTab } from '../../actions/counter'
import send from '../../service/api'
var COS = require('cos-wx-sdk-v5')


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
      carTypeList: [],
      selectorChecked: '请选择',
      carTypeInfo: {detail: {cable: '', pipe: ''}},
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
      files: [], // 1、电源点；2、人桩合影、3、桩前5米、4、通电测试
      files2: [],
      files3: [],
      files4: [],
      wholeFiles: [], // 完整图片list占位
      timeStamp: [], // 图片命名时间戳list占位
      checkSN: 'N', //  Y - 可以为空 N - 不可以为空
      SNCode: '',
      note: '',
      isbz: '',
      cable: '',
      pipe: '',
      fmeter: '',
      overPList: [], // 超标项目list
      productions: [],
      sum: 0, // 应收
      total: '' // 实收
    }
  }
  componentWillMount () {
    this.setState({
      id: this.$router.params.id,
      workno: this.$router.params.workno,
      cartype: this.$router.params.cartype
    })
    this.getCarTypeList(this.$router.params.cartype)
    this.checkSNCode(this.$router.params.id)
  }
  componentDidShow () {
    // 检查定位
    this.checkAuth()
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.fmeter !== this.state.fmeter) {
      this.setState({
        productions: [],
        total: 0,
        sum: 0
      })
      this.getOverPList(this.state.id, this.state.fmeter)
    } else {
      if (prevState.productions !== this.state.productions) {
        this.updateSum(this.state.productions)
      }
    }
  }
  
  onChange = (type, files, doType, index) => {
    console.log(doType, index, files, type)
    let removePathIdx = null
    let len = files.length
    let oldWholeFiles = [...this.state.wholeFiles]
    let oldTimeStamp = [...this.state.timeStamp]
    let curTimeStamp = (new Date()).getTime()
    // 添加图片
    if (doType == 'add') {
      let newestFile = files[len - 1]
      oldWholeFiles.push(newestFile.url)
      oldTimeStamp.push({dirct: type, stamp: curTimeStamp})
      switch (type) {
        case 1:
          this.setState({
            files: files,
            wholeFiles: oldWholeFiles,
            timeStamp: oldTimeStamp
          })
          break
        case 2:
          this.setState({
            files2: files,
            wholeFiles: oldWholeFiles,
            timeStamp: oldTimeStamp
          })
          break
        case 3:
          this.setState({
            files3: files,
            wholeFiles: oldWholeFiles,
            timeStamp: oldTimeStamp
          })
          break
        case 4:
          this.setState({
            files4: files,
            wholeFiles: oldWholeFiles,
            timeStamp: oldTimeStamp
          })
          break
      }
      // 上传图片到COS
      cos.postObject({
        Bucket: 'xundao-1302369589',
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
  onImageClick = (type, index, file) => {
    let Files = []
    switch (type) {
      case 1:
        Files = this.state.files
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
    }
    let urls = Files.map(item => {
      return item.url
    })
    Taro.previewImage({
      current: file.url,
      urls: urls
    })
  }

  submit = () => {
    // 校验
    if (this.state.wholeFiles.length == 0) {
      Taro.showToast({
        title: '请先选择要上传的图片',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.selectorChecked == '请选择') {
      Taro.showToast({
        title: '请先选择型号',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.checkSN == 'N' && this.state.pureInstall == '否' && !this.state.SNCode) {
      Taro.showToast({
        title: '请先扫SN码',
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
    if (this.state.total === '') {
      Taro.showToast({
        title: '请先输入实际费用',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    // 校验通过
    let fcontent = []
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
      sn: this.state.SNCode,
      // isbz: this.state.isbz == "null" ? null : this.state.isbz,
      cable: this.state.cable,
      pipe: this.state.pipe,
      fmeter: this.state.fmeter,
      fnumber: this.state.fnumber,
      post: this.state.post,
      leakpro: this.state.leakpro,
      price: this.state.sum, // 应收
      price1: this.state.total, // 实收
      price2: this.state.sum - this.state.total, // 优惠
      isinstall: this.state.pureInstall,
      fcontent: [],
      cost: JSON.stringify(costTmp)
    }
    this.setState({
      loading: true
    })
    this.state.wholeFiles.map((item, idx) => {
      if (item) {
        fcontent.push({
          fobjectname: this.state.workno + '/install/' + this.state.timeStamp[idx].stamp + '_' + (idx + 1) + '.png',
          lng: this.state.longitude,
          lat: this.state.latitude,
          dirct: this.state.timeStamp[idx].dirct
        })
      }
    })
    installInfo.fcontent = JSON.stringify(fcontent)
    console.log(installInfo)
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

  handleChange_total (val) {
    this.setState({
      total: val
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
    this.setState({
      selectorChecked: selector.fname,
      carTypeInfo: selector,
      pureInstall: selector.detail.isinstall,
      fnumber: selector.fnumber,
      postList: selector.postList,
      leakList: selector.leakList,
      selectorPost: '请选择',
      selectorLeakpro: '请选择',
      isOpened: true
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

  getCarTypeList = (cartype) => {
    send.post('order/cartype', {ftype: cartype}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            carTypeList: res.data.data
          })
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
          <Text>请选择要上传的电源点图片</Text>
          <AtImagePicker
            sourceType={['camera']}
            files={this.state.files}
            onChange={this.onChange.bind(this, 1)}
            onImageClick={this.onImageClick.bind(this, 1)}
          />
          <Text>请选择要上传的人桩合影图片</Text>
          <AtImagePicker
            sourceType={['camera']}
            files={this.state.files2}
            onChange={this.onChange.bind(this, 2)}
            onImageClick={this.onImageClick.bind(this, 2)}
          />
          <Text>请选择要上传的桩前5米图片</Text>
          <AtImagePicker
            sourceType={['camera']}
            files={this.state.files3}
            onChange={this.onChange.bind(this, 3)}
            onImageClick={this.onImageClick.bind(this, 3)}
          />
          <Text>请选择要上传的通电测试图片</Text>
          <AtImagePicker
            sourceType={['camera']}
            files={this.state.files4}
            onChange={this.onChange.bind(this, 4)}
            onImageClick={this.onImageClick.bind(this, 4)}
          />
        </View>
        <View className="carType">
          <Text>型号：</Text>
          <Picker mode='selector' range={this.state.carTypeList} rangeKey="fname" onChange={this.onCarTypeChange}>
            { this.state.selectorChecked }
          </Picker>
        </View>
        <View className="pureInstall">
          <Text>是否纯安装：</Text>
          <Text>{ this.state.pureInstall }</Text>
        </View>
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
              { label: 'JDG 25', value: '0'},
              { label: 'PVC 25', value: '1' }
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
            onBlur={this.handleBulr_fmeter.bind(this)}
          />
        </View>
        <View className="contentBar">
          <Text className="columnTit">超标项目 </Text>
          <View className="pListTit" style="background: #F3F0F3;">
            <Text>规格</Text>
            <Text>最高价格</Text>
            <Text>实际用量</Text>
            <Text>实际收费</Text>
          </View>
          { productionList }
          <View className="pListTit" style="color:#f35957;margin-top: 6px;">
            <Text>合计</Text>
            <Text></Text>
            <Text></Text>
            <Text className="TextAlignR">{ this.state.sum }</Text>
          </View>
          <View className="pListTit" style="color:#f35957;">
            <Text>实际费用</Text>
            <Text></Text>
            <Text></Text>
            <View className="TextAlignR">
              <AtInput className="inputFee"
                name='total'
                confirmType="完成"
                type='digit'
                value={ this.state.total }
                placeholder="请输入"
                onChange={this.handleChange_total.bind(this)}
              />
            </View>
          </View>
          <View className="pListTit" style="color:#f35957;margin-bottom: 20px;">
            <Text>优惠费用</Text>
            <Text></Text>
            <Text></Text>
            <Text className="TextAlignR">{ this.state.sum - this.state.total }</Text>
          </View>
          <View class="plus">
            <Picker mode='selector' range={this.state.overPList} rangeKey="fmodel" onChange={this.onAddOne}>
              <AtIcon value='add' size='30' color='#6190e8'></AtIcon>
            </Picker>
          </View>
        </View>
        <View className="note">
          <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={200} height={300} autoHeight placeholder='请输入安装备注' value={this.state.note} onChange={e => this.changeNote(e)}/>
        </View>
        <View style="width:90%;margin-top:40px;">
          <AtButton loading={this.state.loading} type='primary' disabled={this.state.loading} onClick={this.submit}>提交</AtButton>
        </View>
        <AtModal
          isOpened={this.state.isOpened}
          title='材料信息'
          confirmText='确认'
          onConfirm={ this.handleConfirmCarType }
          content={'电缆：' + this.state.carTypeInfo.detail.cable + '\n\r' + '管材：' + this.state.carTypeInfo.detail.pipe}
        />
      </View>
    )
  }
}
