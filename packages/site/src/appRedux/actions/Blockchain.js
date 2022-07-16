import {
      UPDATE_ADDRESS,
      UPDATE_VIRTUOSO_BALANCE,
      UPDATE_BALANCE,
      UPDATE_VRT1,
      UPDATE_PUBLIC_KEY
} from "../../constants/Blockchain";



export function updateAddress(address) {
  return (dispatch) => {
    dispatch({type: UPDATE_ADDRESS, address});
  }
}

export function updateVirtuosoBalance(virtuosoBalance) {
  return (dispatch) => {
    dispatch({type: UPDATE_VIRTUOSO_BALANCE, virtuosoBalance});
  }
}

export function updateBalance(balance) {
  return (dispatch) => {
    dispatch({type: UPDATE_BALANCE, balance});
  }
}
export function updateVRT1(VRT1) {
  return (dispatch) => {
    dispatch({type: UPDATE_VRT1, VRT1});
  }
}

export function updatePublicKey(publicKey) {
  return (dispatch) => {
    dispatch({type: UPDATE_PUBLIC_KEY, publicKey});
  }
}
