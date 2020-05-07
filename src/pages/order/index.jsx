import Taro, { Component } from '@tarojs/taro'
import { View, Text, ScrollView } from '@tarojs/components'
import { AtTabBar }  from 'taro-ui'
import { connect } from '@tarojs/redux'
import { add } from '../../actions/counter'
import send from '../../service/api'
import './index.scss'


@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  add () {
    dispatch(add())
  },
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
      noMore: false
    }
  }

  componentDidShow () {
    Taro.getLocation({
      type: 'wgs84',
      success: (res) => {
      },
      fail:  (err) => {
      }
    })
    this.getOrderList(null, this.state.currentTabIdx + 1)
  }

  getOrderList = (curPage, fstatus, reflash) => {
    send.post('order/orderList', {pageNo: curPage ? curPage : this.state.pageNo, pageSize: this.state.pageSize, id: this.props.counter.userid, fstatus: fstatus}).then((res) => {
      switch (res.data.respCode) {
        case '0':
          this.setState({
            orderList: reflash ? res.data.data : [...this.state.orderList, ...res.data.data]
          })
          if (curPage && res.data.data.length == 0) {
            Taro.stopPullDownRefresh()
            this.setState({
              noMore: true
            })
            setTimeout(() => {
              this.setState({
                noMore: false
              })
            }, 1000)
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
  toUpload = (workno) => {
    Taro.navigateTo({
      url: '/pages/image/index?workno=' + workno
    })
  }
  onScroll = (e) => {
  }
  onScrollToLower = () => {
    console.log('on bottom---')
    let curPage = this.state.pageNo + 1
    this.setState({
      pageNo: curPage
    })
    this.getOrderList(curPage, this.state.currentTabIdx + 1)
  }

  render () {
    const { orderList } = this.state
    const orders = orderList.map((order) => {
      return <View key={order.id} className="orderItem" onClick={this.toUpload(order.workno)}>
          <View className="itemBar">
            <View>
              <Text>工单号：{this.state.pageNo}</Text>
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
      </View>
    })

    const scrollTop = 0
    const Threshold = 20
    const { noMore } = this.state
    return (
      <View className='Order'>
        <AtTabBar style="height: 50px;"
          tabList={[
            { title: '待勘察',},
            { title: '待安装' },
            { title: '待审核'},
            { title: '完成'}
          ]}
          onClick={this.changeTab}
          current={this.state.currentTabIdx}
        />
        <ScrollView
          className='orderList'
          scrollY
          scrollWithAnimation
          scrollTop={scrollTop}
          lowerThreshold={Threshold}
          onScrollToLower={this.onScrollToLower}
          onScroll={this.onScroll}
        >
          {orders}
        </ScrollView>
        {noMore
          ? <Text>无更多数据</Text>
          : <Text></Text>
        }
        {/* <View className="orderList">
          {orders}
        </View> */}
      </View>
    )
  }
}

export default Order
