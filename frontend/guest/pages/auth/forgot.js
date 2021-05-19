import Head from 'next/head'
import React from "react";
import Link from 'next/link';
import LoginPartial from '../../components/LoginPartial';
import LoginHeader from '../../components/LoginHeader';
import * as Yup from "yup";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { requestPassword } from '../../helpers/auth';
import Route from 'next/router';
import msg from "../../helpers/notifications";

const forgotpasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Wrong email format")
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "Email is required"
    )
});

class Forgot extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: ''
    };
  }

  componentDidMount() {
    document.querySelector("body").classList.add('header-fixed', 'header-mobile-fixed', 'subheader-enabled', 'subheader-fixed', 'aside-enabled', 'aside-fixed', 'aside-minimize-hoverable');
    document.getElementById("__next").classList.add('d-flex', 'flex-column', 'flex-root');
  }
  handleChange(e) {
    var email = this.state.email;
    email = e.target.value;
    this.setState({ email: email });
  }

  handleSubmit(e) {
    requestPassword(e.email)
      .then((response) => {
        if (response.status === 200) {
          msg.success('Email has been send');
          Route.push('/login');
        }
      })
      .catch(() => {
        msg.error('Email not found');
      })
  }
  render() {
    return (
      <>
        <LoginHeader />
        <div className="d-flex flex-column flex-root">
          <div className="login login-4 wizard d-flex flex-column flex-lg-row flex-column-fluid">
            <div className="login-container order-2 order-lg-1 d-flex flex-center flex-row-fluid px-7 pt-lg-0 pb-lg-0 pt-4 pb-6 bg-white">
              <div className="login-content d-flex flex-column pt-lg-0 pt-12">
                <a href="/" className="login-logo pb-xl-20 pb-15">
                  <img src="/static/images/Airbook.svg" className="max-h-70px max-w-200px" alt="" />
                </a>
                <div className="login-form">
                  <Formik
                    initialValues={{ email: "" }}
                    validationSchema={forgotpasswordSchema}
                    onSubmit={e => this.handleSubmit(e)}
                  >
                    {({ touched, errors, isSubmitting }) => (
                      <Form className="form" id="kt_login_forgot_form" action="">
                        <div className="pb-5 pb-lg-15">
                          <h3 className="font-weight-bolder text-dark font-size-h2 font-size-h1-lg">Forgotten Password ?</h3>
                          <p className="text-muted font-weight-bold font-size-h4">Enter your email to reset your password</p>
                        </div>
                        <div className="form-group">
                          <Field
                            type="email"
                            name="email"
                            className={`form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6 ${
                              touched.email && errors.email ? "is-invalid" : ""
                              }`}
                            onKeyUp={(e) => this.handleChange(e)}
                            placeholder="Email"
                          />
                          <ErrorMessage
                            component="div"
                            name="email"
                            className="invalid-feedback"
                          />
                        </div>
                        <div className="form-group d-flex flex-wrap">
                          <button type="submit" id="kt_login_forgot_form_submit_button" className="btn btn-primary font-weight-bolder font-size-h6 px-8 py-4 my-3 mr-4">Submit</button>
                          <Link href="/login">
                            <a id="kt_login_forgot_cancel" className="btn btn-light-primary font-weight-bolder font-size-h6 px-8 py-4 my-3">Cancel</a>
                          </Link>

                        </div>
                      </Form>
                    )}
                  </Formik>
                </div>
              </div>
            </div>
            <LoginPartial />
          </div>
        </div>

      </>
    )
  }
}

export default Forgot
