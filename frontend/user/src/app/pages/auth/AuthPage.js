import React from "react";
import { Link, Switch, Route, Redirect } from "react-router-dom";
import { toAbsoluteUrl } from "../../../_metronic";
import "../../../_metronic/_assets/sass/pages/login/login-1.scss";
import Login from "./Login";
import Registration from "./Registration";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import { USER_URL } from "../../crud/api";

export default function AuthPage() {
  const today = new Date().getFullYear();
  return (
      <>
        <div className="kt-grid kt-grid--ver kt-grid--root">
          <div
              id="kt_login"
              className="kt-grid kt-grid--hor kt-grid--root kt-login kt-login--v1"
          >
            <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--desktop kt-grid--ver-desktop kt-grid--hor-tablet-and-mobile">
              <div
                  className="kt-grid__item kt-grid__item--order-tablet-and-mobile-2 kt-grid kt-grid--hor kt-login__aside"
                  style={{
                    backgroundImage: `url(${toAbsoluteUrl("/media/bg/bg-4.jpg")})`
                  }}
              >
                <div className="kt-grid__item">
                  <Link to={"/"+USER_URL} className="kt-login__logo">
                    <img
                        style={{height:'30px'}}
                        alt="Logo"
                        src={toAbsoluteUrl("/media/logos/airbook.svg")}
                    />
                  </Link>
                </div>
                <div className="kt-grid__item kt-grid__item--fluid kt-grid kt-grid--ver">
                  <div className="kt-grid__item kt-grid__item--middle">
                    <h3 className="kt-login__title">Welcome to Airbook!</h3>
                    <h4 className="kt-login__subtitle">
                      the all-in-one aviation asset re-marketing platform
                    </h4>
                  </div>
                </div>
                <div className="kt-grid__item">
                  <div className="kt-login__info">
                    <div className="kt-login__copyright">
                      &copy; {today.toString()} Airbook
                    </div>
                    <div className="kt-login__menu">
                      <Link to={"/"+USER_URL+"/terms"} className="kt-link">
                        Privacy
                      </Link>
                      <Link to={"/"+USER_URL+"/terms"} className="kt-link">
                        Legal
                      </Link>
                      <Link to={"/"+USER_URL+"/terms"} className="kt-link">
                        Contact
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="kt-grid__item kt-grid__item--fluid  kt-grid__item--order-tablet-and-mobile-1  kt-login__wrapper">
                <Switch>
                  <Route path={"/"+USER_URL+"/auth/login"} component={Login} />
                  <Route path={"/"+USER_URL+"/auth/registration"} component={Registration} />
                  <Route
                      path={"/"+USER_URL+"/auth/forgot-password"}
                      component={ForgotPassword}
                  />
                  <Route path={"/"+USER_URL+"/auth/reset-password/:password_link"}  component={ResetPassword} />
                  <Redirect from={"/"+USER_URL+"/auth"} exact={true} to={"/"+USER_URL+"/auth/login"} />
                  <Redirect to={"/"+USER_URL+"/auth/login"} />
                </Switch>
              </div>
            </div>
          </div>
        </div>
      </>
  );
}
