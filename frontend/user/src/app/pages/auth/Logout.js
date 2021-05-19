import React, { Component } from "react";
import * as auth from "../../store/ducks/auth.duck";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { LayoutSplashScreen } from "../../../_metronic";
import { USER_URL } from "../../crud/api";
import { logoutUser } from "../../crud/auth.crud";

class Logout extends Component {
  componentDidMount() {
    logoutUser().then(response => {
  		document.cookie = `authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    	this.props.logout()
    });
  }

  render() {
    const { hasAuthToken } = this.props;

    return hasAuthToken ? <LayoutSplashScreen /> : window.location.assign(process.env.REACT_APP_GUEST_URL);
  }
}

export default connect(
  ({ auth }) => ({ hasAuthToken: Boolean(auth.authToken) }),
  auth.actions
)(Logout);
