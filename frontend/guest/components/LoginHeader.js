import Head from 'next/head'
import React from "react";

class LoginHeader extends React.Component {
  componentDidMount() {
    const { bodyClass } = this.props
    document.querySelector("body").classList.add('body')
  }

  render() {
    return (
      <>
        <Head>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Poppins:300,400,500,600,700" />
          <link href="/static/auth/css/login-4.css" rel="stylesheet" type="text/css" />
          <link href="/static/auth/css/plugins.bundle.css" rel="stylesheet" type="text/css" />
          <link href="/static/auth/css/style.bundle.css" rel="stylesheet" type="text/css" /> 
          <meta property="og:title" content=" AirBook "></meta>
          <meta property="og:description" content="Saling aircraft, jets and parts of both."></meta>
          <meta property="og:image" content={process.env.NEXT_PUBLIC_API_URL + "static/images/og.jpg"}></meta>
          <meta property="og:url" content={process.env.NEXT_PUBLIC_API_URL }></meta>
          <meta name="twitter:card" content="summary_large_image"></meta>
          <meta property="og:site_name" content="AirBook, Inc."></meta>
          <meta name="twitter:image:alt" content="AirBook"></meta>
          <link href="/static/images/favicon.png" rel="shortcut icon" type="image/x-icon"></link>
        </Head>

      </>
    );
  }
}

export default LoginHeader