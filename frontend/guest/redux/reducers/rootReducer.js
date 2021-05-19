import authReducer from './authReducer';
import {combineReducers} from 'redux';
import {all} from "redux-saga/effects";

import * as auth from "../actions/authActions";

/*const rootReducer = combineReducers({
    auth: authReducer
});*/
const rootReducer = authReducer

export function* rootSaga() {
  yield all([auth.saga()]);
}

export default rootReducer;