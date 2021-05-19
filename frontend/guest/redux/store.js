import {createStore, applyMiddleware } from 'redux';
import {createWrapper, HYDRATE} from 'next-redux-wrapper';
import rootReducer, {rootSaga} from './reducers/rootReducer';
import thunkMiddleware from "redux-thunk";
import createSagaMiddleware from 'redux-saga';
import {getLocalStorageItem} from "../helpers/frontend"
import AsyncStorage from '@react-native-community/async-storage';
 
 
const saga = createSagaMiddleware();

const bindMiddleware = (middleware) => {
  if (process.env.NODE_ENV !== "production") {
    const { composeWithDevTools } = require("redux-devtools-extension");
    return composeWithDevTools(applyMiddleware(...middleware));
  }
  return applyMiddleware(...middleware);
};

export const makeStore = () => {
/*  if (isServer) {
    //If it's on server side, create a store
    return createStore(rootReducer, bindMiddleware([thunkMiddleware]));
  } else {*/
    //If it's on client side, create a store which will persist
    const { persistStore, persistReducer } = require("redux-persist");
    // const initialState = getLocalStorageItem('auth')
    
    // const storage = AsyncStorage;
    const storage = require("redux-persist/lib/storage").default;

    const persistConfig = {
      key: "demo3-auth",
      // whitelist: ["auth"], // only counter will be persisted, add other reducers if needed
      storage, // if needed, use a safer storage
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer); // Create a new reducer with our existing reducer

    const store = createStore(
	    persistedReducer,
      bindMiddleware([thunkMiddleware, saga])
	  );
    
    store.__persistor = persistStore(store); // This creates a persistor object & push that persisted object to .__persistor, so that we can avail the persistability feature

  	saga.run(rootSaga);
    return store;
  }
// };

// Export the wrapper & wrap the pages/_app.js with this wrapper only
export const wrapper = createWrapper(makeStore);