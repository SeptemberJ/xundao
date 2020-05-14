import {
  ADD,
  MINUS,
  UPDATEUSERINFO,
  CHANGETAB
} from '../constants/counter'

export const add = () => {
  return {
    type: ADD
  }
}
export const minus = () => {
  return {
    type: MINUS
  }
}
export const updateUserInfo = (openid, session_key, userid) => {
  return {
    type: UPDATEUSERINFO,
    openid: openid,
    session_key: session_key,
    userid: userid
  }
}
export const changeTab = (tabIdx) => {
  return {
    type: CHANGETAB,
    tabIdx: tabIdx
  }
}

// 异步的action
export function asyncAdd () {
  return dispatch => {
    setTimeout(() => {
      dispatch(add())
    }, 2000)
  }
}
