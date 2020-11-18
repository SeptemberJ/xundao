import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, ScrollView, Picker } from '@tarojs/components'
import { AtTabBar, AtButton, AtCurtain, AtTextarea, AtRadio, AtModal, AtFloatLayout, AtList, AtListItem, AtMessage }  from 'taro-ui'
import { connect } from '@tarojs/redux'
import { changeTab } from '../../actions/counter'
import {formatTime} from '../../utils/index'
import send from '../../service/api'
import './index.scss'
import kanchaIcon from '../../images/kancha.png'
import anzhuang from '../../images/anzhuang.png'
import baozhuang from '../../images/baozhuang.png'
import shenhe from '../../images/shenhe.png'
import wancheng from '../../images/wancheng.png'
import finished from '../../images/finished.png'
import shouji from '../../images/shouji.png'

@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  changeTab (tabIdx) {
    dispatch(changeTab(tabIdx))
  }
}))
class Order extends Component {

  config = {
    navigationBarTitleText: '订单列表'
  }

  constructor(props) {
    super(props)
    this.state = {
      pageNo: 1,
      pageSize: 5,
      orderList: [],
      currentTabIdx: 0,
      noMore: false,
      dargStyle: {//下拉框的样式
        top: 0 + 'px'
      },
      downDragStyle: {//下拉图标的样式
          height: 0 + 'px'
      },
      downText: '下拉刷新',
      upDragStyle: {//上拉图标样式
          height: 0 + 'px'
      },
      pullText: '上拉加载更多',
      start_p: {},
      scrollY:true,
      dargState: 0, //刷新状态 0不做操作 1刷新 -1加载更多
      curOrder: {},
      curOrderIdx: '',
      isOpened: false,
      isOpenedCarType: false,
      carTypeList: [],
      fnote: '',
      fdegree: '',
      ftype: '',
      stopDate: '请选择日期',
      stopTime: '请选择时间',
      suspendOptions: [],
      ftypeOptions: [],
      isShowMaterial: false,
      carTypeInfo: {},
      detailStr: '',
      isOpenedBook: false,
      appdate: '请选择',
      appTime: '请选择',
      isOpenedBZ: false,
      isOpenedBZSimple: false,
      loading: false,
      date1: '',
      date2: '',
      date3: '',
      date4: '',
      date5: ''
    }
  }

  // componentDidShow () {
  componentWillMount () {
    if (this.$router.params.tab) {
      this.setState({
        currentTabIdx: Number(this.$router.params.tab)
      })
      this.getOrderList(null, Number(this.$router.params.tab) + 1)
    } else {
      this.getOrderList(null, this.state.currentTabIdx + 1)
    }
    Taro.getLocation({
      type: 'wgs84',
      success: (res) => {
      },
      fail:  (err) => {
      }
    })
    this.getSuspendOptions()
    this.getFtypeOptions()
  }

