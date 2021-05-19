import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { list, post } from '../../../helpers/api';
import { showFilters, next_link, previous_link, getData, likes, ucwords, getMediaUrl, randomizeOrdering, checkValue, load_meta } from '../../../helpers/functions';
import { FilterIcon } from '../../../helpers/filters';
import { isAuthenticated } from '../../../helpers/frontend';
import React from 'react';
import axios from "axios";
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
    await randomizeOrdering('AbContacts');
 // load seo tags
 await load_meta('Contact').then((response) => {
  seo = response.data;
});
  await axios.get(process.env.NEXT_PUBLIC_API_URL + `api/contacts`, {
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

class ContactListPage extends React.Component {
  constructor(props) {
    super(props);

    let response = this.props;
    this.state = {
      contacts: response.data.results,
      next: response.data.next,
      previous: response.data.previous,
      filters: [],
      selected_filters: response.query.filters ? JSON.parse(response.query.filters) : {},
      filterData: false,
      ids: [],
      topAdvert: {},
      bottomAdvert: {},
      connections: null,
      search_str: response.query.search,
      isAuthenticate: false,
    };
    this.props.search({type:'contact', value:response.query.search, detail:false});
    this.props.searching(false);
    this.loadModels();
    this.getData();

    this.filter_keys = {
      AbTitles: 'JOB TITLE',
      AbCompanies: 'COMPANY',
      AbCountries: 'COUNTRY',
    }

  }

  async loadModels() {
    let filters  = [];
    let $this = this;
    let models = {
      'AbTitles': {},
      'AbCompanies': { },
      'AbCountries': {},
    }
    await post('filter_base_related_abmodels', { 
      models: models, 
      filters:this.state.selected_filters, 
      current_model:'AbContacts',
      related_name:'contact'

    }).then(function (response) {
      Object.keys($this.filter_keys).map((key) => {
        let values = [];
        values.push({
          name:`Contact${key}`, 
          placeholder:`Search ${ucwords($this.filter_keys[key])}`, 
          type:'input'
        })
        response.data[key].map((value) => {
          values.push({ name: value.name, value: value.id, type: 'checkbox' })
        })
        filters.push({ name: $this.filter_keys[key], value: values })
      })
    })
    this.setState({ filters })

  }
  getData(){
    let data=[
      {api:'advertisements', params:{section:'page-top'}, key:'topAdvert'},
      {api:'advertisements', params:{section:'page-bottom'}, key:'bottomAdvert'},
    ]
    getData(this, data);
  }
  getListings(url) {
    let filters = JSON.stringify(this.state.selected_filters);
    let search = this.state.search_str;
    url = url ? url : 'contacts';
    list(url, { search, filters, frontend: true }).then((response) => {
      this.setState({
        contacts: response.data,
        next: response.extra_data.next,
        previous: response.extra_data.previous,
        filterData: true
      });
    })
  }

  In_connection(contact){
    let contacts = this.state.contacts
    if(isAuthenticated(this.props.store)){
      post('connections', {conected_user:contact.user}).then(res=>{
      let newContacts = contacts.map(cont => {
        if(contact.id === cont.id)
          cont.connected = true
        return cont;
      })
      this.setState({contacts:newContacts})
    });
    }else{
      msg.error(`You are not logged in, please first login....`);
    }
  }

  handleclick(id) {
    let ids = this.state.ids
    if (ids.includes(id)) {
      ids.splice(ids.indexOf(id), 1)
    } else {
      ids=[id]
    }
    this.setState({ ids })
  }
  componentDidUpdate(prevProps) {
    let response = this.props.data;
    this.props.searching(false);
    if (JSON.stringify(prevProps.data.results) !== JSON.stringify(response.results)) {
      this.setState({
        contacts: response.results,
        next: response.next,
        previous: response.previous,
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
  handleReset =() =>{
    this.setState({selected_filters :{} }, () => {

      this.loadModels();
      this.getListings();
    })
  }
  render() {
    let {search_str,contacts, previous, next, filters, ids, topAdvert, bottomAdvert,connections} = this.state;
    next = next_link(next, this);
    previous = previous_link(previous);

    return (
      <>
        <FilterIcon />
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
                      <div className="filters-label"> Search Filters</div>
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
                      action="submit"
                      name="wf-form-filter-form"
                      data-name="filter form"
                      className="filter-form"
                    >
                      {showFilters(filters, this, "Contact")}
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
                <div className="ab-page-title-block">
                  <h1 className="page-title">Aviation Professionals</h1>
                  <p className="ab-page-description"> search and connect</p>
                </div>
                <div className="w-layout-grid ab-list-grid">
                  {contacts &&
                    contacts.map((contact, index) => {
                      return (
                        <div
                          className="ab-list-item-wrapper contact"
                          key={index}
                        >
                          <div className="item-flex-header">
                            <div className="item-title-block">
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
                                <a className="item-link-block w-inline-block">
                                  <h2 className="item-composite-title">
                                    {contact.first_name +
                                      " " +
                                      contact.last_name}
                                  </h2>
                                </a>
                              </Link>
                              <div className="item-h3-block">
                                <h3 className="subtitle">
                                  {contact.job_title && contact.job_title.name}
                                </h3>
                              </div>
                            </div>
                            {/* <div className="item-like-block">
                          <div className="ab-likes w-embed" onClick={() => isAuthenticate ? this.getlikes(contact.id, 'Contact') : window.location.href = document.location.origin + '/login'}>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={14}
                              height={14}
                              viewBox="0 0 24 24"
                              className={contact.liked !== 0 ? 'liked' : ''}
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
                            {getMediaUrl(contact.media) ? (
                              <Link
                                href={{ pathname: `/contact/detail` }}
                                as={`/contact/${
                                  contact.id +
                                  "-" +
                                  contact.first_name +
                                  "-" +
                                  contact.last_name
                                }`}
                              >
                                <a
                                  className="item-image w-inline-block"
                                  style={{
                                    backgroundImage: `url(${getMediaUrl(
                                      contact.media
                                    )})`,
                                  }}
                                />
                              </Link>
                            ) : (
                              ""
                            )}
                            <div className="item-info-block">
                              <div className="flex-specsbox">
                                {contact.connected &&
                                contact.connected !== 0 ? (
                                  <>
                                    <div className="connection-status">
                                      {" "}
                                      In connections{" "}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <a
                                      href="#"
                                      className="contact-connect w-button"
                                      onClick={() => {
                                        this.In_connection(contact);
                                      }}
                                    >
                                      Connect
                                    </a>
                                  </>
                                )}
                              </div>
                              {contact.address && (
                                <div className="flex-specsbox">
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
                                  <div className="country-name">
                                    {contact.country.name}
                                  </div>
                                </div>
                              )}
                              {contact.company && contact.company.name && (
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
                                  <Link
                                    href={{ pathname: `/company/detail` }}
                                    as={`/company/${
                                      contact &&
                                      contact.company &&
                                      contact.company.id &&
                                      contact.company.id +
                                        "-" +
                                        contact.company.name
                                    }`}
                                  >
                                    <a
                                      target="_blank"
                                      className="publisher-link"
                                    >
                                      {contact.company.name}
                                    </a>
                                  </Link>
                                </div>
                              )}
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
                                    <a className="list-item-menu-link w-dropdown-link">
                                      View Profile
                                    </a>
                                  </Link>
                                  <div className="list-item-menu-link social-elements">
                                    <a
                                      href={`https://www.linkedin.com/shareArticle?mini=true&url=${
                                        process.env.NEXT_PUBLIC_API_URL
                                      }contact/${
                                        contact.id +
                                        "-" +
                                        contact.first_name +
                                        "-" +
                                        contact.last_name
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
                                      }contact/${
                                        contact.id +
                                        "-" +
                                        contact.first_name +
                                        "-" +
                                        contact.last_name
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
                                      }contact/${
                                        contact.id +
                                        "-" +
                                        contact.first_name +
                                        "-" +
                                        contact.last_name
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
                      href={`/contact/p/[list]?filters=${JSON.stringify(
                        this.state.selected_filters
                      )}&search=${search_str}`}
                      as={`/contact/p/${previous}`}
                    >
                      <a className="pagination-button w-button">Previous</a>
                    </Link>
                  )}
                  {next && (
                    <Link
                      href={`/contact/p/[list]?filters=${JSON.stringify(
                        this.state.selected_filters
                      )}&search=${search_str}`}
                      as={`/contact/p/${next}`}
                    >
                      <a className="pagination-button w-button">Next</a>
                    </Link>
                  )}
                </div>
                {contacts.length === 0 && (
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

export default connect(null, site.actions)(ContactListPage);