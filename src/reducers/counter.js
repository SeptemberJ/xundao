import { ADD, MINUS, UPDATEUSERINFO } from '../constants/counter'

const INITIAL_STATE = {
  num: 0,
  openid: '',
  session_key: '',
  userid: ''
}

export default function counter (state = INITIAL_STATE, action) {
  switch (action.type) {
    case ADD:
      return {
        ...state,
        num: state.num + 1
      }
     case MINUS:
       return {
         ...state,
         num: state.num - 1
       }
      case UPDATEUSERINFO:
        return {
          ...state,
          openid: action.openid,
          session_key: action.session_key,
          userid: action.userid
        }
     default:
       return state
  }
}
