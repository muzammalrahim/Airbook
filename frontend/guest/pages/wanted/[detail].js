import Header from '../../components/Header'
import Footer from '../../components/Footer'
import React from 'react';
import { withRouter } from 'next/router';
import { formatDate, checkValue, getData, likes, getTitle, load_meta } from '../../helpers/functions';
import axios from "axios";
import Link from 'next/link';
import { post } from '../../helpers/api';
import msg from "../../helpers/notifications";
import { connect } from 'react-redux';
import * as site from '../../redux/actions/siteActions';
import { isAuthenticated } from '../../helpers/frontend';


export async function getServerSideProps({ params }) {
  var id = params.detail.split('-');
  let data = [], seo=[];
   // load seo tags
   await load_meta('Wanted').then((response) => {
    seo = response.data;
  });
  await axios.get(
    process.env.NEXT_PUBLIC_API_URL + `api/wanteds/${id[0]}/`,{params:{frontend: true}}
  ).then((response) => {
    data = response.data;
  }).catch((error)=> {
    data = []
  })
  return {
    props: { data, params, seo },
  };
}


class WantedDetailPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props
    this.state = {
      wanted: response.data,
      related: [],
      promoted: response.promoted,
      isAuthenticate: false,
      sideAdvert: response.sideAdvert,
      topAdvert: response.topAdvert,
      message:'',
      submitting: false,
    };
    this.props.search({ type: 'wanted', value:null, detail:true });
    if(this.state.wanted.id)
       this.getData();
  }

  
  get_description = () => {
    const description_attrs = [
      'title','terms',{manufacturer:'name'},{country:"name"},
      {type:'name'}, {model:'name'}, 'yom','type', 'comments', 'views',''
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
    let id = this.props.params.detail.split('-');
    let { manufacturer } = this.state.wanted;
    manufacturer = manufacturer !== null ? manufacturer.id : manufacturer
    let data = [
      { api: `wanteds/${id[0]}/related_wanteds/${manufacturer}/`, params: {}, key: 'related' },
      { api: `wanteds/${id[0]}/promoted_wanteds`, params: {}, key: 'promoted' },
      { api: 'advertisements', params: { section: 'page-top' }, key: 'topAdvert' },
      { api: 'advertisements', params: { section: 'page-sidebar' }, key: 'sideAdvert' },
    ]
    getData(this, data);
  }
  getlikes(id, path) {
    let self = this;
    let related = this.state.related;
    if(isAuthenticated(this.props.store)){
      likes(id, path).then(function (response) {
      if (response.status === 200) {
        related.map((wanted) => {
          if (wanted.id === id) {
            if (wanted.liked === 0) {
              wanted.likes += 1;
              wanted.liked = 1;
            }
            else {
              wanted.likes -= 1;
              wanted.liked = 0;
            }
          }
        })
        self.setState({ related })
      }
    });
  }
  else{
    msg.error(`You are not logged in, please first login....`);
  }
  }
  handleSubmit(e) {
    e.preventDefault();

    let {message, wanted} = this.state;
    if(message){
      if(isAuthenticated(this.props.store)){
      this.setState({submitting:true});
      post('leads_send_message', {message:message, model:'Wanted', model_id:wanted.id}).then((response) => {
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
  componentDidUpdate(prevProps, prevState) {
    if (prevProps !== this.props) {
     this.setState({wanted:this.props.data})
    }
  }
  componentDidMount(){
    let {wanted} = this.state
    if(wanted.id){
      this.setState({ isAuthenticate: isAuthenticated(this.props.store) })
       post('views', {viewable_id:this.state.wanted.id, viewable_type:'App\\Wanted'});
  }
}
  render() {
    let { wanted, isAuthenticate, related, sideAdvert, topAdvert, promoted, submitting } = this.state;
    let title = `${wanted?.title ? wanted.title : ''} ${wanted?.terms ? 'Wanted for'+wanted.terms:''}. e.g., Boeing 737 wanted for lease purchase`
    let description = `${wanted?.title ? wanted.title : ''} ${wanted?.terms ? 'Wanted for'+wanted.terms:''}. Browse more aviation assets in Airbook wanted aircraft, engines, APU and parts listing.`
    return (
      <>
        <Header
          seo={this.props.seo}
          data={{
            title: title || null,
            description: description || null,
            og_image: wanted?.media?.length
              ? wanted.media[0].original_file_name
              : null,
          }}
        />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            {wanted.id ? (
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
                  {wanted.title.split("-").join(" ")}
                </h1>
                <div className="publish-date-block">
                  <div className="ab-svg-icon item-update-icon w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={12}
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
                      formatDate(wanted.created_at) +
                      " - Updated " +
                      formatDate(wanted.updated_at)}
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
                  <Link href="/wanted/p/1">
                    <a className="breadcrumbs-link">Wanted</a>
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
                    {wanted.manufacturer && wanted.manufacturer.name}{" "}
                    {wanted.type_0 && wanted.type_0.name}-
                    {wanted.model && wanted.model.name}
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
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4 14.083c0-2.145-2.232-2.742-3.943-3.546-1.039-.54-.908-1.829.581-1.916.826-.05 1.675.195 2.443.465l.362-1.647c-.907-.276-1.719-.402-2.443-.421v-1.018h-1v1.067c-1.945.267-2.984 1.487-2.984 2.85 0 2.438 2.847 2.81 3.778 3.243 1.27.568 1.035 1.75-.114 2.011-.997.226-2.269-.168-3.225-.54l-.455 1.644c.894.462 1.965.708 3 .727v.998h1v-1.053c1.657-.232 3.002-1.146 3-2.864z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">Commercial</h3>
                      </div>
                      {checkValue(wanted.terms) ? (
                        <div className="data-block">
                          <div className="data-label">Terms</div>
                          <p className="data-value">{wanted.terms}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(wanted.wanted_by) ? (
                        <div className="data-block">
                          <div className="data-label">Wanted by</div>
                          <p className="data-value">
                            {(wanted.wanted_by, "availability")}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(wanted.country && wanted.country.name) ? (
                        <div className="data-block">
                          <div className="data-label">Location</div>
                          {checkValue(wanted.country && wanted.country.flag) ? (
                            <div
                              className="svg-flag"
                              style={{
                                backgroundImage: `url(/static/media/site/flags/${wanted.country.flag})`,
                              }}
                            />
                          ) : (
                            ""
                          )}
                          <p className="data-value">
                            {wanted.country && wanted.country.name}
                          </p>
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
                              fill="currentColor"
                              d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm7.753 18.305c-.261-.586-.789-.991-1.871-1.241-2.293-.529-4.428-.993-3.393-2.945 3.145-5.942.833-9.119-2.489-9.119-3.388 0-5.644 3.299-2.489 9.119 1.066 1.964-1.148 2.427-3.393 2.945-1.084.25-1.608.658-1.867 1.246-1.405-1.723-2.251-3.919-2.251-6.31 0-5.514 4.486-10 10-10s10 4.486 10 10c0 2.389-.845 4.583-2.247 6.305z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">
                          Publisher notes
                        </h3>
                      </div>
                      <div className="data-block">
                        <p className="data-value">{wanted.comments}</p>
                      </div>
                    </div>
                    <div className="related-items-block">
                      <div className="details-page-headline related-assets">
                        Related Wanted
                      </div>
                      {related && related.length > 0 ? (
                        related.map((wanted, index) => {
                          return (
                            <div
                              className="w-layout-grid ab-list-grid"
                              key={index}
                            >
                              <div className="ab-list-item-wrapper">
                                {wanted.is_featured ? (
                                  <div className="premium-tag">Premium</div>
                                ) : (
                                  ""
                                )}
                                <div className="item-flex-header">
                                  <div className="item-title-block">
                                    <Link
                                      href={{ pathname: `/wanted/[detail]` }}
                                      as={`/wanted/${
                                        wanted.id + "-" + wanted.title
                                      }`}
                                    >
                                      <a className="item-link-block w-inline-block">
                                        <h2 className="item-composite-title">
                                          {getTitle(wanted.title, "wanted")}
                                        </h2>
                                      </a>
                                    </Link>
                                    {checkValue(wanted.terms) ? (
                                      <div className="item-h3-block">
                                        <div className="available-label">
                                          Wanted for
                                        </div>
                                        <h3 className="available-value">
                                          {wanted.terms}
                                        </h3>
                                      </div>
                                    ) : (
                                      ""
                                    )}
                                  </div>
                                  <div className="item-like-block">
                                    <div
                                      className="ab-likes w-embed"
                                      onClick={() =>
                                        this.getlikes(wanted.id, "Wanted")
                                      }
                                    >
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
                                    <div className="likecount">
                                      {wanted.likes}
                                    </div>
                                  </div>
                                </div>
                                <div className="item-data-flex">
                                  <div className="item-info-block">
                                    <div className="flex-specsbox">
                                      <p className="item-specs">
                                        {checkValue(wanted.yom) ? (
                                          <span className="spec-span wanted-specs">
                                            {"YOM " + wanted.yom}
                                          </span>
                                        ) : (
                                          ""
                                        )}{" "}
                                        {checkValue(wanted.terms) ? (
                                          <span className="spec-span dot-before">
                                            {wanted.terms}
                                          </span>
                                        ) : (
                                          ""
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex-specsbox">
                                      {checkValue(
                                        wanted.primary_contact &&
                                          wanted.primary_contact.company &&
                                          wanted.primary_contact.company
                                            .country &&
                                          wanted.primary_contact.company.country
                                            .name
                                      ) ? (
                                        <div className="location-box wanted-list">
                                          <div className="ab-svg-icon details-page w-embed">
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width={14}
                                              height={14}
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M12 0c-5.522 0-10 4.395-10 9.815 0 5.505 4.375 9.268 10 14.185 5.625-4.917 10-8.68 10-14.185 0-5.42-4.478-9.815-10-9.815zm0 18c-4.419 0-8-3.582-8-8s3.581-8 8-8 8 3.582 8 8-3.581 8-8 8z"
                                              />
                                            </svg>
                                          </div>
                                          <div className="country-name">
                                            {wanted.primary_contact &&
                                              wanted.primary_contact.company &&
                                              wanted.primary_contact.company
                                                .country &&
                                              wanted.primary_contact.company
                                                .country.name}
                                          </div>
                                        </div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                    <div className="flex-specsbox">
                                      <div className="ab-svg-icon w-embed">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width={18}
                                          height={18}
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M14 18.435v.565h-14v-.583c-.006-1.557.062-2.446 1.854-2.86 1.964-.453 3.901-.859 2.97-2.577-2.762-5.093-.788-7.98 2.176-7.98 2.908 0 4.93 2.78 2.178 7.979-.905 1.708.963 2.114 2.97 2.577 1.797.416 1.859 1.311 1.852 2.879zm10-13.435h-8v2h8v-2zm0 4h-8v2h8v-2zm0 4h-8v2h8v-2zm0 4h-8v2h8v-2z"
                                          />
                                        </svg>
                                      </div>
                                      {isAuthenticate ? (
                                        <Link
                                          href={{
                                            pathname: `/contact/[detail]`,
                                          }}
                                          as={`/contact/${
                                            wanted.primary_contact &&
                                            wanted.primary_contact.id +
                                              "-" +
                                              wanted.primary_contact
                                                .first_name +
                                              "-" +
                                              wanted.primary_contact.last_name
                                          }`}
                                        >
                                          <a className="publisher-link">
                                            {wanted.primary_contact &&
                                              wanted.primary_contact
                                                .first_name +
                                                " " +
                                                wanted.primary_contact
                                                  .last_name}
                                          </a>
                                        </Link>
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
                                          <div className="locked-alert">
                                            Login to view
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
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
                            No related wanted assets.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-col-right">
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
                          Wanted Summary
                        </h3>
                      </div>
                      <div className="sidebar-data-block">
                        <div className="data-label">Wanted Asset</div>
                        <p className="data-value">
                          {wanted.manufacturer && wanted.manufacturer.name}{" "}
                          {wanted.type_0 && wanted.type_0.name}-
                          {wanted.model && wanted.model.name}
                        </p>
                      </div>
                      {checkValue(wanted.yom) ? (
                        <div className="sidebar-data-block">
                          <div className="data-label">YOM</div>
                          <p className="data-value">{wanted.yom}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(wanted.type) ? (
                        <div className="sidebar-data-block">
                          <div className="data-label">Type</div>
                          <p className="data-value text-capitalize">
                            {wanted.type}
                          </p>
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
                          <h3 className="details-block-headline">
                            {"Message " +
                              checkValue(
                                wanted.primary_contact &&
                                  wanted.primary_contact.first_name
                              )}
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
                              d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 22c-3.123 0-5.914-1.441-7.749-3.69.259-.588.783-.995 1.867-1.246 2.244-.518 4.459-.981 3.393-2.945-3.155-5.82-.899-9.119 2.489-9.119 3.322 0 5.634 3.177 2.489 9.119-1.035 1.952 1.1 2.416 3.393 2.945 1.082.25 1.61.655 1.871 1.241-1.836 2.253-4.628 3.695-7.753 3.695z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">Published by</h3>
                      </div>
                      {isAuthenticate ? (
                        <div className="sidebar-publisher">
                          <div className="sidebar-publisher-image" />
                          <div className="sidebar-publisher-info">
                            <div className="profile-block">
                              <Link
                                href={{ pathname: `/contact/[detail]` }}
                                as={`/contact/${
                                  wanted.primary_contact &&
                                  wanted.primary_contact.id +
                                    "-" +
                                    wanted.primary_contact.first_name +
                                    "-" +
                                    wanted.primary_contact.last_name
                                }`}
                              >
                                <a target="_blank" className="sidebar-link">
                                  {wanted.primary_contact &&
                                    wanted.primary_contact.first_name +
                                      " " +
                                      wanted.primary_contact.last_name}
                                </a>
                              </Link>
                              <div className="sidebar-publisher-txt">
                                {wanted.primary_contact &&
                                  wanted.primary_contact.job_title &&
                                  wanted.primary_contact.job_title.name}
                              </div>
                              <div className="member-info">
                                Member since{" "}
                                {formatDate(
                                  wanted.primary_contact &&
                                    wanted.primary_contact.created_at
                                )}
                              </div>
                              <Link
                                href={{ pathname: `/company/detail` }}
                                as={`/company/${
                                  wanted.primary_contact &&
                                  wanted.primary_contact.company &&
                                  wanted.primary_contact.company.id +
                                    "-" +
                                    wanted.primary_contact.company.name
                                }`}
                              >
                                <a
                                  target="_blank"
                                  className="sidebar-link org-name"
                                >
                                  {checkValue(
                                    wanted.primary_contact &&
                                      wanted.primary_contact.company &&
                                      wanted.primary_contact.company.name
                                  )}
                                </a>
                              </Link>
                            </div>
                            {/* <div className="locked-item-block">
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
                      </div> */}
                            <div className="sidebar-country">
                              {checkValue(
                                wanted.country && wanted.country.flag
                              ) ? (
                                <div
                                  className="svg-flag"
                                  style={{
                                    backgroundImage: `url(/static/media/site/flags/${wanted.country.flag})`,
                                  }}
                                />
                              ) : (
                                ""
                              )}
                              {checkValue(
                                wanted.country && wanted.country.name
                              ) ? (
                                <div className="ab-list-data-txt">
                                  {wanted.country && wanted.country.name}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="locked-item-block"
                          style={{ marginTop: "5px" }}
                        >
                          <div
                            className="ab-svg-icon new-lock w-embed"
                            style={{ paddingLeft: "10px" }}
                          >
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
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${process.env.NEXT_PUBLIC_API_URL}wanted/${this.props.params.detail}`}
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
                          href={`https://www.facebook.com/sharer/sharer.php?u=${process.env.NEXT_PUBLIC_API_URL}wanted/${this.props.params.detail}`}
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
                          href={`https://api.whatsapp.com/send?text=${process.env.NEXT_PUBLIC_API_URL}wanted/${this.props.params.detail}`}
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
                    <div className="sidebar-promoted-block">
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
                    {checkValue(promoted && promoted.length > 0) ? (
                      <div className="sidebar-promoted-block">
                        <div className="label-block premium-block">
                          <div className="ab-svg-icon details-page w-embed">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M18.397 17.899l1.019 6.101-7.416-4.554-7.416 4.554 1.48-8.866-6.064-5.828 8.332-1.15 3.668-8.156 3.047 6.773c-.558.526-1.021 1.148-1.365 1.842l-1.682-3.739-2.298 5.109-5.342.738 3.851 3.7-.931 5.575 4.72-2.898 4.72 2.898-.481-2.882c.656.382 1.383.651 2.158.783zm1.103-10.899c-2.486 0-4.5 2.015-4.5 4.5s2.014 4.5 4.5 4.5c2.484 0 4.5-2.015 4.5-4.5s-2.016-4.5-4.5-4.5zm-.469 6.484l-1.688-1.637.695-.697.992.94 2.115-2.169.697.696-2.811 2.867z"
                              />
                            </svg>
                          </div>
                          <div className="premium-listings">
                            Promoted Wanted Assets
                          </div>
                        </div>
                        {promoted && promoted.length > 0 ? (
                          promoted.map((wanted, index) => {
                            return (
                              <div
                                className="w-layout-grid sidebar-promoted-grid"
                                key={index}
                              >
                                <div className="ab-list-item-wrapper sidebar-promoted">
                                  <div className="item-flex-header">
                                    <div className="item-title-block">
                                      <Link
                                        href={{ pathname: `/wanted/[detail]` }}
                                        as={`/wanted/${
                                          wanted.id + "-" + wanted.title
                                        }`}
                                      >
                                        <a className="item-link-block w-inline-block">
                                          <h2 className="item-composite-title">
                                            {getTitle(wanted.title, "wanted")}
                                          </h2>
                                        </a>
                                      </Link>
                                      {checkValue(wanted.terms) ? (
                                        <div className="item-h3-block">
                                          <div className="sidebar-wanted">
                                            Wanted for
                                          </div>
                                          <h3 className="available-value">
                                            {wanted.terms}
                                          </h3>
                                        </div>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                  </div>
                                  <div className="item-data-flex">
                                    <div className="item-info-block">
                                      <p className="sidebar-wanted-cond">
                                        {"YOM " + wanted.yom}
                                      </p>
                                      {checkValue(
                                        wanted.primary_contact &&
                                          wanted.primary_contact.company &&
                                          wanted.primary_contact.company
                                            .country &&
                                          wanted.primary_contact.company.country
                                            .name
                                      ) ? (
                                        <p className="sidebar-loc">
                                          {wanted.primary_contact &&
                                            wanted.primary_contact.company &&
                                            wanted.primary_contact.company
                                              .country &&
                                            wanted.primary_contact.company
                                              .country.name}
                                        </p>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                    :
                                  </div>
                                  {wanted.is_featured ? (
                                    <div className="premium-tag">Premium</div>
                                  ) : (
                                    ""
                                  )}
                                </div>
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
                              No promoted wanted assets.
                            </div>
                          </div>
                        )}
                      </div>
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

export default connect(null,site.actions)(withRouter(WantedDetailPage));
