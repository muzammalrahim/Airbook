import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { formatDate, checkValue, getData, getMediaUrl, load_meta, getTitle } from '../../helpers/functions';
import axios from "axios";
import React from 'react';
import Link from 'next/link';
import msg from "../../helpers/notifications";
import { isAuthenticated } from '../../helpers/frontend';
import cookies from 'next-cookies';
import { list, post } from '../../helpers/api';
import { connect } from 'react-redux';
import * as site from '../../redux/actions/siteActions'
// import UserProfile from '../../../user/src/app/partials/layout/UserProfile'

export async function getServerSideProps(ctx) {
  var id = ctx.params.detail.split('-');
  let data = [], seo=[], headers = {
      'Content-Type': 'application/json'
   };
  let {authToken} = cookies(ctx)

  if(authToken !== undefined && authToken !== null)
    headers['Authorization'] = `Token ${authToken.replace(/['"]+/g, '')}`
    // load seo tags
 await load_meta('Contact').then((response) => {
  seo = response.data;
});
  await axios.get(
    process.env.NEXT_PUBLIC_API_URL + `api/contacts/${id[0]}/`, {
      headers : headers, params: {
        search:ctx.query.search,
        page: ctx.query.list,
        filters: ctx.query.filters !== "{}" ? ctx.query.filters : null,
        frontend: true
      }
    }
  ).then((response) => {
    data = response.data;
  }).catch((error)=> {
    data = []
  })
  return {
    props: { data, params:ctx.query, seo }
  };
}
class ContactDetailPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props
    this.state = {
      contact: response.data,
      related: {},
      relatedAircrafts: [],
      relatedEngines: [],
      relatedApus: [],
      relatedWanteds: [],
      isAuthenticate: false,
      sideAdvert: {},
      topAdvert: {},
      message:'',
      submitting: false,
    };
    this.props.search({type:'contact', value:null, detail:true});
    if(this.state.contact.id)
       this.getData()
  }
  
  
  get_description = () => {
    const description_attrs = [
      'first_name','last_name','message',{job_title:'name'}, {country:'name'},'address', 'views','created_at'
    ];

    let description = [];
    description_attrs.map(attr => {
      if(typeof attr === 'object') {
          Object.keys(attr).map(key => {
            if(checkValue(this.props.data[key] && this.props.data[key][attr[key]]))
              description.push(this.props.data[key][attr[key]]);
          });
      } else {
        if(checkValue(this.props.data[attr]))
          description.push(this.props.data[attr]);
      }
    })

    return description.join(', ');
  }

  getData(){
    let id = this.props.params.detail.split('-')
    let { company } = this.state.contact;
    company = company !== null ? (company.id !== null ? company.id : 0) : 0
    let data=[
      {api:`contact/${id[0]}/related_contacts/${company}/`, params:{ user:this.state.contact.id, length:4, frontend:true }, key:'related'},
      {api:`contacts/${id[0]}/aircraft_by_user/`, params:{user:this.state.contact.id, length:4, frontend:true}, key:'relatedAircrafts'},
      {api:`contacts/${id[0]}/engine_by_user/`, params:{user:this.state.contact.id, length:4, frontend:true}, key:'relatedEngines'},
      {api:`contacts/${id[0]}/apu_by_user/`, params:{user:this.state.contact.id, length:4, frontend:true}, key:'relatedApus'},
      {api:`contacts/${id[0]}/wanted_by_user/`, params:{user:this.state.contact.id, length:4, frontend:true}, key:'relatedWanteds'},
      {api:'advertisements', params:{section:'page-top'}, key:'topAdvert'},
      {api:'advertisements', params:{section:'page-sidebar'}, key:'sideAdvert'},
    ]
    getData(this, data);
  }

  In_connection(data){
    let {contact} = this.state
    if(isAuthenticated(this.props.store)){
      if(data.user !== null) {
        post('connections', {conected_user:data.user.id}).then(res=>{
        contact.connected = 1
        this.setState({contact});
        });
      } else {
        msg.error(`No user record exist.`);
      }
    }else{
      msg.error(`You are not logged in. Please log in to connect.`);
    }
  }
  handleChange(e){
      let value = e.target.value;
      let message = value;
      this.setState({message});
  }
  // handleSubmit(){
  //   let {message, contact} = this.state;
  //   if(isAuthenticated(this.props.store)){
  //     post('send_message', {message, user:contact.id, frontend:true}).then(res=>{
  //       msg.success(`Message sent Successfully`);
  //   });
  //   }else{
  //     msg.error(`You are not logged in, please first login....`);
  //   }
  // }
  handleSubmit(e) {
    e.preventDefault();
    let {message, contact} = this.state;
    if(message){
      this.setState({submitting:true});
      post('leads_send_message', {message:message, model:'Contact', model_id:contact.id}).then((response) => {
        msg.success("Your message has been sended successfully")
        this.setState({submitting:false, message:''});
      }).catch((error)=>{
        this.setState({submitting:false})
        msg.error('Please Login to send a message.')
      })
    }
    else{
      msg.error("You are trying to send blank message")
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps !== this.props) {
     this.setState({contact:this.props.data})
    }
  }
  
  componentDidMount(){
    let {contact} = this.state
    if(contact.id){
       post('views', {viewable_id:this.state.contact.id, viewable_type:'App\\Contact'});
       this.setState({ isAuthenticate: isAuthenticated(this.props.store) });
    }
  }

  updateProfile = ()=>{
    window.location.assign(`/user/account-setting`)
  }

  render() {
    let { contact, submitting, isAuthenticate, related, sideAdvert, topAdvert, relatedAircrafts, relatedApus, relatedEngines, relatedWanteds } = this.state;
    let title = `${contact?.first_name ? contact.first_name: ''} ${contact?.last_name ? contact.last_name: ''} `
    let description = `${contact?.first_name ? contact.first_name: ''} ${contact?.last_name ? contact.last_name: ''} ${contact?.job_title?.name ? contact.job_title.name : null} ${contact?.country?.name ? 'from '+contact.country.name : null}. ${contact?.created_at ? 'Member of Airbook since '+contact?.created_at : ''}. Get connected on Airbook. `
    return (
      <>
        <Header
          seo={this.props.seo}
          data={{
            title: title,
            description: description,
            og_image: contact?.media?.length
              ? contact.media[0].original_file_name
              : null,
          }}
        />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            {contact.id ? (
              <>
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
                <h1 className="details-page-headline">
                  {checkValue(contact.first_name) +
                    " " +
                    checkValue(contact.last_name)}
                </h1>
                <div className="publish-date-block">
                  <div className="ab-svg-icon item-update-icon w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={10}
                      height={10}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M18.513 7.119c.958-1.143 1.487-2.577 1.487-4.036v-3.083h-16v3.083c0 1.459.528 2.892 1.487 4.035l3.087 3.68c.566.677.57 1.625.009 2.306l-3.13 3.794c-.937 1.136-1.453 2.555-1.453 3.995v3.107h16v-3.107c0-1.44-.517-2.858-1.453-3.994l-3.13-3.794c-.562-.681-.558-1.629.009-2.306l3.087-3.68zm-.513-4.12c0 1.101-.363 2.05-1.02 2.834l-.978 1.167h-8.004l-.978-1.167c-.66-.785-1.02-1.736-1.02-2.834h12zm-.996 15.172c.652.791.996 1.725.996 2.829h-1.061c-1.939-2-4.939-2-4.939-2s-3 0-4.939 2h-1.061c0-1.104.344-2.039.996-2.829l3.129-3.793c.342-.415.571-.886.711-1.377h.164v1h2v-1h.163c.141.491.369.962.711 1.376l3.13 3.794zm-6.004-1.171h2v1h-2v-1zm0-2h2v1h-2v-1z"
                      />
                    </svg>
                  </div>
                  <div className="date-created-updated">
                    {"Published " +
                      formatDate(contact.created_at) +
                      " - Updated " +
                      formatDate(contact.updated_at)}
                  </div>
                </div>
                <div className="breadcrumb-block">
                  <Link href="/">
                    <a className="breadcrumbs-link">Home</a>
                  </Link>
                  <div className="b-arrow w-embed">
                    <svg
                      width={8}
                      height={8}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    >
                      <path
                        fill="currentColor"
                        d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"
                      />
                    </svg>
                  </div>
                  <Link href="/contact/p/1">
                    <a className="breadcrumbs-link">Contacts</a>
                  </Link>
                  <div className="b-arrow w-embed">
                    <svg
                      width={8}
                      height={8}
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    >
                      <path
                        fill="currentColor"
                        d="M4 .755l14.374 11.245-14.374 11.219.619.781 15.381-12-15.391-12-.609.755z"
                      />
                    </svg>
                  </div>
                  <div className="current-asset">
                    {checkValue(contact.first_name) +
                      " " +
                      checkValue(contact.last_name)}
                  </div>
                </div>
                <div className="flex-wrapper">
                  <div className="flex-col-left">
                    <div className="details-data-block">
                      <div className="label-block">
                        <div className="ab-svg-icon details-page w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.033 16.01c.564-1.789 1.632-3.932 1.821-4.474.273-.787-.211-1.136-1.74.209l-.34-.64c1.744-1.897 5.335-2.326 4.113.613-.763 1.835-1.309 3.074-1.621 4.03-.455 1.393.694.828 1.819-.211.153.25.203.331.356.619-2.498 2.378-5.271 2.588-4.408-.146zm4.742-8.169c-.532.453-1.32.443-1.761-.022-.441-.465-.367-1.208.164-1.661.532-.453 1.32-.442 1.761.022.439.466.367 1.209-.164 1.661z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">
                          Profile Details
                        </h3>
                      </div>
                      {checkValue(contact.first_name) ? (
                        <div className="data-block">
                          <div className="data-label">First Name</div>
                          <p className="data-value">{contact.first_name}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(contact.last_name) ? (
                        <div className="data-block">
                          <div className="data-label">Last Name</div>
                          <p className="data-value">{contact.last_name}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        contact.job_title && contact.job_title.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Job Title</div>
                          <p className="data-value">
                            {contact.job_title && contact.job_title.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(contact.country && contact.country.name) ? (
                        <div className="data-block">
                          <div className="data-label">Company</div>
                          {checkValue(
                            contact.company && contact.company.name
                          ) !== "N/A" ? (
                            <Link
                              href={{ pathname: `/company/detail` }}
                              as={`/company/${
                                contact &&
                                contact.company &&
                                contact.company.id + "-" + contact.company.name
                              }`}
                            >
                              <a className="inline-link">
                                {contact.company && contact.company.name}
                              </a>
                            </Link>
                          ) : (
                            "N/A"
                          )}
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(contact.address) ? (
                        <div className="data-block">
                          <div className="data-label">Address</div>
                          <p className="data-value">{contact.address}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(contact.country && contact.country.name) ? (
                        <div className="data-block">
                          <div className="data-label">Country</div>
                          {checkValue(
                            contact.country && contact.country.flag
                          ) ? (
                            <div
                              className="svg-flag"
                              style={{
                                backgroundImage: `url(/static/media/site/flags/${contact.country.flag})`,
                              }}
                            />
                          ) : (
                            ""
                          )}
                          <p className="data-value">
                            {contact.country && contact.country.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      <div className="data-block">
                        <div className="data-label">Member Since</div>
                        <p className="data-value">
                          {formatDate(contact.created_at, "availability")}
                        </p>
                      </div>
                    </div>
                    <div className="details-data-block">
                      {checkValue(contact.attachment) ? (
                        <div className="label-block">
                          <div className="ab-svg-icon details-page w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                            >
                              <path
                                d="M17.19,11.17l-5.44,5.45a2.71,2.71,0,0,1-3.83-3.83l5.75-5.73A1.62,1.62,0,0,1,16,9.36l-4.6,4.58a.54.54,0,0,1-.77-.77l3.84-3.82-.77-.77L9.83,12.41a1.62,1.62,0,0,0,2.3,2.3l4.6-4.58A2.71,2.71,0,1,0,12.91,6.3L7.16,12a3.79,3.79,0,0,0,5.36,5.36L18,11.93ZM12,2A10,10,0,1,1,2,12,10,10,0,0,1,12,2Zm0-2A12,12,0,1,0,24,12,12,12,0,0,0,12,0Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <h3 className="details-block-headline">
                            Resume &amp; Cover letter
                          </h3>
                        </div>
                      ) : (
                        ""
                      )}
                      {contact.attachment ? (
                        <div className="data-block file-attachment">
                          {contact.attachment ? (
                            <div className="file-block">
                              <div className="attachment-icon w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={16}
                                  height={16}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"
                                  />
                                </svg>
                              </div>
                              <a
                                href="#"
                                target="_blank"
                                className="data-value file-attachment"
                              >
                                Attachment file name
                              </a>
                            </div>
                          ) : (
                            ""
                          )}
                          {contact.attachment ? (
                            <div className="file-block">
                              <div className="attachment-icon w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={18}
                                  height={18}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"
                                  />
                                </svg>
                              </div>

                              <a
                                href="#"
                                target="_blank"
                                className="data-value file-attachment"
                              >
                                Attachment file name
                              </a>
                            </div>
                          ) : (
                            ""
                          )}
                          <div className="file-block">
                            <div className="attachment-icon w-embed">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width={18}
                                height={18}
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fill="currentColor"
                                  d="M21.586 10.461l-10.05 10.075c-1.95 1.949-5.122 1.949-7.071 0s-1.95-5.122 0-7.072l10.628-10.585c1.17-1.17 3.073-1.17 4.243 0 1.169 1.17 1.17 3.072 0 4.242l-8.507 8.464c-.39.39-1.024.39-1.414 0s-.39-1.024 0-1.414l7.093-7.05-1.415-1.414-7.093 7.049c-1.172 1.172-1.171 3.073 0 4.244s3.071 1.171 4.242 0l8.507-8.464c.977-.977 1.464-2.256 1.464-3.536 0-2.769-2.246-4.999-5-4.999-1.28 0-2.559.488-3.536 1.465l-10.627 10.583c-1.366 1.368-2.05 3.159-2.05 4.951 0 3.863 3.13 7 7 7 1.792 0 3.583-.684 4.95-2.05l10.05-10.075-1.414-1.414z"
                                />
                              </svg>
                            </div>
                            <div className="locked-item-block">
                              <div className="ab-svg-icon new-lock w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={12}
                                  height={12}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M6 8v-2c0-3.313 2.687-6 6-6 3.312 0 6 2.687 6 6v2h-2v-2c0-2.206-1.795-4-4-4s-4 1.794-4 4v2h-2zm-3 2v14h18v-14h-18z"
                                  />
                                </svg>
                              </div>
                              <div className="locked-alert">Login to view</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="details-data-block">
                      <div className="label-block">
                        <div className="ab-svg-icon details-page w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                          >
                            <path
                              d="M17.19,11.17l-5.44,5.45a2.71,2.71,0,0,1-3.83-3.83l5.75-5.73A1.62,1.62,0,0,1,16,9.36l-4.6,4.58a.54.54,0,0,1-.77-.77l3.84-3.82-.77-.77L9.83,12.41a1.62,1.62,0,0,0,2.3,2.3l4.6-4.58A2.71,2.71,0,1,0,12.91,6.3L7.16,12a3.79,3.79,0,0,0,5.36,5.36L18,11.93ZM12,2A10,10,0,1,1,2,12,10,10,0,0,1,12,2Zm0-2A12,12,0,1,0,24,12,12,12,0,0,0,12,0Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        {checkValue(contact.first_name) ? (
                          <h3 className="details-block-headline">
                            On Airbook by {contact.first_name}
                          </h3>
                        ) : (
                          ""
                        )}
                      </div>
                      {relatedAircrafts.length > 0 &&
                        relatedAircrafts.map((aircraft, index) => {
                          return (
                            <div
                              className="data-block file-attachment"
                              key={index}
                            >
                              <Link
                                href={{ pathname: `/aircraft/[detail]` }}
                                as={`/aircraft/${
                                  aircraft.id + "-" + aircraft.title
                                }`}
                              >
                                <a target="_blank" className="on-airbook-link">
                                  {getTitle(aircraft.title)}
                                </a>
                              </Link>
                              <div className="asset-type-company-profile">
                                Aircraft
                              </div>
                            </div>
                          );
                        })}
                      {relatedEngines.length > 0 &&
                        relatedEngines.map((engine, index) => {
                          return (
                            <div
                              className="data-block file-attachment"
                              key={index}
                            >
                              <Link
                                href={{ pathname: `/engine/[detail]` }}
                                as={`/engine/${engine.id + "-" + engine.title}`}
                              >
                                <a target="_blank" className="on-airbook-link">
                                  {getTitle(engine.title)}
                                </a>
                              </Link>
                              <div className="asset-type-company-profile">
                                Engine
                              </div>
                            </div>
                          );
                        })}
                      {relatedApus.length > 0 &&
                        relatedApus.map((apu, index) => {
                          return (
                            <div
                              className="data-block file-attachment"
                              key={index}
                            >
                              <Link
                                href={{ pathname: `/apu/[detail]` }}
                                as={`/apu/${apu.id + "-" + apu.title}`}
                              >
                                <a target="_blank" className="on-airbook-link">
                                  {getTitle(apu.title)}
                                </a>
                              </Link>
                              <div className="asset-type-company-profile">
                                Apu
                              </div>
                            </div>
                          );
                        })}
                      {relatedWanteds.length > 0 &&
                        relatedWanteds.map((wanted, index) => {
                          return (
                            <div
                              className="data-block file-attachment"
                              key={index}
                            >
                              <Link
                                href={{ pathname: `/wanted/[detail]` }}
                                as={`/wanted/${wanted.id + "-" + wanted.title}`}
                              >
                                <a target="_blank" className="on-airbook-link">
                                  {getTitle(wanted.title)}
                                </a>
                              </Link>
                              <div className="asset-type-company-profile">
                                Wanted
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    <div className="related-items-block">
                      <div className="details-page-headline related-assets">
                        Related Contacts
                      </div>
                      {related.length > 0 ? (
                        related.map((related, index) => {
                          return (
                            <div
                              className="w-layout-grid ab-list-grid"
                              key={index}
                            >
                              {index < 4 && (
                                <div className="ab-list-item-wrapper contact">
                                  <div className="item-flex-header">
                                    <div className="item-title-block">
                                      <Link
                                        href={{ pathname: `/contact/[detail]` }}
                                        as={`/contact/${
                                          related.id +
                                          "-" +
                                          related.first_name +
                                          "-" +
                                          related.last_name
                                        }`}
                                      >
                                        <a className="item-link-block w-inline-block">
                                          <h2 className="item-composite-title">
                                            {related.first_name +
                                              " " +
                                              related.last_name}
                                          </h2>
                                        </a>
                                      </Link>
                                      <div className="item-h3-block">
                                        <h3 className="subtitle">
                                          {related.job_title &&
                                            related.job_title.name}
                                        </h3>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="item-data-flex">
                                    {getMediaUrl(contact.media) ? (
                                      <Link
                                        href={{ pathname: `/contact/[detail]` }}
                                        as={`/contact/${
                                          related.id +
                                          "-" +
                                          related.first_name +
                                          "-" +
                                          related.last_name
                                        }`}
                                      >
                                        <a
                                          href="contact-profile.html"
                                          aria-current="page"
                                          style={{
                                            backgroundImage: `url(${
                                              '"' +
                                              getMediaUrl(contact.media) +
                                              '"'
                                            })`,
                                          }}
                                          className="item-image w-inline-block w--current"
                                        />
                                      </Link>
                                    ) : (
                                      ""
                                    )}
                                    <div className="item-info-block">
                                      <div className="flex-specsbox">
                                        {related.connected &&
                                        related.connected !== 0 ? (
                                          <div className="connection-status">
                                            {" "}
                                            In connections{" "}
                                          </div>
                                        ) : (
                                          <a
                                            href="#"
                                            className="contact-connect w-button"
                                            onClick={() => {
                                              this.In_connection(related);
                                            }}
                                          >
                                            Connect
                                          </a>
                                        )}
                                      </div>
                                      {checkValue(related.address) ? (
                                        <div className="flex-specsbox">
                                          {checkValue(
                                            contact.country &&
                                              contact.country.flag
                                          ) ? (
                                            <div
                                              className="svg-flag"
                                              style={{
                                                backgroundImage: `url(/static/media/site/flags/${contact.country.flag})`,
                                              }}
                                            />
                                          ) : (
                                            ""
                                          )}
                                          <div className="country-name">
                                            {related.address
                                              ? related.address
                                              : "Address not Provided"}
                                          </div>
                                        </div>
                                      ) : (
                                        ""
                                      )}
                                      {checkValue(
                                        related.company && related.company.name
                                      ) ? (
                                        <div className="flex-specsbox">
                                          <div className="ab-svg-icon w-embed">
                                            <svg
                                              width={14}
                                              height={14}
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fillRule="evenodd"
                                              clipRule="evenodd"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M21 22h2v2h-22v-2h2v-22h18v22zm-10-3h-2v4h2v-4zm4 0h-2v4h2v-4zm4-17h-14v20h2v-5h10v5h2v-20zm-12 11h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-3h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-3h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-3h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"
                                              />
                                            </svg>
                                          </div>
                                          {related.company ? (
                                            <Link
                                              href={{
                                                pathname: `/company/detail`,
                                              }}
                                              as={`/company/${
                                                related &&
                                                related.company &&
                                                related.company.id +
                                                  "-" +
                                                  related.company.name
                                              }`}
                                            >
                                              <a
                                                target="_blank"
                                                className="publisher-link"
                                              >
                                                {related.company &&
                                                  related.company.name}
                                              </a>
                                            </Link>
                                          ) : (
                                            "N/A"
                                          )}
                                        </div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="list-empty mb-10">
                          <div className="ab-svg-icon alert w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.31 7.526c-.099-.807.528-1.526 1.348-1.526.771 0 1.377.676 1.28 1.451l-.757 6.053c-.035.283-.276.496-.561.496s-.526-.213-.562-.496l-.748-5.978zm1.31 10.724c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"
                              ></path>
                            </svg>
                          </div>
                          <div className="no-results-message">
                            No related contact.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-col-right">
                    {contact.media && contact.media.exist ? (
                      <div className="image-gallery">
                        <a
                          href="#"
                          className="main-lightbox w-inline-block w-lightbox"
                        >
                          <style jsx>
                            {`.profile-image{
														background-image: url(${process.env.NEXT_PUBLIC_API_URL}static/media/uploads/${
                              contact.media
                                ? contact.media.original_file_name
                                : "placeholder.png"
                            })};
												}`}
                          </style>
                          <div className="profile-image" />
                        </a>
                      </div>
                    ) : (
                      ""
                    )}
                    <div className="sidebar-data-wrapper">
                      <div className="label-block">
                        <div className="ab-svg-icon details-page w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.033 16.01c.564-1.789 1.632-3.932 1.821-4.474.273-.787-.211-1.136-1.74.209l-.34-.64c1.744-1.897 5.335-2.326 4.113.613-.763 1.835-1.309 3.074-1.621 4.03-.455 1.393.694.828 1.819-.211.153.25.203.331.356.619-2.498 2.378-5.271 2.588-4.408-.146zm4.742-8.169c-.532.453-1.32.443-1.761-.022-.441-.465-.367-1.208.164-1.661.532-.453 1.32-.442 1.761.022.439.466.367 1.209-.164 1.661z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">
                          Contact Preferences
                        </h3>
                      </div>
                      {checkValue(contact.business_phone) ? (
                        <div className="sidebar-data-block">
                          <div className="ab-svg-icon profile-icons w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M18.48 22.926l-1.193.658c-6.979 3.621-19.082-17.494-12.279-21.484l1.145-.637 3.714 6.467-1.139.632c-2.067 1.245 2.76 9.707 4.879 8.545l1.162-.642 3.711 6.461zm-9.808-22.926l-1.68.975 3.714 6.466 1.681-.975-3.715-6.466zm8.613 14.997l-1.68.975 3.714 6.467 1.681-.975-3.715-6.467z"
                              />
                            </svg>
                          </div>
                          {isAuthenticate === true ? (
                            <a href="#" className="profile-link">
                              {contact.business_phone}
                            </a>
                          ) : (
                            <div className="locked-item-block">
                              <div className="ab-svg-icon new-lock w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={12}
                                  height={12}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M6 8v-2c0-3.313 2.687-6 6-6 3.312 0 6 2.687 6 6v2h-2v-2c0-2.206-1.795-4-4-4s-4 1.794-4 4v2h-2zm-3 2v14h18v-14h-18z"
                                  />
                                </svg>
                              </div>
                              <div className="locked-alert">Login to view</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(contact.business_phone) ? (
                        <div className="sidebar-data-block">
                          <div className="ab-svg-icon profile-icons w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                              />
                            </svg>
                          </div>
                          {isAuthenticate === true ? (
                            <a
                              href="https://wa.me/ + {contact.business_phone}"
                              target="_blank"
                              className="profile-link"
                            >
                              WhatsApp Now
                            </a>
                          ) : (
                            <div className="locked-item-block">
                              <div className="ab-svg-icon new-lock w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={12}
                                  height={12}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M6 8v-2c0-3.313 2.687-6 6-6 3.312 0 6 2.687 6 6v2h-2v-2c0-2.206-1.795-4-4-4s-4 1.794-4 4v2h-2zm-3 2v14h18v-14h-18z"
                                  />
                                </svg>
                              </div>
                              <div className="locked-alert">Login to view</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(contact.user && contact.user.email) ? (
                        <div className="sidebar-data-block">
                          <div className="ab-svg-icon profile-icons w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M0 3v18h24v-18h-24zm21.518 2l-9.518 7.713-9.518-7.713h19.036zm-19.518 14v-11.817l10 8.104 10-8.104v11.817h-20z"
                              />
                            </svg>
                          </div>
                          {isAuthenticate === true ? (
                            <a
                              href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                              className="profile-link"
                            >
                              {contact.user && contact.user.email}
                            </a>
                          ) : (
                            <div className="locked-item-block">
                              <div className="ab-svg-icon new-lock w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={12}
                                  height={12}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M6 8v-2c0-3.313 2.687-6 6-6 3.312 0 6 2.687 6 6v2h-2v-2c0-2.206-1.795-4-4-4s-4 1.794-4 4v2h-2zm-3 2v14h18v-14h-18z"
                                  />
                                </svg>
                              </div>
                              <div className="locked-alert">Login to view</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        ""
                      )}
                      {/* <div className="sidebar-data-block">
                    <div className="ab-svg-icon profile-icons w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 8c0 .557-.447 1.008-1 1.008s-1-.45-1-1.008c0-.557.447-1.008 1-1.008s1 .452 1 1.008zm0 2h-2v6h2v-6zm3 0h-2v6h2v-2.861c0-1.722 2.002-1.881 2.002 0v2.861h1.998v-3.359c0-3.284-3.128-3.164-4-1.548v-1.093z"
                        />
                      </svg>
                    </div>
                    <a
                      href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                      className="profile-link"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                  <div className="sidebar-data-block">
                    <div className="ab-svg-icon profile-icons w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 10h-2v2h2v6h3v-6h1.82l.18-2h-2v-.833c0-.478.096-.667.558-.667h1.442v-2.5h-2.404c-1.798 0-2.596.792-2.596 2.308v1.692z"
                        />
                      </svg>
                    </div>
                    <a
                      href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                      className="profile-link"
                    >
                      Facebook Page
                    </a>
                  </div> */}
                      <div className="sidebar-data-block">
                        {contact.connected && contact.connected !== 0 ? (
                          <div className="connection-status">
                            In connections
                          </div>
                        ) : (
                          <a
                            href="#"
                            className="contact-connect sidebar-connect w-button"
                            onClick={() => {
                              this.In_connection(contact);
                            }}
                          >
                            Connect
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="sidebar-data-wrapper">
                      <div className="label-block">
                        <div className="ab-svg-icon details-page w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.019 10.13c-.282-.293-.268-.751.024-1.035l2.974-2.884c.145-.14.332-.211.517-.211.188 0 .375.073.518.22l-4.033 3.91zm-4.888 7.348c-.062.059-.093.139-.093.218 0 .167.136.304.304.304.076 0 .152-.029.212-.086l.499-.486-.422-.436-.5.486zm4.219-5.617l-1.71 1.657c-.918.891-1.387 1.753-1.819 2.958l.754.779c1.217-.395 2.094-.836 3.013-1.728l1.709-1.658-1.947-2.008zm4.985-5.106l-4.402 4.27 2.218 2.29 4.402-4.269c.323-.314.485-.73.485-1.146 0-1.392-1.687-2.13-2.703-1.145z"
                            />
                          </svg>
                        </div>
                        {isAuthenticated(this.props.store) ? (
                          <h3 className="details-block-headline">
                            {"Message " + checkValue(contact.first_name)}
                          </h3>
                        ) : (
                          <h3 className="details-block-headline">
                            Message To Publisher
                          </h3>
                        )}
                      </div>
                      <div className="form-block w-form">
                        <form action="/">
                          <textarea
                            placeholder="Write your message here..."
                            maxLength={250}
                            id="Message"
                            name="Message"
                            value={this.state.message}
                            required
                            autoFocus={false}
                            data-name="Message"
                            className="message-txt w-input"
                            onChange={(e) =>
                              this.setState({ message: e.target.value })
                            }
                          />
                          <button
                            disabled={submitting}
                            className="details-submit-button w-button"
                            onClick={(e) => {
                              this.handleSubmit(e);
                            }}
                          >
                            {submitting === true
                              ? "Please wait...."
                              : "Send Message"}
                          </button>
                        </form>
                        <div className="success-message details-page w-form-done">
                          <div>Thank you! Your message has been sent.</div>
                        </div>
                        <div className="error-message w-form-fail">
                          <div>
                            Oops! Something went wrong while sending message,
                            please try again.
                          </div>
                        </div>
                      </div>
                    </div>
                    <a
                      onClick={() => this.updateProfile()}
                      className="profile-update-block w-inline-block"
                      href="#"
                    >
                      <div className="ab-svg-icon update-icon w-embed">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={18}
                          height={18}
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M13.5 2c-5.629 0-10.212 4.436-10.475 10h-3.025l4.537 5.917 4.463-5.917h-2.975c.26-3.902 3.508-7 7.475-7 4.136 0 7.5 3.364 7.5 7.5s-3.364 7.5-7.5 7.5c-2.381 0-4.502-1.119-5.876-2.854l-1.847 2.449c1.919 2.088 4.664 3.405 7.723 3.405 5.798 0 10.5-4.702 10.5-10.5s-4.702-10.5-10.5-10.5z"
                          />
                        </svg>
                      </div>
                      <div className="update-label">Update Profile</div>
                    </a>
                    <div className="sidebar-data-wrapper">
                      <div className="label-block">
                        <div className="ab-svg-icon details-page w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={18}
                            height={18}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-6 17c1.513-6.587 7-7.778 7-7.778v-2.222l5 4.425-5 4.464v-2.223c0 .001-3.78-.114-7 3.334z"
                            />
                          </svg>
                        </div>
                        <div className="details-block-headline">
                          Share with friends and colleagues
                        </div>
                      </div>
                      <div className="share-flex">
                        <a
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${process.env.NEXT_PUBLIC_API_URL}contact/${this.props.params.detail}`}
                          target="_blank"
                          className="share-widget w-inline-block"
                        >
                          <div className="w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={24}
                              height={24}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 8c0 .557-.447 1.008-1 1.008s-1-.45-1-1.008c0-.557.447-1.008 1-1.008s1 .452 1 1.008zm0 2h-2v6h2v-6zm3 0h-2v6h2v-2.861c0-1.722 2.002-1.881 2.002 0v2.861h1.998v-3.359c0-3.284-3.128-3.164-4-1.548v-1.093z"
                              />
                            </svg>
                          </div>
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${process.env.NEXT_PUBLIC_API_URL}contact/${this.props.params.detail}`}
                          target="_blank"
                          className="share-widget w-inline-block"
                        >
                          <div className="w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={24}
                              height={24}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 10h-2v2h2v6h3v-6h1.82l.18-2h-2v-.833c0-.478.096-.667.558-.667h1.442v-2.5h-2.404c-1.798 0-2.596.792-2.596 2.308v1.692z"
                              />
                            </svg>
                          </div>
                        </a>
                        <a
                          href={`https://api.whatsapp.com/send?text=${process.env.NEXT_PUBLIC_API_URL}contact/${this.props.params.detail}`}
                          target="_blank"
                          className="share-widget w-inline-block"
                        >
                          <div className="w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={24}
                              height={24}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                              />
                            </svg>
                          </div>
                        </a>
                      </div>
                    </div>
                    {sideAdvert &&
                    sideAdvert.media != null &&
                    sideAdvert.is_active === 1 ? (
                      <a
                        href={sideAdvert?.url}
                        target="_blank"
                        className="asset-list-side-advert w-inline-block"
                        style={{
                          backgroundImage:
                            "url(/static/media/uploads/" +
                            sideAdvert.media.original_file_name +
                            ")",
                        }}
                      ></a>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="list-empty">
                  <div className="ab-svg-icon alert w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.31 7.526c-.099-.807.528-1.526 1.348-1.526.771 0 1.377.676 1.28 1.451l-.757 6.053c-.035.283-.276.496-.561.496s-.526-.213-.562-.496l-.748-5.978zm1.31 10.724c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"
                      ></path>
                    </svg>
                  </div>
                  <div className="no-results-message">
                    We couldn&#x27;t find this item. Either it's removed or not
                    being published. Please contact administrator for further
                    details
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        ;
        <Footer />
      </>
    );
  }
}

export default connect(null,site.actions)(ContactDetailPage)
