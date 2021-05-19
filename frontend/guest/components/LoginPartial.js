import Head from 'next/head'
import React from "react";

class LoginPartial extends React.Component {
  componentDidMount() {
    const { bodyClass } = this.props
    document.querySelector("body").classList.add('body')
  }

  render() {

    return (
      <>
        <div className="login-aside order-1 order-lg-2 bgi-no-repeat bgi-position-x-right">
          <div className="login-conteiner bgi-no-repeat bgi-position-x-right bgi-position-y-bottom" style={{ backgroundImage: "url(/static/auth/images/login-visual-4.svg)" }}>
            <h3 className="pt-lg-40 pl-lg-20 pb-lg-0 pl-10 py-20 m-0 d-flex justify-content-lg-start font-weight-boldest display5 display1-lg text-white">We Got
            <br />A Surprise
            <br />For You</h3>
          </div>
        </div>
      </>
    );
  }
}

export default LoginPartial