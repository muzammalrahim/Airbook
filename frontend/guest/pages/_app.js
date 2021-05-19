import App from 'next/app';
import Head from 'next/head';
import Link from 'next/link'
import { useStore } from 'react-redux';
import React from 'react';
import withRedux from "next-redux-wrapper";
import { wrapper } from '../redux/store';
import setupAxios from '../redux/setupAxios';
import { PersistGate } from "redux-persist/integration/react"
import Route from 'next/router'
import { isAuthenticated } from '../helpers/frontend';
import { validateToken } from '../helpers/api';
import { withRouter } from 'next/router'
import 'react-toastify/dist/ReactToastify.css';
import "react-responsive-carousel/lib/styles/carousel.min.css";

function MyApp({ Component, pageProps, router }) {
  const store = useStore((state) => state);
  const [isAuthRoute, setAuthRoute] = React.useState(false);
  setupAxios(store);
  React.useEffect(() => {
    validateToken(store)
    if (isAuthenticated(store) && ['/login', '/register'].indexOf(router.pathname) > -1)
      Route.push('/');
  }, []);

  return (
    <>
      <Component store={store} {...pageProps} />
    </>
  );
}


export default wrapper.withRedux(withRouter(MyApp));