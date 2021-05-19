import React from "react";
import Link from 'next/link'
import Head from 'next/head'
import LoginPartial from '../../components/LoginPartial';
import { login, getUserByToken } from '../../helpers/auth';
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { connect } from "react-redux";
import * as auth from "../../redux/actions/authActions";
import LoginHeader from '../../components/LoginHeader';
import msg from "../../helpers/notifications";
import axios from "axios";
import Router, { withRouter } from 'next/router';
import { post } from '../../helpers/api';

const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Wrong email format")
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "Email is required"
    ),
  password: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "Password is required"
    )
});




class Login extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if(this.props.router.query !== null && 'token' in this.props.router.query) {
      let token = this.props.router.query.token
      post('users/verify_email/',{token}).then((response)=>{
        msg.success(`Your email has been verified successfully`);
      }).catch((error)=>{});
    }

    document.querySelector("body").classList.add('header-fixed', 'header-mobile-fixed', 'subheader-enabled', 'subheader-fixed', 'aside-enabled', 'aside-fixed', 'aside-minimize-hoverable');
    document.getElementById("__next").classList.add('d-flex', 'flex-column', 'flex-root');
  }

  handleSubmit = (values, { setStatus, setSubmitting }) => {
    login(values.email, values.password)
      .then(({ data: { token } }) => {
        this.props.login(token);

        setTimeout(function () {
          window.location.assign(`${process.env.NEXT_PUBLIC_USER_URL}/user/dashboard`)
        }, 2000);

      })
      .catch((error) => {
        setSubmitting(false);
        try {
          msg.error(error.response.data.error);
        } catch(e) {
          msg.error("Invalid Credentails");
        }
      });
  }


  render() {
    return (
      <>
        <Head>Sign In</Head>
        <LoginHeader />
        <div className="login login-4 wizard d-flex flex-column flex-lg-row flex-column-fluid">
          <div className="login-container order-2 order-lg-1 d-flex flex-center flex-row-fluid px-7 pt-lg-0 pb-lg-0 pt-4 pb-6 bg-white">
            <div className="login-content d-flex flex-column pt-lg-0 pt-12">
              <a href="/" className="login-logo pb-xl-20 pb-15">
                <img src="/static/images/Airbook.svg" className="max-h-70px max-w-200px" alt="" />
              </a>
              <div className="login-form">
                <Formik
                  initialValues={{ email: "", password: "" }}
                  validationSchema={LoginSchema}
                  onSubmit={this.handleSubmit}
                >
                  {({ touched, errors, isSubmitting }) => (
                    <Form className="form" id="kt_login_singin_form">
                      <div className="pb-5 pb-lg-15">
                        <h3 className="font-weight-bolder text-dark font-size-h2 font-size-h1-lg">Sign In</h3>
                        <div className="text-muted font-weight-bold font-size-h4">New Here?
                        <Link href="/register">
                            <a className="text-primary font-weight-bolder"> Create Account</a>
                          </Link>
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="email" className="font-size-h6 font-weight-bolder text-dark">Your Email</label>
                        <Field
                          type="email"
                          name="email"
                          className={`form-control form-control-solid h-auto py-7 px-6 rounded-lg border-0 ${
                            touched.email && errors.email ? "is-invalid" : ""
                            }`}
                        />
                        <ErrorMessage
                          component="div"
                          name="email"
                          className="invalid-feedback"
                        />
                      </div>
                      <div className="form-group">
                        <div className="d-flex justify-content-between mt-n5">
                          <label htmlFor="password" className="font-size-h6 font-weight-bolder text-dark pt-5">Password</label>
                          <Link href="/auth/forgot">
                            <a className="text-primary font-size-h6 font-weight-bolder text-hover-primary pt-5">Forgot Password ?</a>
                          </Link>
                        </div>
                        <Field
                          type="password"
                          name="password"
                          className={`form-control form-control-solid h-auto py-7 px-6 rounded-lg border-0 ${
                            touched.password && errors.password ? "is-invalid" : ""
                            }`}
                        />
                        <ErrorMessage
                          component="div"
                          name="password"
                          className="invalid-feedback"
                        />
                      </div>
                      <div className="pb-lg-0 pb-5">
                        <button type="submit" id="kt_login_singin_form_submit_button" className={isSubmitting ? "btn btn-primary font-weight-bolder font-size-h6 px-8 py-4 my-3 mr-3 spinner spinner-right spinner-white pr-15" : "btn btn-primary font-weight-bolder font-size-h6 px-8 py-4 my-3 mr-3"} disabled={isSubmitting} >
                          {isSubmitting ? "Please wait " : "Sign In"}
                        </button>

                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
          <LoginPartial />
        </div>

      </>
    )
  }
}


const mapStateToProps = state => ({
  user: state.user,
});

export default connect(mapStateToProps, auth.actions)(withRouter(Login));

