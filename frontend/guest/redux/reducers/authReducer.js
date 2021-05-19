import {actionTypes} from '../actions/authActions'
import {siteActionTypes} from '../actions/siteActions'
import storage from "redux-persist/lib/storage";
import { persistReducer } from "redux-persist";
import {getLocalStorageItem} from '../../helpers/frontend';

let intialState = {
  authToken : getLocalStorageItem('authToken') ,
  user: getLocalStorageItem('user'),
  searchItem:getLocalStorageItem('searchItem'),
  isSearching:getLocalStorageItem('searchItem')
}

const authReducer = (state = intialState, action) => {
    switch (action.type) {
      case actionTypes.login: {
        const { authToken } = action.payload;
        document.cookie = `authToken=${authToken}; path=/`;
        return { authToken, user: undefined };
      }

      case actionTypes.Register: {
        const { authToken } = action.payload;

        return { authToken, user: undefined };
      }

      case actionTypes.Logout: {
        document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
        return {
          authToken:null,
          user:null,
          searchItem:null,
          isSearching:null,
        };
      }

      case actionTypes.UserLoaded: {
        const { user } = action.payload;
        return { ...state, user };
      }

      case siteActionTypes.search: {
        const {searchItem} = action.payload;
        return { ...state, searchItem}
      }

      case siteActionTypes.searching: {
        const {isSearching} = action.payload;
        return { ...state, isSearching}
      }

      default:
        return state;
    }
};

export default authReducer;