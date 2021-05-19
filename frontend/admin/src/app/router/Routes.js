/**
 * High level router.
 *
 * Note: It's recommended to compose related routes in internal router
 * components (e.g: `src/pages/auth/AuthPage`, `src/pages/home/HomePage`).
 */

import React from "react";
import { Redirect, Route, Switch, withRouter } from "react-router-dom";
import { shallowEqual, useSelector } from "react-redux";
import { useLastLocation } from "react-router-last-location";
import HomePage from "../pages/home/HomePage";
import AuthPage from "../pages/auth/AuthPage";
import ErrorsPage from "../pages/errors/ErrorsPage";
import LogoutPage from "../pages/auth/Logout";
import { LayoutContextProvider } from "../../_metronic";
import * as routerHelpers from "../router/RouterHelpers";
import axios from 'axios'

export const Routes = withRouter(({ Layout, history }) => {
  const lastLocation = useLastLocation();
  routerHelpers.saveLastLocation(lastLocation);
  const { isAuthorized, menuConfig, userLastLocation, user} = useSelector(
    ({ auth, urls, builder: { menuConfig } }) => ({
      menuConfig,
      isAuthorized: auth.user != null && (auth.user.groups.indexOf(1) > -1 || auth.user.groups.indexOf(3) > -1),
      // userLastLocation: routerHelpers.getLastLocation(),
      userLastLocation: '/admin',
      user: auth.user,
    }),
    shallowEqual
  );
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const  { status } = error.response
      if ( status === 401 || status === 500) {
        localStorage.clear()
        window.location.assign("/admin/auth/login");
      }
     
      return Promise.reject(error);
    }
  );
  const [extra_data, setExtraData] = React.useState(extra_data ? extra_data:{});
  return (
    /* Create `LayoutContext` from current `history` and `menuConfig`. */
    <LayoutContextProvider history={history} menuConfig={menuConfig}>
      <Switch>
        {!isAuthorized ? (
          /* Render auth page when user at `/auth` and not authorized. */
           <AuthPage />
        ) : (
          /* Otherwise redirect to root page (`/`) */
          <Redirect from="/admin/auth" to={userLastLocation} />
        )}

        <Route path="/admin/error" component={ErrorsPage} />
        <Route path="/admin/logout" component={LogoutPage} />

        {!isAuthorized ? (
          /* Redirect to `/auth` when user is not authorized */
          <Redirect to="/admin/auth/login" />
        ) : ( 
          <Layout> 
            <HomePage extra_data={extra_data} setExtraData={setExtraData} user={user} userLastLocation={userLastLocation} />
          </Layout>
        )}
      </Switch>
    </LayoutContextProvider>
  );
});
