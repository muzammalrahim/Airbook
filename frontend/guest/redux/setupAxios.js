import axios from "axios";
import {removeLocalStorage} from '../helpers/api';

export default function setupAxios(store) {
  if(typeof window !== 'undefined') {
    axios.interceptors.request.use(
      config => {
        if(store !== undefined ) {
          const { authToken } = store.getState();
          if (authToken && authToken !== null && authToken !== "null") {
            config.headers.Authorization = `Token ${authToken.replace(/['"]+/g, '')}`;
          }

        }

        return config;
      },
      err => Promise.reject(err)
    );

    axios.interceptors.response.use(
      response => {
        return response
      },
      error => {
        if (error.response !== undefined && 401 === error.response.status) {
          removeLocalStorage();
        }
        return Promise.reject(error)
      }
    )
  }
}
