import axios from "axios";
import {actionTypes} from '../redux/actions/authActions'

// export const API_URL = "http://localhost:8000/api/";
export const API_URL = process.env.NEXT_PUBLIC_API_URL + 'api/';
export const MEDIA_URL = process.env.NEXT_PUBLIC_API_URL + 'static/media/uploads/';


export const headers = {
  'Content-Type': 'application/json',
  // 'Authorization': 'Token 2f2b7961077264b154a140b3111d2063add5f442'
}

export function getToken() {
  var token = null;
  if (localStorage.getItem('persist:demo3-auth') != null) {
    token = JSON.parse(localStorage.getItem('persist:demo3-auth')).authToken;
    if (token != undefined)
      var token = token.replace(/['"]+/g, '');
    else
      token = null;
  }
  return token;
}
export function setLocalStorageItem(key, value) {
  let data = {};
  if (localStorage.getItem('airbook-custom') != null)
    data = JSON.parse(localStorage.getItem('airbook-custom'));
  data[key] = value;
  localStorage.setItem('airbook-custom', JSON.stringify(data));
}

export function removeLocalStorage() {
  localStorage.removeItem('persist:demo3-auth');
  document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
}

export function validateToken(store) {
  let token = getToken();
  if(token !== null && token !== 'null') {
    axios.post(API_URL+'validate-token', {token:token}).then((data) => {
      document.cookie = `authToken=${token}; path=/`;
    }).catch((error) =>{
      removeLocalStorage()
      if(store !== undefined && store !== 'undefined')
        store.dispatch({type: actionTypes.Logout})
    });
  } else {
      removeLocalStorage()
      if(store !== undefined && store !== 'undefined')
        store.dispatch({type: actionTypes.Logout})
    }
}

export function list(endpoint, params={}) {
	let config = {
	  headers: headers,
	  params: params,
	}
	let URL = endpoint.includes("http") ? endpoint : API_URL+endpoint;
	return axios.get(URL, config).then(response => {
		if(response.data.results != undefined) {
			// pagination response handling there :)
			response.extra_data = {
				count : response.data.count,
				next : response.data.next,
				previous : response.data.previous,
			}
			response.data = response.data.results;
    }
		return response;
	})
}

export function patch(endpoint, data) {
  let config = {
    headers: headers,
  }
  return axios.patch(API_URL + endpoint, data, config)
}

export function post(endpoint, data) {
  let config = {
    headers: headers,
  }
  return axios.post(API_URL + endpoint, data, config)
}

export function del(endpoint, data = {}) {
  let config = {
    headers: headers,
    data: data,
  }
  return axios.delete(API_URL + endpoint, config)
}