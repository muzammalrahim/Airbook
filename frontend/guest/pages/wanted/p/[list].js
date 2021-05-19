import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { list, post } from '../../../helpers/api';
import React from 'react';
import axios from "axios";
import { Static_Filters, FilterIcon } from '../../../helpers/filters';
import { showFilters, next_link, previous_link, getData, likes, ucwords, availFor, randomizeOrdering, getTitle, load_meta } from '../../../helpers/functions';
import { isAuthenticated } from '../../../helpers/frontend';
import * as site from "../../../redux/actions/siteActions";
import { connect } from "react-redux";
import msg from "../../../helpers/notifications";
import cookies from 'next-cookies'
import ReactDOM from 'react-dom'

export async function getServerSideProps(ctx) {

  let data = [], seo=[], headers = {
      'Content-Type': 'application/json'
   }, search = '';
  let {authToken} = cookies(ctx)

  if(authToken !== undefined && authToken !== null)
    headers['Authorization'] = `Token ${authToken.replace(/['"]+/g, '')}`

  if(ctx.query.search !== 'undefined' && ctx.query.search !== undefined)
    search = ctx.query.search

  if (ctx.query.list === 1 || ctx.query.list === '1') // only for page 1
    await randomizeOrdering('AbWanteds');
 // load seo tags
 await load_meta('Wanted').then((response) => {
  seo = response.data;
});
  await axios.get(process.env.NEXT_PUBLIC_API_URL + `api/wanteds`, {
    headers : headers, params: {
      search:search,
      page: ctx.query.list,
      filters: ctx.query.filters !== "{}" ? ctx.query.filters : null,
      frontend: true
    }
  }
  ).then((response) => {
    data = response.data;
  });
  return {
    props: { data, query:ctx.query, seo}
  };
}

class EngineListPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props
    this.state = {
      wanteds: response.data.results,
      next: response.data.next,
      previous: response.data.previous,
      filters: [],
      selected_filters: response.query.filters ? JSON.parse(response.query.filters) : {},
      filterData: false,
      ids: [],
      show: false,
      currentIndex: {},
      isAuthenticate: false,
      topAdvert: {},
      bottomAdvert: {},
      search_str: response.query.search,
      user: this.props.store.getState().user,
      message:'',
      modal:{show:{display:"none"}, error:{display:"none"}, success:{display:"none"}, button:'Send', onSuccess:{}, form:{display:'block'}},
    };
    this.props.search({ type: 'wanted', value: response.query.search, detail:false });
    this.props.searching(false);
    this.loadModels();
    this.getData();
    this.static_filters = ['type','terms']

    this.filter_keys = {
      AbCountries: 'LOCATION',
      type:'ASSETS TYPE',
      terms:'WANTED TERMS',
    }
  }

  async loadModels() {
    let filters = {};
    let $this = this;
    let models = {
      'AbCountries': { },
    }
    Object.keys(this.state.selected_filters).map((key)=>{
      if(key == "assets_type"){
        filters['type']=this.state.selected_filters[key];
      }
      else if(key == "wanted_terms"){
        filters['terms']=this.state.selected_filters[key];
      }
      else if(key == "location"){
        filters['country']=this.state.selected_filters[key];
      }else{
        filters[key] = this.state.selected_filters[key];
      }
    })
    await post('filter_base_related_abmodels', { 
      models: models, 
      filters:filters, 
      current_model:'AbWanteds',
      related_name:'abwanteds'

    }).then(function (response) {
      filters = []
      // filters.push({ name: 'WANTED TERMS', value: Static_Filters['terms'].value });
      Object.keys($this.filter_keys).map((key) => {
        let values = [];
        if (!($this.static_filters.indexOf(key) > -1 ))
        values.push({
          name: `Wanted${key}`,
          placeholder: `Search ${ucwords($this.filter_keys[key])}`,
          type: 'input'
        })
        response.data[key].map((value) => {
          values.push({ name: value.name, value: value.id, type: 'checkbox' })
        })
        
        if(key === 'type' || key === 'terms')
          filters.unshift({ name: $this.filter_keys[key], value: values })
        else
          filters.push({ name: $this.filter_keys[key], value: values })
      })
    })
    this.setState({ filters })
  }

  getData() {
    let data = [
      { api: 'advertisements', params: { section: 'page-top' }, key: 'topAdvert' },
      { api: 'advertisements', params: { section: 'page-bottom' }, key: 'bottomAdvert' },
    ]
    getData(this, data);
  }

  handleclick(id) {
    let ids = this.state.ids
    if (ids.includes(id)) {
      ids.splice(ids.indexOf(id), 1)
    } else {
      ids=[id]
    }
    this.setState({ ids: ids })
  }
  getListings(url) { 
    let filters = {};
    Object.keys(this.state.selected_filters).map((key)=>{
      if(key == "assets_type"){
        filters['type']=this.state.selected_filters[key];
      }
      else if(key == "wanted_terms"){
        filters['terms']=this.state.selected_filters[key];
      }
      else if(key == "location"){
        filters['country']=this.state.selected_filters[key];
      }else{
        filters[key] = this.state.selected_filters[key];
      }
    })
    filters = JSON.stringify(filters);
    let search = this.state.search_str;
    url = url ? url : 'wanteds';
    list(url, { search, filters, frontend: true }).then((response) => {
      this.setState({
        wanteds: response.data,
        next: response.extra_data.next,
        previous: response.extra_data.previous,
        filterData: true
      });
    })
  }
  componentDidUpdate(prevProps) {
    let response = this.props.data;
    this.props.searching(false);
    if (JSON.stringify(prevProps.data.results) !== JSON.stringify(response.results)) {
      this.setState({
        wanteds: response.results,
        next: response.next,
        previous: response.previous,
        search_str: this.props.query.search,
        selected_filters: this.props.query.filters ? JSON.parse(this.props.query.filters) : Object.keys(this.state.selected_filters).length ? this.state.selected_filters : {}
      });

    }
  }
  componentDidMount() {
    this.setState({ isAuthenticate: isAuthenticated(this.props.store) })
    document.addEventListener('click', this.handleClickOutside, true);
  }
  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside, true);
}
handleClickOutside = event => {
  const domNode = ReactDOM.findDOMNode(this);

  if (!domNode || !domNode.contains(event.target)) {
      this.setState({
          ids: []
      });
  }
}
  getlikes(id, path) {
    let self = this;
    let wanteds = this.state.wanteds;
    if(isAuthenticated(this.props.store)){
      likes(id, path).then(function (response) {
        if (response.status === 200) {
          wanteds.map((wanted) => {
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
          self.setState({ wanteds: wanteds })
        }
      });
    }
    else{
      msg.error(`You are not logged in, please first login....`);
    }
  }
  addFavorite(favouritable_id, favouritable_type){
    let {user, wanteds} = this.state;
    let updated_wanteds = wanteds
    user = typeof(user) === 'string' ? JSON.parse(user) : user ;
    post('favourites', {favouritable_id, favouritable_type, user : user.id }).then((response)=>{
        if(response.status === 201){
          msg.success('The Wanted has been successfully added to favorites....');
          wanteds.map((wanted, index)=>{
            if(wanted.id === favouritable_id){
              updated_wanteds[index].favourite = true;
            }
          })
          this.setState({wanteds:updated_wanteds});
        }
    }).catch((error)=>{
      let err = '';
      Object.keys(error.response.data).map((key)=>{
        err = error.response.data[key];
        err.map((error)=>{
          msg.error(error);
        })
      })
    })
  }
  closeModal(){
    let {modal, message} = this.state;
    modal['show'] = {display:'none'}
    modal['form'] = {display:'block'};
    modal['success'] = {display:'none'};
    modal['onSuccess'] = {};
    message = '';
    this.setState({modal, message})
    document.getElementById("wf-form-message-modal").reset()
  }

  showModal(data){
    let {modal} = this.state;
    if(isAuthenticated(this.props.store)){
      modal['show'] = {display:'block'}
      let currentIndex = data;
      this.setState({currentIndex, modal})
    } else {
      msg.error(`You are not logged in, please first login....`);
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    let {modal, message, currentIndex} = this.state;
    if(message){
      modal['button'] = "Please wait...";
      this.setState({modal});
      post('leads_send_message', {message:message, model:'Wanted', model_id:currentIndex.id}).then((response) => {
        modal['onSuccess'] = {top: '25%', position: 'relative'};
        modal['form'] = {display:'none'};
        modal['success'] = {display:'block'};
        modal['error'] = {display:'none'};
        modal['button'] = "Send";
        this.setState({modal});
      })
    }
    else{
      modal['error'] = {display:'block'}
      this.setState({modal})
    }
  }

  handleReset =() =>{
    this.setState({selected_filters :{} }, () => {

      this.loadModels();
      this.getListings();
    })
  }

  render() {
    let { search_str, modal, wanteds, previous, next, filters, ids, currentIndex, isAuthenticate, topAdvert, bottomAdvert } = this.state;
    next = next_link(next, this);
    previous = previous_link(previous);
    return (
      <>
        <FilterIcon />
        <Header seo={this.props.seo} />
        <div className="message-modal" style={modal.show}>
          <div className="asset-list-modal-wrapper" style={modal.onSuccess}>
            <div
              className="close-modal"
              onClick={() => {
                this.closeModal();
              }}
            >
              <div className="w-embed">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.597 17.954l-4.591-4.55-4.555 4.596-1.405-1.405 4.547-4.592-4.593-4.552 1.405-1.405 4.588 4.543 4.545-4.589 1.416 1.403-4.546 4.587 4.592 4.548-1.403 1.416z"
                  ></path>
                </svg>
              </div>
            </div>
            <div className="modal-block">
              <div className="modal-form-block w-form">
                <form
                  id="wf-form-message-modal"
                  action="/"
                  name="wf-form-message-modal"
                  data-name="message modal"
                  className="asset-modal-form"
                  style={modal.form}
                >
                  <div className="text-block">
                    Message,{" "}
                    {currentIndex.primary_contact &&
                      currentIndex.primary_contact.first_name}{" "}
                    {currentIndex.primary_contact &&
                      currentIndex.primary_contact.last_name}
                  </div>
                  <a href="#" target="_blank" className="modal-regarding">
                    {currentIndex.title} available for {currentIndex.offer_for}
                  </a>
                  <textarea
                    onChange={(e) => this.setState({ message: e.target.value })}
                    placeholder="enter your message here..."
                    id="modal-messgae"
                    name="message"
                    required
                    data-name="message"
                    className="modal-msg-box w-input"
                  ></textarea>
                  <div className="modal-submit-block">
                    <button
                      disabled={modal.button !== "Send"}
                      className="modal-submit w-button"
                      onClick={(e) => {
                        this.handleSubmit(e);
                      }}
                    >
                      {modal.button}
                    </button>
                  </div>
                  <div className="modal-info">
                    <div className="ab-svg-icon modal-icon w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M13.25 7c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25.56-1.25 1.25-1.25 1.25.56 1.25 1.25zm10.75 5c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12 12 5.373 12 12zm-2 0c0-5.514-4.486-10-10-10s-10 4.486-10 10 4.486 10 10 10 10-4.486 10-10zm-13-2v2h2v6h2v-8h-4z"
                        ></path>
                      </svg>
                    </div>
                    <div>You will receive a copy of this message.</div>
                  </div>
                </form>
                <div
                  className="modal-message-success w-form-done"
                  style={modal.success}
                >
                  <div className="text-block-2">
                    <span>Thank you! </span>
                    <br />
                    Message sent to Zulqarnain.
                    <br />
                    <br />
                    Copy of this message has been sent to you.
                  </div>
                </div>
                <div className="w-form-fail" style={modal.error}>
                  <div>
                    Oops! Something went wrong. Please try again in a moment.
                  </div>
                </div>
              </div>
              <div className="asset-message-modal-brand">
                <img
                  src="/static/images/Airbook.svg"
                  width="100"
                  alt="Airbook - Aviation Market Place"
                  className="image"
                />
              </div>
            </div>
          </div>
        </div>
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
            <div className="ab-page-main-content">
              <div className="filter-block">
                <div className="filter-block-title">
                  <div className="filyer-icon">
                    <div className="ab-svg-icon filters w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={14}
                        height={14}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M1 0h22l-9 15.094v8.906l-4-3v-5.906z"
                        />
                      </svg>
                      <div className="filters-label">Search Filters</div>
                    </div>
                  </div>
                  <button
                    className="reset_btn w-button"
                    onClick={() => this.handleReset()}
                  >
                    {" "}
                    Reset
                  </button>
                  <a href="#" className="filter-close w-button">
                    Close
                  </a>
                </div>
                <div className="filter-block-content">
                  <div className="filter-form-block w-form">
                    <form
                      id="wf-form-filter-form"
                      action="/"
                      name="wf-form-filter-form"
                      data-name="filter form"
                      className="filter-form"
                    >
                      {showFilters(filters, this, "Wanted")}
                    </form>
                    <div className="w-form-done">
                      <div>Airbook search filters</div>
                    </div>
                    <div className="w-form-fail">
                      <div>Airbook search filters</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="list-block">
                {availFor(this, "wanted") !== "" && (
                  <div className="ab-page-title-block">
                    <h1 className="page-title">Wanted assets</h1>
                    <p className="ab-page-description">
                      {" for " + availFor(this, "wanted")}
                    </p>
                  </div>
                )}
                <div className="w-layout-grid ab-list-grid">
                  {wanteds &&
                    wanteds.map((wanted, index) => {
                      return (
                        <div className="ab-list-item-wrapper" key={index}>
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
                                  wanted.id &&
                                  wanted.id +
                                    "-" +
                                    wanted.title.split("/").join("-")
                                }`}
                              >
                                <a className="item-link-block w-inline-block">
                                  <h2 className="item-composite-title">
                                    {getTitle(wanted.title, "wanted")}
                                  </h2>
                                </a>
                              </Link>
                              {wanted.terms ? (
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
                                  className={wanted.liked !== 0 ? "liked" : ""}
                                >
                                  <path
                                    fill="currentColor"
                                    d="M5 22h-5v-12h5v12zm17.615-8.412c-.857-.115-.578-.734.031-.922.521-.16 1.354-.5 1.354-1.51 0-.672-.5-1.562-2.271-1.49-1.228.05-3.666-.198-4.979-.885.906-3.656.688-8.781-1.688-8.781-1.594 0-1.896 1.807-2.375 3.469-1.221 4.242-3.312 6.017-5.687 6.885v10.878c4.382.701 6.345 2.768 10.505 2.768 3.198 0 4.852-1.735 4.852-2.666 0-.335-.272-.573-.96-.626-.811-.062-.734-.812.031-.953 1.268-.234 1.826-.914 1.826-1.543 0-.529-.396-1.022-1.098-1.181-.837-.189-.664-.757.031-.812 1.133-.09 1.688-.764 1.688-1.41 0-.565-.424-1.109-1.26-1.221z"
                                  />
                                </svg>
                              </div>
                              <div className="likecount">{wanted.likes}</div>
                            </div>
                          </div>
                          <div className="item-data-flex">
                            <div className="item-info-block">
                              <div className="flex-specsbox">
                                <p className="item-specs">
                                  {wanted.yom ? (
                                    <span className="spec-span wanted-specs">
                                      {"YOM " + wanted.yom}
                                    </span>
                                  ) : (
                                    ""
                                  )}
                                  {wanted.terms ? (
                                    <span className="spec-span dot-before">
                                      {wanted.terms}
                                    </span>
                                  ) : (
                                    ""
                                  )}
                                </p>
                              </div>
                              {wanted.primary_contact &&
                              wanted.primary_contact.company &&
                              wanted.primary_contact.company.country &&
                              wanted.primary_contact.company.country.name ? (
                                <div className="flex-specsbox">
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
                                      {
                                        wanted.primary_contact.company.country
                                          .name
                                      }
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                ""
                              )}
                              <div className="flex-specsbox">
                                {isAuthenticate && wanted.primary_contact ? (
                                  <>
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
                                    <Link
                                      href={{ pathname: `/contact/[detail]` }}
                                      as={`/contact/${
                                        wanted.primary_contact.id +
                                        "-" +
                                        wanted.primary_contact.first_name +
                                        "-" +
                                        wanted.primary_contact.last_name
                                      }`}
                                    >
                                      <a className="publisher-link">
                                        {wanted.primary_contact &&
                                          wanted.primary_contact
                                            .first_name}{" "}
                                        {wanted.primary_contact &&
                                          wanted.primary_contact.last_name}
                                      </a>
                                    </Link>
                                  </>
                                ) : !isAuthenticate ? (
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
                                ) : (
                                  ""
                                )}
                              </div>
                            </div>
                            <div className="ab-list-item-widget">
                              <div
                                data-delay={0}
                                className="ab-list-item-menu w-dropdown"
                              >
                                <div className="ab-list-item-menu-toggle w-dropdown-toggle">
                                  <div
                                    className="asset-dot-menu"
                                    onClick={() => this.handleclick(index)}
                                  >
                                    <div className="dot" />
                                    <div className="dot" />
                                    <div className="dot" />
                                  </div>
                                </div>
                                <nav
                                  className={`ab-list-item-dropdown w-dropdown-list ${
                                    ids.includes(index) && "w--open"
                                  }`}
                                >
                                  <a
                                    onClick={() => this.showModal(wanted)}
                                    href="#"
                                    className="list-item-menu-main w-dropdown-link"
                                  >
                                    Send message
                                  </a>
                                  {wanted.favourite !== true && (
                                    <a
                                      href="#"
                                      className="list-item-menu-link w-dropdown-link"
                                      onClick={() => {
                                        this.addFavorite(
                                          wanted.id,
                                          "App\\Wanted"
                                        );
                                      }}
                                    >
                                      Add to favorite
                                    </a>
                                  )}
                                  <Link
                                    href={{ pathname: `/wanted/[detail]` }}
                                    as={`/wanted/${
                                      wanted.id &&
                                      wanted.id +
                                        "-" +
                                        wanted.title.split("/").join("-")
                                    }`}
                                  >
                                    <a className="list-item-menu-link w-dropdown-link">
                                      View more details
                                    </a>
                                  </Link>
                                  <div className="list-item-menu-link social-elements">
                                    <a
                                      href={`https://www.linkedin.com/shareArticle?mini=true&url=${
                                        process.env.NEXT_PUBLIC_API_URL
                                      }wanted/${
                                        wanted.id &&
                                        wanted.id + "-" + wanted.title
                                      }`}
                                      target="_blank"
                                      className="menu-social w-inline-block"
                                    >
                                      <div className="w-embed">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 8c0 .557-.447 1.008-1 1.008s-1-.45-1-1.008c0-.557.447-1.008 1-1.008s1 .452 1 1.008zm0 2h-2v6h2v-6zm3 0h-2v6h2v-2.861c0-1.722 2.002-1.881 2.002 0v2.861h1.998v-3.359c0-3.284-3.128-3.164-4-1.548v-1.093z"
                                          ></path>
                                        </svg>
                                      </div>
                                    </a>
                                    <a
                                      href={`https://www.facebook.com/sharer/sharer.php?u=${
                                        process.env.NEXT_PUBLIC_API_URL
                                      }wanted/${
                                        wanted.id &&
                                        wanted.id + "-" + wanted.title
                                      }`}
                                      target="_blank"
                                      className="menu-social w-inline-block"
                                    >
                                      <div className="w-embed">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 10h-2v2h2v6h3v-6h1.82l.18-2h-2v-.833c0-.478.096-.667.558-.667h1.442v-2.5h-2.404c-1.798 0-2.596.792-2.596 2.308v1.692z"
                                          ></path>
                                        </svg>
                                      </div>
                                    </a>
                                    <a
                                      href={`https://api.whatsapp.com/send?text=${
                                        process.env.NEXT_PUBLIC_API_URL
                                      }wanted/${
                                        wanted.id &&
                                        wanted.id + "-" + wanted.title
                                      }`}
                                      target="_blank"
                                      className="menu-social w-inline-block"
                                    >
                                      <div className="w-embed">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"
                                          ></path>
                                        </svg>
                                      </div>
                                    </a>
                                  </div>
                                </nav>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="list-pagniation">
                  {previous && (
                    <Link
                      href={`/wanted/p/[list]?filters=${JSON.stringify(
                        this.state.selected_filters
                      )}&search=${search_str}`}
                      as={`/wanted/p/${previous}`}
                    >
                      <a className="pagination-button w-button">Previous</a>
                    </Link>
                  )}
                  {next && (
                    <Link
                      href={`/wanted/p/[list]?filters=${JSON.stringify(
                        this.state.selected_filters
                      )}&search=${search_str}`}
                      as={`/wanted/p/${next}`}
                    >
                      <a className="pagination-button w-button">Next</a>
                    </Link>
                  )}
                </div>
                {wanteds.length === 0 && (
                  <div className="list-empty">
                    <div className="ab-svg-icon alert w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.31 7.526c-.099-.807.528-1.526 1.348-1.526.771 0 1.377.676 1.28 1.451l-.757 6.053c-.035.283-.276.496-.561.496s-.526-.213-.562-.496l-.748-5.978zm1.31 10.724c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"
                        />
                      </svg>
                    </div>
                    <div className="no-results-message">
                      We couldn't find results to match your search. Please try
                      again with different keywords.
                    </div>
                  </div>
                )}
                {bottomAdvert &&
                bottomAdvert.media != null &&
                bottomAdvert.is_active === 1 ? (
                  <a
                    href={bottomAdvert?.url}
                    target="_blank"
                    className="asset-list-footer-advert w-inline-block"
                    style={{
                      backgroundImage:
                        "url(/static/media/uploads/" +
                        bottomAdvert.media.original_file_name +
                        ")",
                    }}
                  ></a>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
}

export default connect(null, site.actions)(EngineListPage);
