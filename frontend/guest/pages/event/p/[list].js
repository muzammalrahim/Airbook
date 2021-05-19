import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Link from 'next/link';
import { showFilters, formatDate } from '../../../helpers/functions';
import { Static_Filters } from '../../../helpers/filters';
import { list, post } from '../../../helpers/api';
import React from 'react';
import { Component } from 'react';
import axios from "axios";




export async function getServerSideProps({ params }) {
  let data = [], currentPage = "";
  await axios.get(process.env.NEXT_PUBLIC_API_URL + 'api/' +
    `events?page=${params.list}`
  ).then((response) => {
    data = response.data;
    currentPage = params.list
  });
  return {
    props: {
      currentPage,
      data,
    },
  };
}
class EventListPage extends Component {
  constructor(props) {
    super(props);
    let response = this.props.data;
    this.state = {
      events: response.results,
      next: response.next,
      previous: response.previous,
      currentPage: this.props.currentPage,
      filters: [Static_Filters['offered_for']],
      selected_filters: {},
      ids: []
    };
    this.loadModels();
  }
  async loadModels() {
    let { filters } = this.state;
    let models = {
      'AbConditions': {  },
      'AbCategories': { type: 'apu', l },
      'AbManufacturers': { type: 'apu',  },
      'AbTypes': { type: 'apu', },
      'AbModels': { type: 'apu',  },
      // 'AbModels': {type: 'aircraft', request_type:'filter'},
    }
    let filter_keys = {
      AbConditions: 'CONDITION',
      AbCategories: 'CATEGORY',
      AbManufacturers: 'MANUFACTURER',
      AbTypes: 'TYPE',
      AbModels: 'MODEL'
    }
    await post('abmodels', { models: models }).then(function (response) {
      Object.keys(filter_keys).map((key) => {
        let values = [];
        response.data[key].map((value) => {
          values.push({ name: value.name, value: value.id, type: 'checkbox' })
        })
        filters.push({ name: filter_keys[key], value: values })
      })
      filters.push({ name: 'APU CYCLES', value: Static_Filters['date'].value });
    }.bind(this))
    this.setState({ filters })

  }

  getListings(url) {
    let params = this.state.selected_filters;
    url = url ? url : 'events';
    list(url, params).then((response) => {
      let previous = response.extra_data.previous;
      let next = response.extra_data.next;
      this.setState({ events: response.data, previous, next })
    })
  }
  handleclick(id) {
    let ids = this.state.ids
    if (ids.includes(id)) {
      ids.splice(ids.indexOf(id), 1)
    } else {
      ids.push(id)
    }
    this.setState({ ids: ids })
  }
  componentDidUpdate() {
    let response = this.props.data;
    if (this.props.data.results != this.state.events) {
      this.setState({
        events: response.results,
        next: response.next,
        previous: response.previous,
        currentPage: this.props.currentPage,
      });

    }
  }
  render() {
    let { events, previous, next, filters, currentPage, ids } = this.state;
    currentPage = parseInt(currentPage, 10);
    return (
      <>
        <Header />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            <a href="#" target="_blank" className="ab-top-page-advert w-inline-block" />
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
                    </div>
                    <div className="filters-label">Event Search Filters</div>
                  </div>
                  <a href="#" className="filter-close w-button">
                    Close
                </a>
                </div>
                <div className="filter-block-content">
                  <div className="filter-form-block w-form">
                    <form id="wf-form-filter-form" action="/" name="wf-form-filter-form" data-name="filter form" className="filter-form">
                      {showFilters(filters, this, 'Events')}
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
                  <h1 className="page-title">Aviation Events</h1>
                  <p className="ab-page-description"> around the world</p>
                </div>
                <div className="w-layout-grid ab-list-grid">
                  {events.length > 0 && events.map((event, index) => {
                    return <div className="ab-list-item-wrapper events">
                      <div className="item-flex-header">
                        <div className="item-title-block">
                          <Link href={{ pathname: `/event/detail`, query: event }} as={`/event/${event.categories && event.categories[0].name}`}>
                            <a className="item-link-block w-inline-block">
                              <h2 className="item-composite-title">{event.title}</h2>
                            </a>
                          </Link>
                          <div className="item-h3-block">
                            <div className="event-dates">
                              {formatDate(event.start_date) + " - " + formatDate(event.end_date)}
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
                          <div className="likecount">{event.likes}</div>
                        </div>
                      </div>
                      <div className="item-data-flex">
                      {getMediaUrl(event.media) ? 
                        <Link href={{ pathname: `/event/detail`, query: event }} as={`/event/${event.categories && event.categories[0].name}`}>
                          <a className="item-image w-inline-block">
                          </a>
                        </Link> : ""}
                        <div className="item-info-block">
                          <div className="flex-specsbox">
                            <p className="item-specs event-type">{event.categories && event.categories[0].name}</p>
                          </div>
                          <div className="flex-specsbox">
                            <div className="svg-flag" />
                            <div className="country-name">{event.country && event.country.name}</div>
                          </div>
                          {event.website !== null ?
                            <div className="flex-specsbox">
                              <div className="ab-svg-icon w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={14}
                                  height={14}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"
                                  />
                                </svg>
                              </div>
                              <a href={event.website} target="_blank" className="publisher-link">
                                Event website
                            </a>
                            </div>
                            : ''}
                        </div>
                        <div className="ab-list-item-widget">
                          <div data-delay={0} className="ab-list-item-menu w-dropdown">
                            <div className="ab-list-item-menu-toggle w-dropdown-toggle">
                              <div className="asset-dot-menu" onClick={() => this.handleclick(index)}>
                                <div className="dot" />
                                <div className="dot" />
                                <div className="dot" />
                              </div>
                            </div>
                            <nav className={`ab-list-item-dropdown w-dropdown-list ${ids.includes(index) && 'w--open'}`}>
                              <a href="#" className="list-item-menu-link w-dropdown-link">
                                Event website
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
                  })}
                </div>
                <div className="list-pagniation">
                  {previous &&
                    <Link href={`/event/p/[list]`} as={`/event/p/${currentPage - 1}`}>
                      <a className="pagination-button w-button">Previous</a>
                    </Link>}
                  {next &&
                    <Link href={`/event/p/[list]`} as={`/event/p/${currentPage + 1}`}>
                      <a className="pagination-button w-button">Next</a>
                    </Link>}
                </div>
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
                    We couldn't find results to match your search. Please try again with
                    different keywords.
                </div>
                </div>
                <a href="#" className="asset-list-footer-advert w-inline-block" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>)
  }
}

export default EventListPage;