  getOrderList = (curPage, fstatus, reflash) => {
    send.post('order/orderList', {pageNo: curPage ? curPage : this.state.pageNo, pageSize: this.state.pageSize, id: this.props.counter.userid, fstatus: fstatus}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            orderList: reflash ? res.data.data : [...this.state.orderList, ...res.data.data]
          })
          if (curPage && res.data.data.length == 0) {
            // Taro.stopPullDownRefresh()
            Taro.showToast({
              title: '无更多数据',
              icon: 'none',
              duration: 2000
            })
            this.setState({
              noMore: true
            })
            setTimeout(() => {
              this.setState({
                noMore: false
              })
            }, 2000)
          }
          //  _this.props.toUpdateUserInfo(openid, sessionKey, res.data.userid)
          break
        default:
          Taro.showToast({
            title: '订单获取失败',
            icon: 'none',
            duration: 1500
          })
      }
      // Taro.stopPullDownRefresh()
    })
  }

  changeTab =  (curIdx) => {
    if (curIdx != this.state.currentTabIdx) {
      this.setState({
        currentTabIdx: curIdx,
        pageNo: 1,
        orderList: []
      })
      this.getOrderList(1, curIdx + 1, true)
    }
  }

  toUpload = (fstatus, workno, id, cartype, hosts) => {
    // e.stopPropagation()
    // 勘察
    if (fstatus == 1) {
      Taro.navigateTo({
        url: '/pages/survey/index?workno=' + workno + '&id=' + id
      })
    }
    // 安装
    if (fstatus == 2) {
      Taro.navigateTo({
        url: '/pages/install/index?workno=' + workno + '&id=' + id + '&cartype=' + cartype + '&hosts=' + hosts
      })
    }
  }

  toBz = (order, idx) => {
    if (order.isbz == 2) {
      this.setState({
        curOrderIdx: idx,
        curOrder: order,
        isOpenedBZ: true,
        date1: order.date1 || '请选择',
        date2: order.date2 || '请选择',
        date3: order.date3 || '请选择',
        date4: order.date4 || '请选择',
        date5: order.date5 || '请选择'
      })
    } else {
      this.setState({
        curOrderIdx: idx,
        curOrder: order,
        isOpenedBZSimple: true
      })
    }
  }

  updateBZ = (curOrderIdx) => {
    let tmp = [...this.state.orderList]
    if (tmp[curOrderIdx].isbz == 2) {
      tmp[curOrderIdx].fstatus = this.state.date5 != '请选择' ? 2 : 'D'
      tmp[curOrderIdx].date1 = this.state.date1
      tmp[curOrderIdx].date2 = this.state.date2
      tmp[curOrderIdx].date3 = this.state.date3
      tmp[curOrderIdx].date4 = this.state.date4
      tmp[curOrderIdx].date5 = this.state.date5
      this.setState({
        orderList: tmp,
        isOpenedBZ: false
      })
    } else {
      tmp[curOrderIdx].fstatus = 2
      this.setState({
        orderList: tmp,
        isOpenedBZSimple: false
      })
    }
  }

  submitDateBZ = () => {
    let data = {}
    if (this.state.curOrder.isbz == 2) {
      if (this.state.date1 == '请选择') {
        Taro.atMessage({
          'message': '请先选择报装原件收到日期！',
          'type': 'warning'
        })
        return false
      }
      if (this.state.date2 == '请选择' && this.state.date3 != '请选择') {
        Taro.atMessage({
          'message': '请先选择电力专工勘察日期！',
          'type': 'warning'
        })
        return false
      }
      if (this.state.date3 == '请选择' && this.state.date4 != '请选择') {
        Taro.atMessage({
          'message': '请先选择出具方案日期！',
          'type': 'warning'
        })
        return false
      }
      if (this.state.date4 == '请选择' && this.state.date5 != '请选择') {
        Taro.atMessage({
          'message': '请先选择递交报装资料日期！',
          'type': 'warning'
        })
        return false
      }
      data = JSON.stringify({ id: this.state.curOrder.id, date1: this.state.date1 == '请选择' ? null : this.state.date1, date2: this.state.date2 == '请选择' ? null : this.state.date2, date3: this.state.date3 == '请选择' ? null : this.state.date3, date4: this.state.date4 == '请选择' ? null : this.state.date4, date5: this.state.date5 == '请选择' ? null : this.state.date5 })
    } else {
      data = JSON.stringify({ id: this.state.curOrder.id, date1: null, date2: null, date3: null, date4: null, date5: null })
    }
    send.post('cos/bz', {bz: data}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          Taro.showToast({
            title: '确认报装成功',
            icon: 'success',
            duration: 1500
          }).then(
            // 更新该订单的fstatus 和五个日期
            this.updateBZ(this.state.curOrderIdx)
          )
          break
        default:
          Taro.showToast({
            title: '预确认报装失败',
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

  handleCancelBZ = () => {
    this.setState({
      isOpenedBZ: false,
      isOpenedBZSimple: false
    })
  }

  toDetail = (id) => {
    Taro.navigateTo({
      url: '/pages/detail/index?id=' + id
    })
  }

  reduction() {//还原初始设置
    const time = 0.5;
    this.setState({
        upDragStyle: {//上拉图标样式
            height: 0 + 'px',
            transition: `all ${time}s`
        },
        dargState: 0,
        dargStyle: {
            top: 0 + 'px',
            transition: `all ${time}s`
        },
        downDragStyle: {
            height: 0 + 'px',
            transition: `all ${time}s`
        },
        scrollY:true
    })
    setTimeout(() => {
        this.setState({
            dargStyle: {
                top: 0 + 'px'
            },
            upDragStyle: {//上拉图标样式
                height: 0 + 'px'
            },
            pullText: '上拉加载更多',
            downText: '下拉刷新'
        })
    }, time * 1000);
  }
  touchStart(e) {
    this.setState({
        start_p: e.touches[0]
    })
  }
  touchmove(e) {
    let that = this
    let move_p = e.touches[0],//移动时的位置
        deviationX = 0.30,//左右偏移量(超过这个偏移量不执行下拉操作)
        deviationY = 30,//拉动长度（低于这个值的时候不执行）
        maxY = 40;//拉动的最大高度

    let start_x = this.state.start_p.clientX,
        start_y = this.state.start_p.clientY,
        move_x = move_p.clientX,
        move_y = move_p.clientY;
    //得到偏移数值
    let dev = Math.abs(move_x - start_x) / Math.abs(move_y - start_y);
    if (dev < deviationX) { //当偏移数值大于设置的偏移数值时则不执行操作
      let pY = Math.abs(move_y - start_y) / 3.5;//拖动倍率（使拖动的时候有粘滞的感觉--试了很多次 这个倍率刚好）
      // 下拉操作
      if (move_y - start_y > 0) {
        if (pY >= deviationY) {
          this.setState({ dargState: 1, downText: '释放刷新' })
        } else {
          this.setState({ dargState: 0, downText: '下拉刷新' })
        }
        if (pY >= maxY) {
          pY = maxY
        }
        this.setState({
          dargStyle: {
            top: pY + 'px'
          },
          downDragStyle: {
            height: pY + 'px'
          },
          scrollY:false//拖动的时候禁用
        })
      }
      // 上拉操作
      if (start_y - move_y > 0) {
        console.log('上拉操作')
        if (pY >= deviationY) {
          this.setState({ dargState: -1, pullText: '释放加载更多' })
        } else {
          this.setState({ dargState: 0, pullText: '上拉加载更多' })
        }
        if (pY >= maxY) {
          pY = maxY
        }
        this.setState({
          dargStyle: {
            top: -pY + 'px'
          },
          upDragStyle: {
            height: pY + 'px'
          },
          scrollY: false//拖动的时候禁用
        })
      }
    }
  }
  pull = () => {
    // 上拉
    this.loadMore()
  }
  loadMore = () => {
    let curPage = this.state.pageNo + 1
    this.setState({
      pageNo: curPage
    })
    this.getOrderList(curPage, this.state.currentTabIdx + 1)
  }
  down() {
    // 下拉
    this.getOrderList(1, this.state.currentTabIdx + 1, true)
  }
  ScrollToUpper() { //滚动到顶部事件
    console.log('滚动到顶部事件')
  }
  ScrollToLower() { //滚动到底部事件
    console.log('滚动到底部事件')
    this.loadMore()
  }
  touchEnd(e) {
    console.log('dargState-----------------', this.state.dargState)
    if (this.state.dargState === 1) {
        this.down()
    } else if (this.state.dargState === -1) {
        this.pull()
    }
    this.reduction()
  }

  onScrollToLower = () => {
    console.log('on bottom---')
    let curPage = this.state.pageNo + 1
    this.setState({
      pageNo: curPage
    })
    this.getOrderList(curPage, this.state.currentTabIdx + 1)
  }

  suspend = (order, idx) =>{
    this.setState({
      isOpened: true,
      curOrder: order,
      curOrderIdx: idx
    })
  }
  
  changeNote = (value) => {
    this.setState({
      fnote: value
    })
  }

  handleChange_fdegree = (value) => {
    this.setState({
      fdegree: value
    })
  }

  handleChange_ftype = (value) => {
    this.setState({
      ftype: value
    })
  }

  onClose = () => {
    this.setState({
      isOpened: false,
      fnote: '',
      fdegree: '',
      ftype: '',
      stopDate: '请选择日期',
      stopTime: '请选择时间'
    })
  }
  updateFstatus = (curOrderIdx, status) => {
    let tmp = [...this.state.orderList]
    tmp[curOrderIdx].fstatus = status
    this.setState({
      orderList: tmp
    })
    this.onClose()
  }
  handleCloseCarType = () => {
    this.setState({
      isOpenedCarType: false
    })
  }

  handleCloseBook = () => {
    this.setState({
      isOpenedBook: false
    })
  }
  
  showMaterial = (carType) => {
    let detailStr = ''
    carType.detail.map(item => {
      detailStr += '电缆：' + item.cable + '\xa0\xa0\xa0|\xa0\xa0\xa0' + '管材：' + item.pipe + '\n\r'
    })
    this.setState({
      isShowMaterial: true,
      carTypeInfo: carType,
      detailStr: detailStr
    })
  }
  handleConfirmCarType  = () => {
    this.setState({
      isShowMaterial: false
    })
  }
  makeCall  = (phone, id, e) => {
    e.stopPropagation()
    Taro.makePhoneCall({
      phoneNumber: phone //仅为示例，并非真实的电话号码
    })
    // 记录打电话时间
    send.post('order/call', {orderid: id}).then((res) => {
      if (res.data.respCode !== '0') {
        Taro.showToast({
          title: '时间记录失败',
          icon: 'none',
          duration: 1500
        })
      }
    })
  }

  book = (order, idx, e) => {
    let curDate = formatTime(new Date())
    e.stopPropagation()
    this.setState({
      isOpenedBook: true,
      curDate: curDate,
      curOrder: order,
      curOrderIdx: idx,
      appdate: order.appdate ? order.appdate.slice(0, 10) : '请选择',
      appTime: order.appdate ? order.appdate.slice(11, 16) : '请选择'
    })
  }

  onDateChangeBook = (e) => {
    this.setState({
      appdate: e.detail.value
    })
  }

  onStopDateChange = (e) => {
    this.setState({
      stopDate: e.detail.value
    })
  }

  onDateChangeBZ = (type, e) => {
    switch (type) {
      case 1:
        this.setState({
          date1: e.detail.value
        })
        break
      case 2:
        this.setState({
          date2: e.detail.value
        })
        break
      case 3:
        this.setState({
          date3: e.detail.value
        })
        break
      case 4:
        this.setState({
          date4: e.detail.value
        })
        break
      case 5:
        this.setState({
          date5: e.detail.value
        })
        break
    }
  }

  onTimeChange = (e) => {
    this.setState({
      appTime: e.detail.value
    })
  }
  
  onStopTimeChange = (e) => {
    this.setState({
      stopTime: e.detail.value
    })
  }
  updateAppdate = (curOrderIdx, dateStr) => {
    let tmp = [...this.state.orderList]
    tmp[curOrderIdx].appdate = dateStr
    this.setState({
      orderList: tmp
    })
    this.handleCloseBook()
    this.setState({
      loading: false
    })
  }

  submitDate = () => {
    if (this.state.appdate == '请选择' || this.state.appTime == '请选择') {
      Taro.showToast({
        title: '请先选择预约的时间',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    this.setState({
      loading: true
    })
    let dateStr = this.state.appdate + ' ' + this.state.appTime + ':00'
    send.post('order/app', {id: this.state.curOrder.id, appdate: dateStr}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          Taro.showToast({
            title: '预约成功',
            icon: 'success',
            duration: 1500
          }).then(
            // 更新该订单的预约时间
            this.updateAppdate(this.state.curOrderIdx, dateStr)
          )
          break
        default:
          Taro.showToast({
            title: '预约失败',
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

  getCarTypeList = (cartype, hosts, e) => {
    e.stopPropagation()
    send.post('order/cartype', {ftype: cartype, hosts: hosts}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            isOpenedCarType: true,
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

  getSuspendOptions = () => {
    send.post('order/type', {code: 'suspend'}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            suspendOptions: res.data.data
          })
          break
        default:
          Taro.showToast({
            title: '暂停原因获取失败',
            icon: 'none',
            duration: 1500
          })
      }
    })
  }
  getFtypeOptions = () => {
    send.post('order/type', {code: 'suspend1'}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            ftypeOptions: res.data.data
          })
          break
        default:
          Taro.showToast({
            title: '暂停原因获取失败',
            icon: 'none',
            duration: 1500
          })
      }
    })
  }

  restore = (order, idx) => {
    send.post('order/restore', {orderid: order.id}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          Taro.showToast({
            title: '恢复成功',
            icon: 'success',
            duration: 1500
          }).then(
            // 修改该订单的fstatus
            this.updateFstatus (idx, this.state.currentTabIdx + 1)
          )
          break
        default:
          Taro.showToast({
            title: '恢复失败',
            icon: 'none',
            duration: 1500
          }).then(
          )
      }
    })
  }
  submit = () => {
    if (this.state.fdegree == '') {
      Taro.showToast({
        title: '请先选择暂停原因',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.ftype == '') {
      Taro.showToast({
        title: '请先选择暂停类型',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (this.state.stopDate == '请选择日期' || this.state.stopTime == '请选择时间') {
      Taro.showToast({
        title: '请将日期选择完整',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    let suspendInfo = {
      orderid: this.state.curOrder.id,
      fdegree: this.state.fdegree,
      ftype: this.state.ftype,
      fendtime: this.state.stopDate + ' ' + this.state.stopTime,
      fnote: this.state.fnote,
    }
    send.post('order/suspend', {suspend: JSON.stringify(suspendInfo)}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          Taro.showToast({
            title: '暂停成功',
            icon: 'success',
            duration: 1500
          }).then(
            // 修改该订单的fstatus
            this.updateFstatus (this.state.curOrderIdx, 'C')
          )
          break
        default:
          Taro.showToast({
            title: '暂停失败',
            icon: 'none',
            duration: 1500
          }).then(
          )
      }
    })
  }

  render () {
    let dargStyle = this.state.dargStyle;
    let downDragStyle = this.state.downDragStyle;
    let upDragStyle = this.state.upDragStyle;
    let currentTabIdx = this.state.currentTabIdx
    const { orderList } = this.state
    const orders = orderList.map((order, idx) => {
      return <View key={order.id} className="orderItem">
          <View className="itemBar">
            <Image className="leftIcon"  src={currentTabIdx == '0' ? kanchaIcon : (currentTabIdx == '1' ? (order.fstatus == 'D' ? baozhuang : anzhuang) : (currentTabIdx == '2' ? shenhe : (wancheng)))} />
            <View style="width:120px;display:flex;justify-content:flex-end;">
              {
                (order.fstatus != 'C' && order.fstatus != 'D' && (currentTabIdx == 0 || currentTabIdx == 1)) && <AtButton  className="stopBt" size='small' onClick={this.suspend.bind(this, order, idx)}>暂停</AtButton>
              }
              {
                order.fstatus == 'C' && <AtButton  className="restoreBt" size='small' onClick={this.restore.bind(this, order, idx)}>恢复</AtButton>
              }
              {
                (order.fstatus != 'C' && currentTabIdx == 0) && <AtButton className="marginL" type='secondary' size='small' onClick={this.toUpload.bind(this, order.fstatus, order.workno, order.id, order.cartype)}>提交勘察</AtButton>
              }
              {
                (order.fstatus != 'C' && order.fstatus != 'D' && currentTabIdx == 1) && <AtButton className="marginL" type='primary' size='small' onClick={this.toUpload.bind(this, order.fstatus, order.workno, order.id, order.cartype, order.hosts)}>安装提交</AtButton>
              }
              {
                (order.fstatus == 'D' && currentTabIdx == 1) && <AtButton className="marginL bz" size='small' onClick={this.toBz.bind(this, order, idx)}>确认报装</AtButton>
              }
              {
                (currentTabIdx == 3 && order.evaluate_status == 0) && <Image className="rightIcon" src={finished}/>
              }
            </View>
          </View>
          <View onClick={this.toDetail.bind(this, order.id)}>
            <View className="itemBar">
              <View>
                <Text>工单号：</Text>
                <Text>{order.workno}</Text>
              </View>
            </View>
            <View className="itemBar">
              <View>
                <Text>车主姓名：</Text>
                <Text>{order.driver_name}</Text>
              </View>
            </View>
            <View className="itemBar">
              <View>
                <Text>车主电话：</Text>
                <Text>{order.driver_phone}</Text>
              </View>
            </View>
            <View className="itemBar">
              <View>
                <Text>建桩联系人：</Text>
                <Text>{order.construct_stake_contact}</Text>
              </View>
            </View>
            <View className="itemBar" style="justify-content: flex-start;">
              <View>
                <Text>建桩联系电话：</Text>
                <Text>{order.construct_stake_phone}</Text>
                <Image className="makeCallIcon" onClick={this.makeCall.bind(this, order.construct_stake_phone, order.id)} src={shouji}/>
                {
                  (currentTabIdx == 0) && <View style="float:right;" onClick={this.book.bind(this, order, idx)}>
                    <AtButton size='small' className="carType">预约</AtButton>
                  </View>
                }
              </View>
            </View>
            <View className="itemBar" style="min-height: 60rpx;line-height:auto;">
              <View>
                <Text>建桩地址：</Text>
                <Text>{order.construct_stake_address}</Text>
              </View>
            </View>
            {
              order.appdate && <View className="itemBar">
                <View>
                  <Text>预约时间：</Text>
                  <Text>{order.appdate}</Text>
                </View>
              </View>
            }
            <View className="itemBar" style="justify-content: flex-start;">
              <Text>车型：</Text>
              <Text>{order.cartype}</Text>
              {
                (currentTabIdx == 0 || currentTabIdx == 1) && <View style="float:right;" onClick={this.getCarTypeList.bind(this, order.cartype, order.hosts)}>
                  <AtButton size='small' className="carType">查看</AtButton>
                </View>
              }
            </View>
            { 
              (currentTabIdx == 2 || currentTabIdx == 3) && <View className="itemBar"><View>
              <Text>是否报桩：</Text>
              <Text>{order.isbz}</Text>
            </View></View>
            }
            {
              (currentTabIdx == 2 || currentTabIdx == 3) && <View className="itemBar">
              <View>
                <Text>电缆：</Text>
                <Text>{order.cable}</Text>
              </View>
            </View>
            }
            {
              (currentTabIdx == 2 || currentTabIdx == 3) && <View className="itemBar">
              <View>
                <Text>管材：</Text>
                <Text>{order.pipe}</Text>
              </View>
            </View>
            }
            {
              (currentTabIdx == 2 || currentTabIdx == 3) && <View className="itemBar">
              <View>
                <Text>米数：</Text>
                <Text>{order.fmeter}</Text>
              </View>
            </View>
            }
          </View>
      </View>
    })

    const scrollTop = 0
    const Threshold = 20
    const { noMore } = this.state
    return (
      <View className='Order'>
        <AtMessage />
        <View style='width:100%;height:50px;position:fixed;z-index:99;' >
          <AtTabBar style="height: 50px"
            tabList={[
              { title: '待勘察',},
              { title: '待安装' },
              { title: '待审核'},
              { title: '完成'}
            ]}
            onClick={this.changeTab}
            current={this.state.currentTabIdx}
          />
        </View>
        <View className='dragUpdataPage'>
          <View className='downDragBox' style={downDragStyle}>
              <AtActivityIndicator></AtActivityIndicator>
              <Text className='downText'>{this.state.downText}</Text>
          </View>
          <ScrollView
              style={dargStyle}
              onTouchMove={this.touchmove}
              onTouchEnd={this.touchEnd}
              onTouchStart={this.touchStart}
              onScrollToUpper={this.ScrollToUpper}
              className='dragUpdata'
              scrollY={this.state.scrollY}
              scrollWithAnimation>
              <View style='width:100%;height:85vh;background:#F3F0F3;' >{orders}</View>
          </ScrollView>
          <View className='upDragBox' style={upDragStyle}>
              <AtActivityIndicator></AtActivityIndicator>
              <Text className='downText'>{this.state.pullText}</Text>
          </View>
        </View>
        <AtFloatLayout isOpened={this.state.isOpenedCarType} title="点击查看材料" onClose={this.handleCloseCarType.bind(this)}>
          {
            this.state.carTypeList.map((carType) => {
              return <View className="carTypeItem" key={order.fname} onClick={this.showMaterial.bind(this, carType)}>
                { carType.fname }
              </View>
            })
          }
        </AtFloatLayout>
        <AtFloatLayout isOpened={this.state.isOpenedBook} title="选择预约时间" onClose={this.handleCloseBook.bind(this)}>
          {
            <View>
              <View className="layoutWorkNo">工单号：{ this.state.curOrder.workno }</View>
              <View className='page-section' style="margin-top: 20px;">
                <View>
                  <Picker mode='date' onChange={this.onDateChangeBook} start={this.state.curDate}>
                    <AtList>
                      <AtListItem title='日期' extraText={this.state.appdate} />
                    </AtList>
                  </Picker>
                </View>
              </View>
              <View className='page-section'>
                <View>
                  <Picker mode='time' onChange={this.onTimeChange}>
                    <AtList>
                      <AtListItem title='时间' extraText={this.state.appTime} />
                    </AtList>
                  </Picker>
                </View>
              </View>
              <AtButton type='primary' className="dateBt" loading={this.state.loading} disabled={this.state.loading} onClick={this.submitDate.bind(this)}>提交</AtButton>
            </View>
          }
        </AtFloatLayout>
        <AtModal
          isOpened={this.state.isShowMaterial}
          title='材料信息'
          confirmText='确认'
          onConfirm={ this.handleConfirmCarType }
          content={this.state.detailStr}
        />
        <AtModal
        isOpened={this.state.isOpened}
        closeOnClickOverlay={false}
        >
          <AtModalContent>
            <View className="contentBar">
              <Text className="columnTit">请选择原因</Text>
              <AtRadio
                options={this.state.suspendOptions}
                value={this.state.fdegree}
                onClick={this.handleChange_fdegree.bind(this)}
              />
            </View>
            <View className="contentBar">
              <Text className="columnTit">暂停类型</Text>
              <AtRadio
                options={this.state.ftypeOptions}
                value={this.state.ftype}
                onClick={this.handleChange_ftype.bind(this)}
              />
            </View>
            <View className="contentBar">
              <Text className="columnTit">暂停至</Text>
              <Picker mode='date' onChange={this.onStopDateChange} start={this.state.curDate} style="width:120px;display:inline-block;text-align:right;">
                {this.state.stopDate}
              </Picker>
              <Picker mode='time' onChange={this.onStopTimeChange} style="width:120px;display:inline-block;padding-left: 10px;">
                {this.state.stopTime}
              </Picker>
            </View>
            <View className="note">
              <Text className="columnTit">暂停备注</Text>
              <AtTextarea style='background:#fff;width:calc(100% - 40px);padding:20rpx 20rpx 0 20rpx;' maxLength={150} height={250} autoHeight placeholder='' value={this.state.fnote} onChange={e => this.changeNote(e)}/>
            </View>
          </AtModalContent>
          <View className="footerBts">
            <View className="modalBt" onClick={this.onClose.bind(this)}>取消</View>
            <View  className="modalBt" onClick={this.submit.bind(this)}>提交</View>
          </View>
        </AtModal>
        <AtModal
          isOpened={this.state.isOpenedBZSimple}
          title='提示'
          cancelText='取消'
          confirmText='确认'
          onCancel={ this.handleCancelBZ }
          onConfirm={ this.submitDateBZ }
          content='是否确认报装?'
        />
        <AtFloatLayout isOpened={this.state.isOpenedBZ} title="选择日期" onClose={this.handleCancelBZ.bind(this)}>
          {
            <View>
              {/* <View className="layoutWorkNo">工单号：{ this.state.curOrder.workno }</View> */}
              <View className='page-section' style="margin-top: 0px;">
                <View>
                  <Picker mode='date' onChange={this.onDateChangeBZ.bind(this, 1)}>
                    <AtList>
                      <AtListItem title='报装原件收到日期' extraText={this.state.date1} />
                    </AtList>
                  </Picker>
                  <Picker mode='date' onChange={this.onDateChangeBZ.bind(this, 2)}>
                    <AtList>
                      <AtListItem title='电力专工勘察日期' extraText={this.state.date2} />
                    </AtList>
                  </Picker>
                  <Picker mode='date' onChange={this.onDateChangeBZ.bind(this, 3)}>
                    <AtList>
                      <AtListItem title='出具方案日期' extraText={this.state.date3} />
                    </AtList>
                  </Picker>
                  <Picker mode='date' onChange={this.onDateChangeBZ.bind(this, 4)}>
                    <AtList>
                      <AtListItem title='递交报装资料日期' extraText={this.state.date4} />
                    </AtList>
                  </Picker>
                  <Picker mode='date' onChange={this.onDateChangeBZ.bind(this, 5)}>
                    <AtList>
                      <AtListItem title='用户确认方案日期' extraText={this.state.date5} />
                    </AtList>
                  </Picker>
                </View>
              </View>
              <AtButton type='primary' className="dateBt" loading={this.state.loading} disabled={this.state.loading} onClick={this.submitDateBZ.bind(this)}>提交</AtButton>
            </View>
          }
        </AtFloatLayout>
      </View>
    )
  }
}

export default Order
