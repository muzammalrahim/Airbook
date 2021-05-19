import React, { Component } from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import Link from "next/link";
import cookies from 'next-cookies'
import {list} from '../../helpers/api';
import {randomizeOrdering, load_meta} from '../../helpers/functions';
import axios from 'axios'

export async function getServerSideProps(ctx) {

  let data = [], seo=[], headers = {
      'Content-Type': 'application/json'
   }, search = '';
  let {authToken} = cookies(ctx)

  if(authToken !== undefined && authToken !== null)
    headers['Authorization'] = `Token ${authToken.replace(/['"]+/g, '')}`

  if(ctx.query.search !== 'undefined' && ctx.query.search !== undefined)
    search = ctx.query.search
     // load seo tags
   await load_meta('About_Airbook').then((response) => {
    seo = response.data;
  });
    if (ctx.query.list === 1 || ctx.query.list === '1') // only for page 1
    await randomizeOrdering('AbCms');

    await axios.get(process.env.NEXT_PUBLIC_API_URL + `api/cms`, {
      headers:headers,
      params: {
        page: ctx.query.list,
        frontend: true,
        url: "terms"
      }
    }
    ).then((response) => {
      data = response.data.results.find(da=>da.url ==="about-airbook");
    });
  return {
    props: { data, query:ctx.query, seo}
  };
}

export default class support extends Component {
  constructor(props) {
    super(props);
    let response = this.props
    this.state ={
      about : response.data,
      topAdvert:{},
    }
  }
  getTerm(url){
    list(url).then((response)=>{
      let about = response.data
      let previous= response.extra_data.previous;
      let next= response.extra_data.next;
      this.setState({about, previous, next})
    })
  }
  getData(){
    let data=[
      {api:'advertisements', params:{section:'page-top'}, key:'topAdvert'},
      {api:'advertisements', params:{section:'page-bottom'}, key:'bottomAdvert'},
    ]
    getData(this, data);
  }
  render() {
    return (
      <div>
        <Header seo={this.props.seo} />
        <div>
          <div className="ab-page-content">
            <div className="ab-container w-container">
              <div className="about-page-banner">
                <h1 className="about-h1">About Airbook</h1>
                <p className="paragraph">
                  Airbook is advanced re-marketing platform for your aircraft,
                  helicopters, engines, APU, Parts and wanted assets. Airbook is
                  built on modern technology which serves the contents across
                  any device in a neat and clean format as well allowing easy to
                  search and sort. It gives full power to the airlines/aircraft
                  operators and aircraft owners to manage their fleet using the
                  advance control panel.
                  <br />
                  <br />
                  Airbook is a product of XBS
                </p>
                <Link href="/support/" as={`/support/`}>
                      <a className="about-contact w-button"> Contact us</a>
                    </Link>
              </div>
            </div>
          </div>
          <div className="about-sec-1">
            <div className="about-vision">
              <h2 className="about-vision-statement">
                Our mission is to serve the aviation industry with <br />
                innovative internet re-marketing solutions
              </h2>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}
