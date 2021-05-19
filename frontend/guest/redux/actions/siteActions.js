import { put, takeLatest, takeEvery } from "redux-saga/effects";
import {getUserByToken} from '../../helpers/auth';

//Action Types
export const siteActionTypes = {
  search: "[search] Action",
  searching: "[searching] Action",

};

export const actions = {
  search: searchItem => ({ type: siteActionTypes.search, payload: { searchItem } }),
  searching: isSearching => ({ type: siteActionTypes.searching, payload: { isSearching } }),
};
