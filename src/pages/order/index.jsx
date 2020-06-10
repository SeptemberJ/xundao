import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { AtTabBar, AtButton, AtCurtain, AtTextarea, AtRadio, AtModal, AtFloatLayout, AtList, AtListItem }  from 'taro-ui'
import { connect } from '@tarojs/redux'
import { changeTab } from '../../actions/counter'
import send from '../../service/api'
import './index.scss'
import kanchaIcon from '../../images/kancha.png'
import anzhuang from '../../images/anzhuang.png'
import shenhe from '../../images/shenhe.png'
import wancheng from '../../images/wancheng.png'
import finished from '../../images/finished.png'

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
      isShowMaterial: false,
      carTypeInfo: {detail: {cable: '', pipe: ''}}
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
        pageNo: 1
      })
      this.getOrderList(1, curIdx + 1, true)
    }
  }

  toUpload = (fstatus, workno, id, cartype) => {
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
        url: '/pages/install/index?workno=' + workno + '&id=' + id + '&cartype=' + cartype
      })
    }
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

  onClose = () => {
    this.setState({
      isOpened: false,
      fnote: '',
      fdegree: ''
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
  showMaterial = (carType) => {
    this.setState({
      isShowMaterial: true,
      carTypeInfo: carType
    })
  }
  handleConfirmCarType  = () => {
    this.setState({
      isShowMaterial: false
    })
  }
  getCarTypeList = (cartype, e) => {
    e.stopPropagation()
    send.post('order/cartype', {ftype: cartype}).then((res) => {
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
            this.setState({
              loading: false
            })
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
    let suspendInfo = {
      orderid: this.state.curOrder.id,
      fdegree: this.state.fdegree,
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
            this.setState({
              loading: false
            })
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
            <Image className="leftIcon"  src={currentTabIdx == '0' ? kanchaIcon : (currentTabIdx == '1' ? anzhuang : (currentTabIdx == '2' ? shenhe : (wancheng)))} />
            <View style="width:120px;display:flex;justify-content:flex-end;">
              {
                (order.fstatus != 'C' && (currentTabIdx == 0 || currentTabIdx == 1)) && <AtButton  className="stopBt" size='small' onClick={this.suspend.bind(this, order, idx)}>暂停</AtButton>
              }
              {
                order.fstatus == 'C' && <AtButton  className="restoreBt" size='small' onClick={this.restore.bind(this, order, idx)}>恢复</AtButton>
              }
              {
                (order.fstatus != 'C' && currentTabIdx == 0) && <AtButton className="marginL" type='secondary' size='small' onClick={this.toUpload.bind(this, order.fstatus, order.workno, order.id, order.cartype)}>提交勘察</AtButton>
              }
              {
                (order.fstatus != 'C' && currentTabIdx == 1) && <AtButton className="marginL" type='primary' size='small' onClick={this.toUpload.bind(this, order.fstatus, order.workno, order.id, order.cartype)}>安装提交</AtButton>
              }
              {
                (currentTabIdx == 3 && order.evaluate_status == 0) && <Image className="rightIcon" src={finished}/>
              }
            </View>
          </View>
          <View onClick={this.toDetail.bind(this, order.id)}>
            <View className="itemBar">
              <View>
                {/* <Text>工单号：{this.state.pageNo}</Text> */}
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
            <View className="itemBar">
              <View>
                <Text>建桩联系电话：</Text>
                <Text>{order.construct_stake_phone}</Text>
              </View>
            </View>
            <View className="itemBar">
              <View>
                <Text>建桩地址：</Text>
                <Text>{order.construct_stake_address}</Text>
              </View>
            </View>
            <View className="itemBar" style="justify-content: flex-start;">
              <Text>车型：</Text>
              <Text>{order.cartype}</Text>
              {
                (currentTabIdx == 0 || currentTabIdx == 1  || currentTabIdx == 'C') && <View style="float:right;" onClick={this.getCarTypeList.bind(this, order.cartype)}>
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
        <AtModal
          isOpened={this.state.isShowMaterial}
          title='材料信息'
          confirmText='确认'
          onConfirm={ this.handleConfirmCarType }
          content={'电缆：' + this.state.carTypeInfo.detail.cable + '\n\r' + '管材：' + this.state.carTypeInfo.detail.pipe}
        />
        <AtModal
        isOpened={this.state.isOpened}
        closeOnClickOverlay={false}
        >
          <AtModalContent>
            <View className="contentBar">
              <Text className="columnTit">请选择原因</Text>
              <AtRadio
                options={[
                  { label: '客户原因', value: '1'},
                  { label: '时间不符', value: '2' }
                ]}
                value={this.state.fdegree}
                onClick={this.handleChange_fdegree.bind(this)}
              />
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
      </View>
    )
  }
}

export default Order
