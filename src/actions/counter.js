import {
  ADD,
  MINUS,
  UPDATEUSERINFO
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

// 异步的action
export function asyncAdd () {
  return dispatch => {
    setTimeout(() => {
      dispatch(add())
    }, 2000)
  }
}
