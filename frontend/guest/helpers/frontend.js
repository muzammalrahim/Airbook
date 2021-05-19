
import { makeStore } from '../redux/store';

export function getLocalStorageItem(key) {
  if (typeof localStorage !== "undefined") {
    if (localStorage.getItem('persist:demo3-auth') != null) {
      let data = JSON.parse(localStorage.getItem('persist:demo3-auth'));
      if (key in data)
        return data[key];
    }
  }
  return null
}

export function isAuthenticated(store) {
  if ('user' in store.getState() && store.getState().user !== null && store.getState().user !== "null") {
    if (typeof(store.getState().user.id) !== undefined)
      return true;
    else
      return false;
  }
  return false;
}
