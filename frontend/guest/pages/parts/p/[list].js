import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { list, post } from '../../../helpers/api';
import { formatDate, filteredValues, selectFilter, next_link, previous_link, getData, randomizeOrdering, checkValue, load_meta } from '../../../helpers/functions';
import React from 'react';
import axios from "axios";
import { isAuthenticated } from '../../../helpers/frontend';
import * as site from "../../../redux/actions/siteActions";
import { connect } from "react-redux";
import msg from "../../../helpers/notifications";
import cookies from 'next-cookies'

export async function getServerSideProps(ctx) {
  let data = [], seo=[], currentPage = "",headers = {
    'Content-Type': 'application/json'
 }, search = '';
 let {authToken} = cookies(ctx)

 if(authToken !== undefined && authToken !== null)
    headers['Authorization'] = `Token ${authToken.replace(/['"]+/g, '')}`

  if(ctx.query.search !== 'undefined' && ctx.query.search !== undefined)
    search = ctx.query.search
 // load seo tags
 await load_meta('Part').then((response) => {
  seo = response.data;
});
  if (ctx.query.list === 1 || ctx.query.list === '1') // only for page 1
    await randomizeOrdering('AbParts');

  await axios.get(process.env.NEXT_PUBLIC_API_URL + `api/parts`, {
    headers:headers,
    params: {
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
    props: { data, query:ctx.query, seo },
  };
}

class PartsListPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props;
    this.state = {
      parts: [],
      next: response.data.next,
      previous: response.data.previous,
      conditions: [],
      countries: [],
      filters: [],
      selected_filters: response.query.filters ? JSON.parse(response.query.filters) : {},
      filterData: false,
      isAuthenticate: false,
      topAdvert: {},
      search_str:response.query.search,
      part_requests:[],
      all_selected:false,
      RFQMessage:'',
      part:null,
      search_items:'',
      all_filter_selected:true,
      modal:{show:{display:"none"}, error:{display:"none"}, success:{display:"none"}, button:'SEND', onSuccess:{}, form:{display:'block'}},
    };
    this.props.search({type:'part', value:response.query.search, detail:false});
    this.props.searching(false);
    this.loadModels();
    this.getData();

    this.style = {
      RFQList:{overflowY:'scroll', maxHeight:'260px'}
    }
  }

  async loadModels() {
    let { conditions, countries, selected_filters } = this.state;
    let models = {
      'AbConditions': { },
      'AbCountries': {  },
    }
    await post('abmodels', { models: models }).then(function (response) {
      for (let opt in response.data) {
        response.data[opt].map((row, i) => {
          response.data[opt][i].label = row.name;
          response.data[opt][i].value = row.id;
        })
      }
      conditions = response.data.AbConditions
      countries = response.data.AbCountries
      conditions.unshift({id:0, value:'all', label:'ALL', name:'ALL'})
    })
    this.setState({ conditions, countries});
  }

  getListings(url) {
    let filters = JSON.stringify(this.state.selected_filters);
    let search = this.state.search_str;
    url = url ? url : 'parts';
    list(url, { search, filters, frontend: true, parts:this.state.search_items }).then((response) => {
      this.setState({
        parts: response.data,
        next: response.extra_data.next,
        previous: response.extra_data.previous,
        filterData: true
      });
    })
  }

  getData(){
    let data=[
      {api:'advertisements', params:{section:'page-top'}, key:'topAdvert'},
      {api:'advertisements', params:{section:'page-bottom'}, key:'bottomAdvert'},
    ]
    getData(this, data);
  }

  componentDidUpdate(prevProps) {
    let response = this.props.data;
    this.props.searching(false);
    if (JSON.stringify(prevProps.data.results) !== JSON.stringify(response.results)) {
      this.setState({
        parts: response.results,
        next: response.next,
        previous: response.previous,
        search_str:this.props.query.search,
        selected_filters: this.props.query.filters ? JSON.parse(this.props.query.filters) : Object.keys(this.state.selected_filters).length ? this.state.selected_filters : {}
      });

    }
  }
  componentDidMount() {
    this.setState({ isAuthenticate: isAuthenticated(this.props.store)});
  }

  formatlink(link) {
    let str = link;
    if (str !== null) {
      if (str.includes("http://")) {
        return link;
      }
      else {
        link = 'http://' + link;
        return link
      }
    }
    else {
      link = '#';
      return link
    }

  }

  changeHandler(pr) {
    let prs = this.state.part_requests
    if(prs.filter(_pr => _pr.id === pr.id).length)
      this.setState({part_requests:prs.filter(_pr => _pr.id !== pr.id)})
    else
      this.setState({part_requests: [...prs, pr]})
  } 

  selectAllParts() {
    this.setState({all_selected:!this.state.all_selected}, () => {
      if(this.state.all_selected === true) 
        this.setState({part_requests: [...this.state.parts]})
      else
        this.setState({part_requests:[]})
    })
  }

  setRFQuantity(e, index) {
    this.setState({
      part_requests: this.state.part_requests.map((pr, i) => {
        if(i === index)
          pr.qty = e.target.value

        return pr
      })
    })
  }

  handleSubmit(e){
    e.preventDefault(e)
    let {modal} = this.state;
    let {part_requests, RFQMessage} = this.state;
    if(part_requests.length && RFQMessage ){
      modal['button'] = "Please wait...";
      this.setState({modal});
      post('parts/send_rfq_message', {part_requests, message:RFQMessage}).then((response) => {
        modal['onSuccess'] = {top: '25%', position: 'relative'};
        modal['form'] = {display:'none'};
        modal['success'] = {display:'block'};
        this.setState({modal, part_requests:[], all_selected:false});
      })


    }
    else{
      modal['error'] = {display:'block'}
      this.setState({modal})
    }
  }


  closeModal(){
    let {modal} = this.state;
    modal['show'] = {display:'none'}
    modal['form'] = {display:'block'};
    modal['success'] = {display:'none'};
    modal['onSuccess'] = {};
    this.setState({modal, part:null})
    document.getElementById("wf-form-message-modal").reset()
  }

  showModal(part=null){
    let {modal} = this.state;
    if(isAuthenticated(this.props.store)){
      modal['show'] = {display:'block'}

      let prs = this.state.part_requests

      if(part !== null && !prs.filter(pr => pr.id === part.id).length)
        this.setState({part_requests: [...prs, part]})

      this.setState({modal, part:part})
    } else {
      msg.error(`Please login to send request`);
    }
  }

  searchParts(e) {
    this.setState({search_items:e.target.value}, () => this.getListings()) ;
  }

  render() {
    let { search_str, modal, part, parts, selected_filters, part_requests, RFQMessage, previous, next, conditions, countries, isAuthenticate, topAdvert } = this.state;
    next = next_link(next, this);
    previous = previous_link(previous);
    return (
      <>
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
                  <div className="text-block">RFQ: Oxygen Aerospace</div>
                  <div style={this.style.RFQList}>
                    {part_requests.map((pr, i) => {
                      if (part === null || pr.id === part.id) {
                        return (
                          <div className="pn-qty-block">
                            <div className="parts-list-modal-qty">
                              <a href="#" className="modal-regarding">
                                PN {pr.part_number}
                              </a>
                              <span className="modal-pn-cond">NE</span>
                            </div>
                            <input
                              type="number"
                              value={pr.qty ? pr.qty : ""}
                              onChange={(e) => this.setRFQuantity(e, i)}
                              className="modal-qty w-input"
                              maxLength="256"
                              name="Quantity"
                              data-name="Quantity"
                              placeholder="Qty"
                              id="Quantity-6"
                              required=""
                            />
                          </div>
                        );
                      }
                    })}
                  </div>
                  <textarea
                    data-name="Message 2"
                    onChange={(e) =>
                      this.setState({ RFQMessage: e.target.value })
                    }
                    maxLength="5000"
                    id="Message-2"
                    name="Message-2"
                    required=""
                    placeholder="request details"
                    className="modal-msg-box w-input"
                  >
                    {RFQMessage}
                  </textarea>
                  <div className="modal-submit-block">
                    <button
                      disabled={modal.button !== "SEND"}
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
                    <div className="message-copy-alert">
                      You will receive a copy of this message.
                    </div>
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
                    You will also receive a copy of this message.
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
            <div className="ab-page-title-block">
              <h1 className="page-title">Aircraft Parts </h1>
              <p className="ab-page-description">
                listing by global parts distributors, re-sellers and owners
              </p>
            </div>
            <div className="parts-list-search-block">
              <div className="part-filter-form w-form">
                <form
                  id="email-form-3"
                  name="email-form-3"
                  data-name="Email Form 3"
                  className="part-search-form"
                  action="submit"
                >
                  <div className="parts-search-block searchbox">
                    <textarea
                      placeholder="Enter one PN per line"
                      maxLength={5000}
                      id="pn"
                      name="pn"
                      data-name="pn"
                      required
                      className="pn-searchbox w-input"
                      defaultValue={""}
                      onChange={(e) =>
                        this.setState({ search_items: e.target.value })
                      }
                    />
                    <input
                      type="submit"
                      defaultValue="Search"
                      data-wait="Please wait..."
                      className="pn-search-button w-button"
                      onClick={(e) => {
                        e.preventDefault();
                        this.getListings();
                      }}
                    />
                  </div>
                  <div className="parts-search-block">
                    <div className="text-block-3">Part search filters</div>
                    <div>
                      <div className="w-layout-grid pn-condition-grid">
                        {conditions &&
                          conditions.map((condition, index) => {
                            return (
                              <label
                                className="w-checkbox pncondition"
                                key={"condition" + index}
                              >
                                <div
                                  className={
                                    selected_filters.conditions &&
                                    selected_filters.conditions.indexOf(
                                      condition.id
                                    ) > -1
                                      ? "w-checkbox-input w-checkbox-input--inputType-custom pn-condition-check w--redirected-checked"
                                      : "w-checkbox-input w-checkbox-input--inputType-custom pn-condition-check "
                                  }
                                />
                                <input
                                  type="checkbox"
                                  id={condition.id}
                                  name={condition.name}
                                  data-name={condition.name}
                                  style={{
                                    opacity: 0,
                                    position: "absolute",
                                    zIndex: -1,
                                  }}
                                  onChange={() => {
                                    filteredValues(
                                      condition.value,
                                      "condition",
                                      this
                                    );
                                  }}
                                />
                                <span
                                  htmlFor={condition.name}
                                  className="pn-condition-label w-form-label"
                                >
                                  {condition.name}
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    </div>
                    <div>
                      <select
                        id="pnCountries"
                        name="location"
                        data-name="pnCountries"
                        className="pncountry-select w-select"
                        onChange={(e) => {
                          selectFilter(e, this, "APUs");
                        }}
                      >
                        <option value="">All countries..</option>
                        {countries &&
                          countries.map((country, index) => {
                            return (
                              <option
                                key={"country" + index}
                                value={country.id}
                                onClick={(e) => {
                                  selectFilter(e, country.id, this);
                                }}
                              >
                                {country.name}
                              </option>
                            );
                          })}
                      </select>
                    </div>
                  </div>
                </form>
                <div className="w-form-done">
                  <div>Thank you! Your submission has been received!</div>
                </div>
                <div className="w-form-fail">
                  <div>
                    Oops! Something went wrong while submitting the form.
                  </div>
                </div>
              </div>
            </div>
            {parts.length > 0 || this.state.search_items.trim() != "" ? (
              <div className="parts-list-wrapper-web">
                <div className="part-list-sticky-row">
                  <div className="basket-block">
                    <div className="text-block-5">
                      {part_requests.length} Selected
                    </div>
                    <a
                      data-w-id="e265d7bf-6e4a-5d05-6e6f-9b331b0707ee"
                      href="#"
                      className="bulk-rfq-send w-button"
                      onClick={() => {
                        this.showModal();
                      }}
                    >
                      Send&nbsp;Multi RFQ
                    </a>
                  </div>
                  <div className="part-list-flex-row">
                    <div className="part-list-col col-check">
                      <div className="checbox-form w-form">
                        <form
                          id="email-form-2"
                          name="email-form-2"
                          data-name="Email Form 2"
                          className="form"
                          action="submit"
                        >
                          <label className="w-checkbox checkbox-block checkbox-field">
                            <div
                              className={
                                "w-checkbox-input w-checkbox-input--inputType-custom part-select-check-web checkall" +
                                (part_requests.length === parts.length
                                  ? " w--redirected-checked"
                                  : "")
                              }
                            />
                            <input
                              type="checkbox"
                              id="checkbox-all"
                              name="checkbox-all"
                              checked={
                                part_requests.length === parts.length
                                  ? true
                                  : false
                              }
                              onChange={() => this.selectAllParts()}
                              data-name="Checkbox 6"
                              style={{
                                opacity: 0,
                                position: "absolute",
                                zIndex: -1,
                              }}
                            />
                            <span className="checkbox-label-2 w-form-label" />
                          </label>
                        </form>
                        <div className="w-form-done">
                          <div>
                            Thank you! Your submission has been received!
                          </div>
                        </div>
                        <div className="w-form-fail">
                          <div>
                            Oops! Something went wrong while submitting the
                            form.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="part-list-col col-pn">
                      <div className="part-list-data-label">PN</div>
                    </div>
                    <div className="part-list-col col-desc">
                      <div className="part-list-data-label">Description</div>
                    </div>
                    <div className="part-list-col col-cond">
                      <div className="part-list-data-label">Cond</div>
                    </div>
                    <div className="part-list-col col-qty">
                      <div className="part-list-data-label">QTY</div>
                    </div>
                    <div className="part-list-col col-price">
                      <div className="part-list-data-label">U.Price</div>
                    </div>
                    <div className="part-list-col col-date">
                      <div className="part-list-data-label">Published</div>
                    </div>
                    <div className="part-list-col col-rfq">
                      <div className="part-list-data-label">RFQ</div>
                    </div>
                  </div>
                </div>
                <div className="part-list-part-row">
                  {parts &&
                    parts.map((part, index) => {
                      return (
                        <div key={"part" + index}>
                          <div className="part-list-flex-data-row">
                            <div className="part-list-col col-check">
                              <div className="checbox-form w-form">
                                <form
                                  id="email-form-2"
                                  name="email-form-2"
                                  data-name="Email Form 2"
                                  className="form"
                                  action="submit"
                                >
                                  <label className="w-checkbox checkbox-block checkbox-field">
                                    <div
                                      className={
                                        "w-checkbox-input w-checkbox-input--inputType-custom part-select-check-web " +
                                        (part_requests.filter(
                                          (pr) => pr.id === part.id
                                        ).length
                                          ? " w--redirected-checked"
                                          : "")
                                      }
                                    />
                                    <input
                                      type="checkbox"
                                      id={"checkbox-" + index}
                                      name={"checkbox-" + index}
                                      data-name={"checkbox-" + index}
                                      checked={
                                        part_requests.filter(
                                          (pr) => pr.id === part.id
                                        ).length
                                          ? true
                                          : false
                                      }
                                      onChange={() => this.changeHandler(part)}
                                      style={{
                                        opacity: 0,
                                        position: "absolute",
                                        zIndex: -1,
                                      }}
                                    />
                                    <span className="checkbox-label-2 w-form-label" />
                                  </label>
                                </form>
                                <div className="w-form-done">
                                  <div>
                                    Thank you! Your submission has been
                                    received!
                                  </div>
                                </div>
                                <div className="w-form-fail">
                                  <div>
                                    Oops! Something went wrong while submitting
                                    the form.
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="part-list-col col-pn">
                              <Link
                                href={{ pathname: `/parts/[detail]` }}
                                as={`/parts/${
                                  part.id +
                                  "-" +
                                  (part.condition &&
                                    part.condition.name.split("/").join("-"))
                                }`}
                              >
                                <a className="part-list-pn-link">
                                  {part.part_number}
                                </a>
                              </Link>
                            </div>
                            <div className="part-list-col col-desc">
                              {checkValue(part.description) ? (
                                <div className="part-list-data-label">
                                  {part.description}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="part-list-col col-cond">
                              {checkValue(
                                part.condition && part.condition.name
                              ) ? (
                                <div className="part-list-data-label">
                                  {part.condition && part.condition.name}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="part-list-col col-qty">
                              {checkValue(part.quantity) ? (
                                <div className="part-list-data-label">
                                  {part.quantity}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="part-list-col col-price">
                              {checkValue(part.price && part.price >= 1) ? (
                                <div className="part-list-data-label">
                                  {"$" +
                                    parseFloat(
                                      part.price
                                    ).toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                    })}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="part-list-col col-date">
                              {formatDate(part.created_at) ? (
                                <div className="part-list-data-label">
                                  {formatDate(part.created_at)}
                                </div>
                              ) : (
                                ""
                              )}
                            </div>
                            <div className="part-list-col col-rfq">
                              <div
                                className="part-list-send-rfq"
                                onClick={() => {
                                  this.showModal(part);
                                }}
                              >
                                RFQ
                              </div>
                            </div>
                          </div>
                          <div className="part-list-org-blok">
                            {isAuthenticate ? (
                              <>
                                <div className="parts-list-org-info">
                                  <Link
                                    href={{ pathname: `/company/detail` }}
                                    as={`/company/${
                                      part.primary_contact.company &&
                                      part.primary_contact.company.id +
                                        "-" +
                                        part.primary_contact.company.name
                                    }`}
                                  >
                                    <a
                                      target="_blank"
                                      className="part-list-org-link"
                                    >
                                      {part.primary_contact &&
                                        part.primary_contact.company &&
                                        part.primary_contact.company.name}{" "}
                                    </a>
                                  </Link>
                                </div>
                                <div className="parts-list-org-info">
                                  <a
                                    href="#"
                                    target="_blank"
                                    className="part-list-org-link"
                                  >
                                    {part.primary_contact &&
                                      part.primary_contact.company &&
                                      part.primary_contact.company
                                        .business_phone}
                                  </a>
                                </div>
                                <div className="parts-list-org-info">
                                  <a
                                    href="#"
                                    target="_blank"
                                    className="part-list-org-link"
                                  >
                                    {part.user && part.user.email}
                                  </a>
                                </div>
                                <div className="parts-list-org-info">
                                  <a
                                    href={this.formatlink(
                                      part.primary_contact &&
                                        part.primary_contact.company &&
                                        part.primary_contact.company.website
                                    )}
                                    target="_blank"
                                    className="part-list-org-link"
                                  >
                                    {part.primary_contact &&
                                      part.primary_contact.company &&
                                      part.primary_contact.company.website}
                                  </a>
                                </div>
                              </>
                            ) : (
                              <div className="locked-item-block parts-lock">
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
                                  Login to view contact
                                </div>
                              </div>
                            )}
                            <div className="text-block-4">
                              {part.primary_contact &&
                                part.primary_contact.company &&
                                part.primary_contact.company.country &&
                                part.primary_contact.company.country.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="list-pagniation" data={search_str}>
                  {previous && (
                    <Link
                      href={`/parts/p/[list]?filters=${JSON.stringify(
                        this.state.selected_filters
                      )}&search=${search_str}`}
                      as={`/parts/p/${previous}`}
                    >
                      <a className="pagination-button w-button">Previous</a>
                    </Link>
                  )}
                  {next && (
                    <Link
                      href={`/parts/p/[list]?filters=${JSON.stringify(
                        this.state.selected_filters
                      )}&search=${search_str}`}
                      as={`/parts/p/${next}`}
                    >
                      <a className="pagination-button w-button">Next</a>
                    </Link>
                  )}
                </div>
                {parts.length === 0 && (
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
                {topAdvert && topAdvert.media != null ? (
                  <a
                    href={topAdvert?.url}
                    target="_blank"
                    className="asset-list-footer-advert w-inline-block"
                    style={{
                      backgroundImage:
                        "url(/static/images/" +
                        topAdvert.media.original_file_name +
                        ")",
                    }}
                  ></a>
                ) : (
                  ""
                )}
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
        <Footer />
      </>
    );
  }
}

export default connect(null, site.actions)(PartsListPage);
