import React, { Component } from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import axios from 'axios'
import cookies from 'next-cookies'
import { connect } from 'react-redux';
import * as site from "../../redux/actions/siteActions";
import {post} from '../../helpers/api';
import {randomizeOrdering, load_meta} from '../../helpers/functions';
import { isAuthenticated } from '../../helpers/frontend';
import msg from "../../helpers/notifications";



export async function getServerSideProps(ctx) {

  let data = [], seo=[], headers = {
      'Content-Type': 'application/json'
   }, search = '';
  let {authToken} = cookies(ctx)

   // load seo tags
   await load_meta('Help_Support').then((response) => {
    seo = response.data;
  });
  if(authToken !== undefined && authToken !== null)
    headers['Authorization'] = `Token ${authToken.replace(/['"]+/g, '')}`

  if(ctx.query.search !== 'undefined' && ctx.query.search !== undefined)
    search = ctx.query.search

  if (ctx.query.list === 1 || ctx.query.list === '1') // only for page 1
    await randomizeOrdering('AbContactQueries');
  
 
  return {
    props: { data, query:ctx.query, seo}
  };
}

class support extends Component {
	constructor(props) {
    super(props);
    this.state = {
      name:'',
      email:'',
      company:'',
      phone:'',
      message:'',
      submitting: false,
    };
  }

  handleChange = (e)=>{
  this.setState({[e.target.name]:e.target.value})
  }

  handleSubmit= (e)=>{
    let {name, email, company, phone, message} = this.state
    e.preventDefault()
    // if (isAuthenticated(this.props.store)) {
      this.setState({ submitting: true });
      post("contactqueries", {
        name: name,
        email: email,
        company: company,
        phone: phone,
        message: message,
      })
        .then((response) => {
          msg.success("Your message has been sended successfully");
         this.setState({name:'', email:'', company:'', phone:'', message:'',})
        })
        .catch((error) => {
          msg.error("Something went wrong....");
          this.setState({ submitting: false });
        });
    // }else{
    //   msg.error("Please Login first.");
    // }
  }
  render() {
    return (
      <div>
        <Header seo={this.props.seo} />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            <div className="support-hero-div">
              <h1 className="general-h1">Talk to us</h1>
              <h1 className="general-h2">we are here at your service</h1>
              <p className="general-p1">
                Whether you are having difficulty in publishing your assets on
                AirBook, want to share an idea with us or want to advertise on
                airbook, please submit the following contact form and we will be
                at your service.
              </p>
            </div>
            <div className="support-form-div-flex">
              <div className="support-flex-contact">
                <div className="xbs-address">
                  <span className="text-span-2">X B S</span>
                  <br />
                  Business Park - P.O. Box 712430
                  <br />
                  Dubai Aviation City Corporation
                  <br />
                  Al Makhtoum International Airport
                  <br />
                  Dubai, United Arab Emirates.
                </div>
                <img
                  src="images/XBS-New-Icon.svg"
                  loading="lazy"
                  width={100}
                  alt=""
                  className="image-2"
                />
              </div>
              <div className="support-flex-contact">
                <div className="w-form">
                  <form
                    id="wf-form-Support-Form"
                    name="wf-form-Support-Form"
                    data-name="Support Form"
                    onSubmit={this.handleSubmit}
                    action='/'
                  >
                    <input
                      type="text"
                      className="stxt w-input"
                      maxLength={256}
                      name="name"
                      data-name="name"
                      placeholder="name"
                      id="name"
                      required
                      onChange={this.handleChange}
                      value={this.state.name}
                    />
                    <input
                      type="email"
                      className="stxt w-input"
                      maxLength={256}
                      name="email"
                      data-name="email"
                      placeholder="email"
                      id="email-2"
                      required
                      onChange={this.handleChange}
                      value={this.state.email}
                    />
                    <input
                      type="text"
                      className="stxt w-input"
                      maxLength={256}
                      name="company"
                      data-name="company"
                      placeholder="company"
                      id="company"
                      onChange={this.handleChange}
                      value={this.state.company}
                    />
                    <input
                      type="tel"
                      className="stxt w-input"
                      maxLength={256}
                      name="phone"
                      data-name="phone"
                      placeholder="phone"
                      id="phone"
                      required
                      onChange={this.handleChange}
                      value={this.state.phone}
                    />
                    <textarea
                      placeholder="Write something here"
                      maxLength={5000}
                      id="message"
                      name="message"
                      data-name="message"
                      required
                      className="stxt msg w-input"
                      // defaultValue={this.state.message}
                      onChange={this.handleChange}
                      value={this.state.message}
                    />
                    <input
                      type="submit"
                      defaultValue="Send"
                      data-wait="Please wait..."
                      className="submit-button w-button"
                    />
                  </form>
                  <div className="support-success w-form-done">
                    <div>
                      Thank you! Your message has been received. We will reply
                      you shortly.
                    </div>
                  </div>
                  <div className="w-form-fail">
                    <div>
                      Oops! Something went wrong while submitting your message.
                      Please try again.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}

export default connect(null, site.actions)(support)