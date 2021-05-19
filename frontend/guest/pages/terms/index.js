import React, { Component } from "react";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import cookies from 'next-cookies'
import {list} from '../../helpers/api';
import {randomizeOrdering, load_meta, getData} from '../../helpers/functions';
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
   await load_meta('Airbook_features').then((response) => {
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
      data = response.data.results.find(da=>da.url ==="terms");
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
      terms : response.data,
      topAdvert:{},
    }
    this.getData()
  }
  getTerm(url){
    list(url).then((response)=>{
      let terms = response.data
      let previous= response.extra_data.previous;
      let next= response.extra_data.next;
      this.setState({terms, previous, next})
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
    let {topAdvert, terms} =this.state
    return (
      <div>
        <Header seo={this.props.seo} />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            {topAdvert &&
            topAdvert.media != null &&
            topAdvert.is_active === 1 ? (
              <a
                href={topAdvert?.url}
                target="_blank"
                className="ab-top-page-advert w-inline-block"
                style={{
                  backgroundImage:
                    "url(/static/media/uploads/" +
                    topAdvert.media.original_file_name +
                    ")",
                }}
              ></a>
            ) : (
              ""
            )}
            <div className="general-contents">
              <h1 className="general-page-heading">Terms of Service</h1>
              <div
                className="terms w-richtext"
                dangerouslySetInnerHTML={{ __html: terms.body }}
              ></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
}
