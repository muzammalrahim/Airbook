import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { withRouter } from 'next/router';
import { formatDate, checkValue, getData, getMediaUrl, getTitle, load_meta } from '../../helpers/functions';
import axios from "axios";
import React from 'react';
import Link from 'next/link';
import { isAuthenticated } from '../../helpers/frontend';
import { post } from '../../helpers/api';
import msg from "../../helpers/notifications";
import { connect } from 'react-redux';
import { isMoment } from 'moment';
import *as site from '../../redux/actions/siteActions'

export async function getServerSideProps({ params }) {
  var id = params.detail.split('-');
  let data = [], seo=[];
   // load seo tags
   await load_meta('Company').then((response) => {
    seo = response.data;
  });
  await axios.get(
    process.env.NEXT_PUBLIC_API_URL + `api/companies/${id[0]}/`, {params : {frontend: true}}
  ).then((response) => {
    data = response.data;
  }).catch((error)=> {
    data = []
  })
  return {
    props: { data, params, seo }
  };
}

class CompaniesDetailPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props
    this.state = {
      company: response.data,
      related: {},
      contacts: {},
      isAuthenticate: false,
      sideAdvert: {},
      topAdvert: {},
      message:'',
      submitting: false,
    };
    this.props.search({ type: 'company', value: null, detail:true });
    if(this.state.company.id)
       this.getData();
  }
  
  
  get_description = () => {
    const description_attrs = [
      'name','status','profile',{city:'name'},{country:'name'},'zip_code', 'po_box', 'address','rfq_mail','aog_mail','views',''
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

  getData() {
    let id = this.props.params.detail.split('-')
    let { city } = this.state.company;
    city = city !== null ? (city.id !== null ? city.id : 0) : 0
    let data = [
      { api: `companies/${id[0]}/related_companies/${city}/`, params: {frontend:true}, key: 'related' },
      { api: 'advertisements', params: { section: 'page-sidebar' }, key: 'sideAdvert' },
      { api: 'advertisements', params: { section: 'page-top' }, key: 'topAdvert' },
      { api: 'contacts', params: { company_id: id[0], length: '3' }, key: 'contacts' },
    ]
    getData(this, data);
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps !== this.props) {
     this.setState({company:this.props.data})
    }
  }
  componentDidMount() {
    let {company} = this.state
    if(company.id){
        this.setState({ isAuthenticate: isAuthenticated(this.props.store) })
        post('views', {viewable_id:this.state.company.id, viewable_type:'App\\Company'});
    }
  }
  handleSubmit(e) {
    e.preventDefault();
    let {message, company} = this.state;
    if(message){
      if(isAuthenticated(this.props.store)){
      this.setState({submitting:true});
      post('leads_send_message', {message:message, model:'Company', model_id:company.id}).then((response) => {
        msg.success("Your message has been sended successfully")
        this.setState({submitting:false, message:''});
      }).catch((error)=>{
        this.setState({submitting:false})
        msg.error('Something went wrong....')
      })}else{msg.error("Please login to send message")}
    }
    else{
      msg.error("You are trying to send blank message")
    }
  }
  handleLink = (e)=>{
      e.preventDefault()
    let address = this.state.company.website
    window.location.assign(`https://${address}`)
  }
  render() {
    let { company, submitting, isAuthenticate, related, sideAdvert, topAdvert, contacts } = this.state;
    let title = `${company?.name ? company.name+'-' : ''}`
    let description = `${company?.name ? company.name : ''} ${company?.speciality?.name ? company.speciality.name : ''} ${company?.country?.name ? 'in'+company.country.name : ''} ${company?.name ? 'Browse more on Airbook and connect to people in '+company.name : ''}`
    return (
      <>
        <Header
          seo={this.props.seo}
          data={{
            title: title || null,
            description: description,
            og_image: company?.media?.length
              ? company.media[0].original_file_name
              : null,
          }}
        />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            {company.id ? (
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
                  {checkValue(company.name)}
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
                      formatDate(company.created_at) +
                      " - Updated " +
                      formatDate(company.updated_at)}
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
                  <Link href="/company/p/1">
                    <a className="breadcrumbs-link">Companies</a>
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
                    {checkValue(company.name)}
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
                          Company Profile
                        </h3>
                      </div>
                      {checkValue(company.name) ? (
                        <div className="data-block">
                          <div className="data-label">Name</div>
                          <p className="data-value">{company.name}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.specialities.length > 0) &&
                      (company.specialities.map((speciality) => {
                        return speciality.name + ", ";
                      }) ||
                        "N/A") ? (
                        <div className="data-block">
                          <div className="data-label">Specialty</div>
                          <p className="data-value">
                            {company.specialities.length > 0 &&
                              (company.specialities.map((speciality) => {
                                return speciality.name + ", ";
                              }) ||
                                "N/A")}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.address) ? (
                        <div className="data-block">
                          <div className="data-label">Address</div>
                          <p className="data-value">{company.address}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.country && company.country.name) ? (
                        <div className="data-block">
                          <div className="data-label">Country</div>
                          {checkValue(
                            company.country && company.country.flag
                          ) ? (
                            <div
                              className="svg-flag"
                              style={{
                                backgroundImage: `url(/static/media/site/flags/${company.country.flag})`,
                              }}
                            />
                          ) : (
                            ""
                          )}
                          <p className="data-value">
                            {company.country && company.country.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.po_box) ? (
                        <div className="data-block">
                          <div className="data-label">P.O Box</div>
                          <p className="data-value">{company.po_box}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.zip_code) ? (
                        <div className="data-block">
                          <div className="data-label">ZIP/Postal Code</div>
                          <p className="data-value">{company.zip_code}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.rfq_email) ? (
                        <div className="data-block">
                          <div className="data-label">RFQ Email</div>
                          <a href="#" className="inline-link">
                            {company.rfq_email}
                          </a>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.aog_email) ? (
                        <div className="data-block">
                          <div className="data-label">AOG Email</div>
                          {isAuthenticate ? (
                            <a href="#" className="inline-link">
                              {company.aog_email}
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
                        <h3 className="details-block-headline">eProfile</h3>
                      </div>
                      <div className="data-block file-attachment">
                        <div className="file-block">
                          <a
                            href="#"
                            onClick={this.handleLink}
                            target="_blank"
                            className="data-value file-attachment"
                          >
                            {company.website}
                          </a>
                        </div>
                      </div>
                    </div>
                    {checkValue(company.profile) ? (
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

                          <h3 className="details-block-headline">{`About ${checkValue(
                            company.name
                          )}`}</h3>
                        </div>

                        <div className="data-block file-attachment">
                          <p
                            className="data-value"
                            dangerouslySetInnerHTML={{
                              __html: company.profile,
                            }}
                          ></p>
                        </div>
                      </div>
                    ) : (
                      ""
                    )}
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
                              d="M10.118 16.064c2.293-.529 4.428-.993 3.394-2.945-3.146-5.942-.834-9.119 2.488-9.119 3.388 0 5.644 3.299 2.488 9.119-1.065 1.964 1.149 2.427 3.394 2.945 1.986.459 2.118 1.43 2.118 3.111l-.003.825h-15.994c0-2.196-.176-3.407 2.115-3.936zm-10.116 3.936h6.001c-.028-6.542 2.995-3.697 2.995-8.901 0-2.009-1.311-3.099-2.998-3.099-2.492 0-4.226 2.383-1.866 6.839.775 1.464-.825 1.812-2.545 2.209-1.49.344-1.589 1.072-1.589 2.333l.002.619z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">
                          People on {checkValue(company.name)}
                        </h3>
                      </div>
                      {contacts.length > 0 &&
                        contacts.map((contact, index) => {
                          return (
                            <div
                              className="data-block file-attachment"
                              key={index}
                            >
                              <Link
                                href={{ pathname: `/contact/[detail]` }}
                                as={`/contact/${
                                  contact.id +
                                  "-" +
                                  contact.first_name +
                                  "-" +
                                  contact.last_name
                                }`}
                              >
                                <a target="_blank" className="on-airbook-link">
                                  {checkValue(contact.first_name)}{" "}
                                  {checkValue(contact.last_name)}
                                </a>
                              </Link>
                              <div className="job-title-company-profile">
                                {checkValue(
                                  contact.job_title && contact.job_title.name
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                              fill="currentColor"
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6 17h-12v-2h12v2zm0-4h-12v-2h12v2zm0-4h-12v-2h12v2z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">
                          Assets on Airbook{" "}
                        </h3>
                      </div>
                      {checkValue(company.AbAircrafts.id) ? (
                        <div className="data-block file-attachment">
                          <Link
                            href={{ pathname: `/aircraft/[detail]` }}
                            as={`/aircraft/${
                              company.AbAircrafts.id &&
                              company.AbAircrafts.id +
                                "-" +
                                company.AbAircrafts.title.split("/").join("-")
                            }`}
                          >
                            <a className="item-link-block w-inline-block">
                              <h2 className="item-composite-title">
                                {getTitle(company.AbAircrafts.title)}
                              </h2>
                            </a>
                          </Link>
                          <div className="asset-type-company-profile">
                            Aircraft
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.AbEngines.id) ? (
                        <div className="data-block file-attachment">
                          <Link
                            href={{ pathname: `/engine/[detail]` }}
                            as={`/engine/${
                              company.AbEngines.id &&
                              company.AbEngines.id +
                                "-" +
                                company.AbEngines.title.split("/").join("-")
                            }`}
                          >
                            <a className="item-link-block w-inline-block">
                              <h2 className="item-composite-title">
                                {getTitle(company.AbEngines.title)}
                              </h2>
                            </a>
                          </Link>
                          <div className="asset-type-company-profile">
                            Engines
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.AbApus.id) ? (
                        <div className="data-block file-attachment">
                          <Link
                            href={{ pathname: `/apu/[detail]` }}
                            as={`/apu/${
                              company.AbApus.id &&
                              company.AbApus.id +
                                "-" +
                                company.AbApus.title.split("/").join("-")
                            }`}
                          >
                            <a className="item-link-block w-inline-block">
                              <h2 className="item-composite-title">
                                {getTitle(company.AbApus.title)}
                              </h2>
                            </a>
                          </Link>
                          <div className="asset-type-company-profile">APU</div>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(company.AbWanteds.id) ? (
                        <div className="data-block file-attachment">
                          <Link
                            href={{ pathname: `/wanted/[detail]` }}
                            as={`/wanted/${
                              company.AbWanteds.id &&
                              company.AbWanteds.id +
                                "-" +
                                company.AbWanteds.title.split("/").join("-")
                            }`}
                          >
                            <a className="item-link-block w-inline-block">
                              <h2 className="item-composite-title">
                                {getTitle(company.AbWanteds.title)}
                              </h2>
                            </a>
                          </Link>
                          <div className="asset-type-company-profile">
                            Wanted
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                    <div className="related-items-block">
                      <div className="details-page-headline related-assets">
                        Related Companies
                      </div>
                      {related.length > 0 ? (
                        related.map((company, index) => {
                          return (
                            <div
                              className="w-layout-grid ab-list-grid"
                              key={index}
                            >
                              {index < 4 && (
                                <div className="ab-list-item-wrapper company">
                                  <div className="item-flex-header">
                                    <div className="item-title-block">
                                      <Link
                                        href={{ pathname: `/company/detail` }}
                                        as={`/company/${
                                          company.id &&
                                          company.id + "-" + company.name
                                        }`}
                                      >
                                        <a className="item-link-block w-inline-block">
                                          <h2 className="item-composite-title">
                                            {company.name}
                                          </h2>
                                        </a>
                                      </Link>
                                      {/* <div className="item-h3-block">
                              <h3 className="subtitle">Aerospace</h3>
                            </div> */}
                                    </div>
                                    {/* <div className="item-like-block">
                              <div className="ab-likes w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={14}
                                  height={14}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M5 22h-5v-12h5v12zm17.615-8.412c-.857-.115-.578-.734.031-.922.521-.16 1.354-.5 1.354-1.51 0-.672-.5-1.562-2.271-1.49-1.228.05-3.666-.198-4.979-.885.906-3.656.688-8.781-1.688-8.781-1.594 0-1.896 1.807-2.375 3.469-1.221 4.242-3.312 6.017-5.687 6.885v10.878c4.382.701 6.345 2.768 10.505 2.768 3.198 0 4.852-1.735 4.852-2.666 0-.335-.272-.573-.96-.626-.811-.062-.734-.812.031-.953 1.268-.234 1.826-.914 1.826-1.543 0-.529-.396-1.022-1.098-1.181-.837-.189-.664-.757.031-.812 1.133-.09 1.688-.764 1.688-1.41 0-.565-.424-1.109-1.26-1.221z"
                                  />
                                </svg>
                              </div>
                              <div className="likecount">1000</div>
                            </div> */}
                                  </div>
                                  <div className="item-data-flex">
                                    {getMediaUrl(company.media) ? (
                                      <Link
                                        href={{ pathname: `/company/detail` }}
                                        as={`/company/${
                                          company.id &&
                                          company.id + "-" + company.name
                                        }`}
                                      >
                                        <a className="item-image w-inline-block"></a>
                                      </Link>
                                    ) : (
                                      ""
                                    )}
                                    <div className="item-info-block">
                                      {checkValue(company.contacts) ? (
                                        <div className="flex-specsbox">
                                          <div className="ab-svg-icon w-embed">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width={20}
                                              height={20}
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M10.118 16.064c2.293-.529 4.428-.993 3.394-2.945-3.146-5.942-.834-9.119 2.488-9.119 3.388 0 5.644 3.299 2.488 9.119-1.065 1.964 1.149 2.427 3.394 2.945 1.986.459 2.118 1.43 2.118 3.111l-.003.825h-15.994c0-2.196-.176-3.407 2.115-3.936zm-10.116 3.936h6.001c-.028-6.542 2.995-3.697 2.995-8.901 0-2.009-1.311-3.099-2.998-3.099-2.492 0-4.226 2.383-1.866 6.839.775 1.464-.825 1.812-2.545 2.209-1.49.344-1.589 1.072-1.589 2.333l.002.619z"
                                              />
                                            </svg>
                                          </div>

                                          <p className="item-specs">{`${
                                            company.contacts
                                              ? company.contacts
                                              : "No"
                                          }${
                                            company.contacts === 1
                                              ? " Contact"
                                              : " Contacts"
                                          }`}</p>
                                        </div>
                                      ) : (
                                        ""
                                      )}
                                      {checkValue(company.address) ? (
                                        <div className="flex-specsbox">
                                          {checkValue(
                                            company.country &&
                                              company.country.flag
                                          ) ? (
                                            <div
                                              className="svg-flag"
                                              style={{
                                                backgroundImage: `url(/static/media/site/flags/${company.country.flag})`,
                                              }}
                                            />
                                          ) : (
                                            ""
                                          )}
                                          <div className="country-name">
                                            {company.address
                                              ? company.address
                                              : "Address not Provided"}
                                          </div>
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
                            No related company.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-col-right">
                    {company.media && company.media.exist ? (
                      <div className="image-gallery">
                        <a
                          href="#"
                          className="main-lightbox w-inline-block w-lightbox"
                        >
                          <style jsx>
                            {`.profile-image.company-brand{
														background-image: url(${process.env.NEXT_PUBLIC_API_URL}static/media/uploads/${
                              company.media
                                ? company.media.original_file_name
                                : "placeholder.png"
                            })};
												}`}
                          </style>
                          <div className="profile-image company-brand" />
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
                      {checkValue(company.business_phone) ? (
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
                          {isAuthenticate ? (
                            <a
                              href="tel: + {company.business_phone} "
                              className="profile-link"
                            >
                              {company.business_phone}
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

                      {checkValue(company.business_phone) ? (
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
                          {isAuthenticate ? (
                            <a
                              href="https://wa.me/ + {company.business_phone}"
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
                      {checkValue(company.rfq_email) ? (
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
                          {isAuthenticate ? (
                            <a
                              href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                              className="profile-link"
                            >
                              {company.rfq_email}
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
                      {checkValue(company.website) ? (
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
                                d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm10 12c0 .685-.07 1.354-.202 2h-3.853c.121-1.283.129-2.621 0-4h3.853c.132.646.202 1.315.202 2zm-.841-4h-3.5c-.383-1.96-1.052-3.751-1.948-5.278 2.435.977 4.397 2.882 5.448 5.278zm-5.554 0h-2.605v-5.658c1.215 1.46 2.117 3.41 2.605 5.658zm-4.605-5.658v5.658h-2.605c.488-2.248 1.39-4.198 2.605-5.658zm0 7.658v4h-2.93c-.146-1.421-.146-2.577 0-4h2.93zm0 6v5.658c-1.215-1.46-2.117-3.41-2.605-5.658h2.605zm2 5.658v-5.658h2.605c-.488 2.248-1.39 4.198-2.605 5.658zm0-7.658v-4h2.93c.146 1.421.146 2.577 0 4h-2.93zm-4.711-11.278c-.896 1.527-1.565 3.318-1.948 5.278h-3.5c1.051-2.396 3.013-4.301 5.448-5.278zm-6.087 7.278h3.853c-.121 1.283-.129 2.621 0 4h-3.853c-.132-.646-.202-1.315-.202-2s.07-1.354.202-2zm.639 6h3.5c.383 1.96 1.052 3.751 1.948 5.278-2.435-.977-4.397-2.882-5.448-5.278zm12.87 5.278c.896-1.527 1.565-3.318 1.948-5.278h3.5c-1.051 2.396-3.013 4.301-5.448 5.278z"
                              />
                            </svg>
                          </div>
                          {isAuthenticate ? (
                            <a
                              href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                              className="profile-link"
                            >
                              {company.website}
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
                      Open Linkedin Profile
                    </a>
                  </div> */}
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
                          d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 10h-2v2h2v6h3v-6h1.82l.18-2h-2v-.833c0-.478.096-.667.558-.667h1.442v-2.5h-2.404c-1.798 0-2.596.792-2.596 2.308v1.692z"
                        />
                      </svg>
                    </div>
                    <a
                      href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                      className="profile-link"
                    >
                      Open FaceBook Page
                    </a>
                  </div> */}
                      {checkValue(company.aog_email) ? (
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
                          {isAuthenticate ? (
                            <a
                              href="mailto:+971 55 991 9393?subject=Airbook%20User%20Enquiry"
                              className="profile-link"
                            >
                              {company.aog_email}
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
                          <h3 className="details-block-headline">{`Message ${company.name}`}</h3>
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
                    <a href="#" className="profile-update-block w-inline-block">
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
                      <div className="update-label">Update Company Profile</div>
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
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${process.env.NEXT_PUBLIC_API_URL}company/${this.props.params.detail}`}
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
                          href={`https://www.facebook.com/sharer/sharer.php?u=${process.env.NEXT_PUBLIC_API_URL}company/${this.props.params.detail}`}
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
                          href={`https://api.whatsapp.com/send?text=${process.env.NEXT_PUBLIC_API_URL}company/${this.props.params.detail}`}
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

export default connect(null, site.actions)(withRouter(CompaniesDetailPage));
