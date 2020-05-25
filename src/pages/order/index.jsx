import Taro, { Component } from '@tarojs/taro'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { AtTabBar, AtButton }  from 'taro-ui'
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
      dargState: 0 //刷新状态 0不做操作 1刷新 -1加载更多
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

  toUpload = (fstatus, workno, id) => {
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
        url: '/pages/install/index?workno=' + workno + '&id=' + id
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

  render () {
    let dargStyle = this.state.dargStyle;
    let downDragStyle = this.state.downDragStyle;
    let upDragStyle = this.state.upDragStyle;
    const { orderList } = this.state
    const orders = orderList.map((order) => {
      return <View key={order.id} className="orderItem">
          <View className="itemBar">
            <Image className="leftIcon"  src={order.fstatus == '1' ? kanchaIcon : (order.fstatus == '2' ? anzhuang : (order.fstatus == '3' ? shenhe : (wancheng)))} />
            {
              order.fstatus == 1 && <AtButton type='secondary' size='small' onClick={this.toUpload.bind(this, order.fstatus, order.workno, order.id)}>提交勘察</AtButton>
            }
            {
              order.fstatus == 2 && <AtButton type='primary' size='small' onClick={this.toUpload.bind(this, order.fstatus, order.workno, order.id)}>安装提交</AtButton>
            }
            {
              order.fstatus == 4 && order.evaluate_status == 0 && <Image className="rightIcon" src={finished}/>
            }
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
          {/* onScrollToLower={this.ScrollToLower} */}
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
        {/* <ScrollView
          className='orderList'
          scrollY
          scrollWithAnimation
          scrollTop={scrollTop}
          lowerThreshold={Threshold}
          onScrollToLower={this.onScrollToLower}
          onScroll={this.onScroll}
        >
          {orders}
          {noMore
            ? <View className="nomoreBlock"></View>
            : <Text></Text>
          }
        </ScrollView> */}
      </View>
    )
  }
}

export default Order
