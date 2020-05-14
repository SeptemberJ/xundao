import { ADD, MINUS, UPDATEUSERINFO, CHANGETAB} from '../constants/counter'

const INITIAL_STATE = {
  num: 0,
  openid: '',
  session_key: '',
  userid: '',
  tabIdx: 0
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
      case CHANGETAB:
        return {
          ...state,
          tabIdx: action.tabIdx
        }
     default:
       return state
  }
}
