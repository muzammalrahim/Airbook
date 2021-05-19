import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import {list} from '../../../helpers/api';
import {randomizeOrdering, next_link, previous_link,} from '../../../helpers/functions';
import React from 'react';
import axios from 'axios'
import cookies from 'next-cookies'
import { connect } from 'react-redux';
import * as site from "../../../redux/actions/siteActions";

export async function getServerSideProps(ctx) {

  let data = [], headers = {
      'Content-Type': 'application/json'
   }, search = '';
  let {authToken} = cookies(ctx)

  if(authToken !== undefined && authToken !== null)
    headers['Authorization'] = `Token ${authToken.replace(/['"]+/g, '')}`

  if(ctx.query.search !== 'undefined' && ctx.query.search !== undefined)
    search = ctx.query.search

  if (ctx.query.list === 1 || ctx.query.list === '1') // only for page 1
    await randomizeOrdering('AbAircrafts');
  
  await axios.get(process.env.NEXT_PUBLIC_API_URL + `api/aircrafts`, {
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
    props: { data, query:ctx.query}
  };
}


class JobListPage extends React.Component {
		constructor(props) {
      super(props);
      let response = this.props
			this.state = {
        jobs: [],
        topAdvert: {},
        bottomAdvert: {},
        // next: response.data.next,
        // previous: response.data.previous,
			};
      this.getJobs("job_titles");
      this.props.search({type:'jobs', value:response.query.search, detail:false});
      this.props.searching(false);
		}
		getJobs(url){
			list(url).then((response)=>{
				let jobs = response.data
				let previous= response.extra_data.previous;
				let next= response.extra_data.next;
				this.setState({jobs, previous, next})
			})
    }
    
    handleReset =() =>{
      this.setState({selected_filters :{} }, () => {
  
        this.loadModels();
        this.getListings();
      })
    }
	render() {
    let {jobs, previous, next} = this.state;
    next = next_link(next, this);
    previous = previous_link(previous);
		return  (
  <>
    <Header />
    <div className="ab-page-content">
  <div className="ab-container w-container">
    {/* <a href="#" target="_blank" className="ab-top-page-advert w-inline-block" /> */}
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
          <button className='reset_btn w-button'  onClick="{()=>this.handleReset()}"> Reset</button>
          <a href="#" className="filter-close w-button">
            Close
          </a>
        </div>
        <div className="filter-block-content">
          <div className="filter-form-block w-form">
            <form
              id="wf-form-filter-form"
              name="wf-form-filter-form"
              data-name="filter form"
              className="filter-form"
              action="submit"
            >
              <div className="filter-cat-block">
                <div className="filter-cat-name">
                  <div className="filter-cat-title">Position</div>
                  <div className="down-arrow w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={12}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"
                      />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  className="filter-search-field w-input"
                  maxLength={256}
                  name="JobPos"
                  data-name="JobPos"
                  placeholder="Search Position"
                  id="JobPos"
                />
                <div className="checkbox-scroll-block">
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                </div>
              </div>
              <div className="filter-cat-block">
                <div className="filter-cat-name">
                  <div className="filter-cat-title">Contract Type</div>
                  <div className="down-arrow w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={12}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"
                      />
                    </svg>
                  </div>
                </div>
                <label className="w-checkbox checkbox-block">
                  <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                  <input
                    type="checkbox"
                    id="checkbox-7"
                    name="checkbox-7"
                    data-name="Checkbox 7"
                    style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                  />
                  <span className="checkbox-label w-form-label">Checkbox</span>
                </label>
                <label className="w-checkbox checkbox-block">
                  <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                  <input
                    type="checkbox"
                    id="checkbox-7"
                    name="checkbox-7"
                    data-name="Checkbox 7"
                    style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                  />
                  <span className="checkbox-label w-form-label">Checkbox</span>
                </label>
                <label className="w-checkbox checkbox-block">
                  <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                  <input
                    type="checkbox"
                    id="checkbox-7"
                    name="checkbox-7"
                    data-name="Checkbox 7"
                    style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                  />
                  <span className="checkbox-label w-form-label">Checkbox</span>
                </label>
                <label className="w-checkbox checkbox-block">
                  <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                  <input
                    type="checkbox"
                    id="checkbox-7"
                    name="checkbox-7"
                    data-name="Checkbox 7"
                    style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                  />
                  <span className="checkbox-label w-form-label">Checkbox</span>
                </label>
                <label className="w-checkbox checkbox-block">
                  <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                  <input
                    type="checkbox"
                    id="checkbox-7"
                    name="checkbox-7"
                    data-name="Checkbox 7"
                    style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                  />
                  <span className="checkbox-label w-form-label">Checkbox</span>
                </label>
              </div>
              <div className="filter-cat-block">
                <div className="filter-cat-name">
                  <div className="filter-cat-title">Location</div>
                  <div className="down-arrow w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={12}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"
                      />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  className="filter-search-field w-input"
                  maxLength={256}
                  name="JobLoc"
                  data-name="JobLoc"
                  placeholder="Search Location"
                  id="JobLoc"
                />
                <div className="checkbox-scroll-block">
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                </div>
              </div>
              <div className="filter-cat-block">
                <div className="filter-cat-name">
                  <div className="filter-cat-title">Company</div>
                  <div className="down-arrow w-embed">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={12}
                      height={12}
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"
                      />
                    </svg>
                  </div>
                </div>
                <input
                  type="text"
                  className="filter-search-field w-input"
                  maxLength={256}
                  name="JobCompany"
                  data-name="JobCompany"
                  placeholder="Search Company"
                  id="JobCompany"
                />
                <div className="checkbox-scroll-block">
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                  <label className="w-checkbox checkbox-block">
                    <div className="w-checkbox-input w-checkbox-input--inputType-custom checkbox" />
                    <input
                      type="checkbox"
                      id="checkbox-7"
                      name="checkbox-7"
                      data-name="Checkbox 7"
                      style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    />
                    <span className="checkbox-label w-form-label">
                      Checkbox
                    </span>
                  </label>
                </div>
              </div>
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
          <h1 className="page-title">Aviation Jobs</h1>
          <p className="ab-page-description">
            {" "}
            in airlines, MRO's and other domains
          </p>
        </div>
        <div className="w-layout-grid ab-list-grid">
          <div className="ab-list-item-wrapper jobs">
            <div className="item-flex-header">
              <div className="item-title-block">
              <Link href="/jobs/detail" as="/job/slug-test125-111">
                <a className="item-link-block w-inline-block">
                  <h2 className="item-composite-title">Part 145 Engineer</h2>
                </a>
								</Link>
                
                <div className="item-h3-block">
                  <div className="job-publish-date">
                    Published on Mar 23, 2020
                  </div>
                </div>
              </div>
              <div className="item-like-block">
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
              </div>
            </div>
            <div className="item-data-flex">
              <a
                href="job-details.html"
                className="item-image w-inline-block"
              />
              <div className="item-info-block">
                <div className="flex-specsbox">
                  <p className="item-specs">
                    Job Type <span className="job-type">Permanent</span>
                  </p>
                </div>
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
                    <div className="country-name">United Arab Emirates</div>
                  </div>
                </div>
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
                  <a href="#" className="publisher-link">
                    Emirates Airlines
                  </a>
                </div>
              </div>
              <div className="ab-list-item-widget">
                <div data-delay={0} className="ab-list-item-menu w-dropdown">
                  <div className="ab-list-item-menu-toggle w-dropdown-toggle">
                    <div className="asset-dot-menu">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                  <nav className="ab-list-item-dropdown w-dropdown-list">
                    <a href="#" className="list-item-menu-main w-dropdown-link">
                      Apply this job
                    </a>
                    <a href="#" className="list-item-menu-link w-dropdown-link">
                      Add to favorite
                    </a>
                    <a href="#" className="list-item-menu-link w-dropdown-link">
                      View more details
                    </a>
                    <div className="list-item-menu-link social-elements">
                      <a href="#" className="menu-social w-inline-block">
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
                      <a href="#" className="menu-social w-inline-block">
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
                      <a href="#" className="menu-social w-inline-block">
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
                  </nav>
                </div>
              </div>
            </div>
          </div>
          <div className="ab-list-item-wrapper jobs">
            <div className="item-flex-header">
              <div className="item-title-block">
              <Link href="/jobs/detail" as="/job/slug-test125-111">
                <a className="item-link-block w-inline-block">
                  <h2 className="item-composite-title">A320 Pilot</h2>
                </a>
								</Link>
                <div className="item-h3-block">
                  <div className="job-publish-date">
                    Published on Mar 23, 2020
                  </div>
                </div>
              </div>
              <div className="item-like-block">
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
              </div>
            </div>
            <div className="item-data-flex">
              <a
                href="job-details.html"
                className="item-image w-inline-block"
              />
              <div className="item-info-block">
                <div className="flex-specsbox">
                  <p className="item-specs">
                    Job Type <span className="job-type">Contract</span>
                  </p>
                </div>
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
                    <div className="country-name">United Arab Emirates</div>
                  </div>
                </div>
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
                  <a href="#" className="publisher-link">
                    Emirates Airlines
                  </a>
                </div>
              </div>
              <div className="ab-list-item-widget">
                <div data-delay={0} className="ab-list-item-menu w-dropdown">
                  <div className="ab-list-item-menu-toggle w-dropdown-toggle">
                    <div className="asset-dot-menu">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                  <nav className="ab-list-item-dropdown w-dropdown-list">
                    <a href="#" className="list-item-menu-main w-dropdown-link">
                      Apply this job
                    </a>
                    <a href="#" className="list-item-menu-link w-dropdown-link">
                      Add to favorite
                    </a>
                    <a href="#" className="list-item-menu-link w-dropdown-link">
                      View more details
                    </a>
                    <div className="list-item-menu-link social-elements">
                      <a href="#" className="menu-social w-inline-block">
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
                      <a href="#" className="menu-social w-inline-block">
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
                      <a href="#" className="menu-social w-inline-block">
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
                  </nav>
                </div>
              </div>
            </div>
          </div>
          <div className="ab-list-item-wrapper jobs">
            <div className="item-flex-header">
              <div className="item-title-block">
              <Link href="/jobs/detail" as="/job/slug-test125-111">
                <a className="item-link-block w-inline-block">
                  <h2 className="item-composite-title">Part 145 Engineer</h2>
                </a>
								</Link>
                <div className="item-h3-block">
                  <div className="job-publish-date">
                    Published on Mar 23, 2020
                  </div>
                </div>
              </div>
              <div className="item-like-block">
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
              </div>
            </div>
            <div className="item-data-flex">
              <a
                href="aircraft-details.html"
                className="item-image w-inline-block"
              />
              <div className="item-info-block">
                <div className="flex-specsbox">
                  <p className="item-specs">
                    Job Type <span className="job-type">Permanent</span>
                  </p>
                </div>
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
                    <div className="country-name">United Arab Emirates</div>
                  </div>
                </div>
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
              <div className="ab-list-item-widget">
                <div data-delay={0} className="ab-list-item-menu w-dropdown">
                  <div className="ab-list-item-menu-toggle w-dropdown-toggle">
                    <div className="asset-dot-menu">
                      <div className="dot" />
                      <div className="dot" />
                      <div className="dot" />
                    </div>
                  </div>
                  <nav className="ab-list-item-dropdown w-dropdown-list">
                    <a href="#" className="list-item-menu-main w-dropdown-link">
                      Apply this job
                    </a>
                    <a href="#" className="list-item-menu-link w-dropdown-link">
                      Add to favorite
                    </a>
                    <a href="#" className="list-item-menu-link w-dropdown-link">
                      View more details
                    </a>
                    <div className="list-item-menu-link social-elements">
                      <a href="#" className="menu-social w-inline-block">
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
                      <a href="#" className="menu-social w-inline-block">
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
                      <a href="#" className="menu-social w-inline-block">
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
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="list-pagniation">
          <a href="#" className="pagination-button w-button">
            Previous
          </a>
          <a href="#" className="pagination-button w-button">
            Next
          </a>
        </div>
        {/* <div className="list-empty">
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
            We couldn't find results to match your search. Please try again with
            different keywords.
          </div>
        </div> */}
        {/* <a href="#" className="asset-list-footer-advert w-inline-block" /> */}
      </div>
    </div>
  </div>
</div>
<Footer />
  </>
)}}
export default connect(null, site.actions)(JobListPage)