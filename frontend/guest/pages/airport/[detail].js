import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { withRouter } from 'next/router';
import { formatDate, checkValue, getData, randomizeOrdering, load_meta } from '../../helpers/functions';
import axios from "axios";
import React from 'react';
import Link from 'next/link';
import { post } from '../../helpers/api';
import { connect } from 'react-redux';
import * as site from '../../redux/actions/siteActions'

export async function getServerSideProps({ params }) {
  var id = params.detail.split('-');
  let data = [], seo=[], sideAdvert = [], topAdvert = [];
  let related = [];

  await randomizeOrdering('AbAircrafts');
  // load seo tags
  await load_meta('Airport').then((response) => {
    seo = response.data;
  });
  await axios.get(process.env.NEXT_PUBLIC_API_URL + `api/airport/${id[0]}/`,{params:{frontend:true}}
  ).then((response) => {
    data = response.data;
  }).catch((error)=> {
    data = []
  })
  return {
    props: { data, params, seo },
  };
}

class AirportDetailPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props
    this.state = {
      airport: response.data,
      related: {},
      sideAdvert: {},
      topAdvert: {},
    };
    this.props.search({type:'airport', value:null, detail:true });
    if(this.state.airport.id)
      this.getData();
  }

  
  get_description = () => {
    const description_attrs = [
      'name','iata_code','icao_code',{city:'name'}, 'latitude', 'longitude', 'sunrise','sunset','views',''
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
    let { country } = this.state.airport;
    country = country !== null ? country.id : country
    let data = [
      { api: `airports/${id[0]}/related_airports/${country}/`, params: {frontend:true}, key: 'related' },
      { api: 'advertisements', params: { section: 'page-top' }, key: 'topAdvert' },
      { api: 'advertisements', params: { section: 'page-sidebar' }, key: 'sideAdvert' },
    ]
    getData(this, data);
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps !== this.props) {
     this.setState({airport:this.props.data})
    }
  }
  componentDidMount(){
    let {airport} = this.state
    if (airport.id){
      post('views', {viewable_id:this.state.airport.id, viewable_type:'App\\Airport'});
    }
  }
  render() {
    let { airport, related, sideAdvert, topAdvert } = this.state;
    let title = `${airport?.name ? airport.name :''}`
    let description = `${airport?.name ? airport.name:''} ${airport?.airfield_type?.name ? airport.airfield_type.name :''} ${airport?.country?.name ? airport.country.name : ''}. Browse more airports on Airbook and contribute by updating records.`
    console.log(airport?.country?.flag)
    return (
      <>
        <Header seo={this.props.seo} data={{
          title:title || null,
          description:description,
          og_image:airport?.media?.length ? airport.media[0].original_file_name : null
          }} />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            {airport.id ?
            <>
            {topAdvert && topAdvert.media != null && topAdvert.is_active === 1 ? <a href={topAdvert?.url} target="_blank" className="ab-top-page-advert w-inline-block" style={{ backgroundImage: 'url(/static/media/uploads/' + topAdvert.media.original_file_name + ')' }}></a>
              : ""}
            <h1 className="details-page-headline">{checkValue(airport.name)}</h1>
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
                {"Published " + formatDate(airport.created_at) + " - Updated " + formatDate(airport.updated_at)}
              </div>
            </div>
            {checkValue(airport.name)?
            <div className="breadcrumb-block">
              <Link href='/'>
                <a className="breadcrumbs-link">
                  Home
                </a>
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
              <Link href='/airport/p/1'>
                <a className="breadcrumbs-link">
                  Airports
                </a>
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
              <div className="current-asset">{airport.name}</div>
            </div>:''
            }
            <div className="flex-wrapper">
              <div className="flex-col-left">
                <div className="details-data-block">
                  <div className="label-block">
                    <div className="ab-svg-icon details-page w-embed">
                      <svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      >
                        <path
                          fill="currentColor"
                          d="M20 18v2h-20v-2h20zm-19.989-6.426l2.624-1.5 4.765 1.815s9.197-5.519 11.773-7.038c2.226-1.312 4.268-.853 4.647-.216.448.753.131 2.366-2.576 4.09-2.166 1.38-9.233 5.855-9.233 5.855-4.969 2.708-7.565.657-7.565.657l-4.435-3.663zm5.587-6.621l-2.598 1.5 6.252 3.173 5.388-3.227-9.042-1.446z"
                        />
                      </svg>
                    </div>
                    <h3 className="details-block-headline">Airport Details</h3>
                  </div>
                  {checkValue(airport.iata_code)?
                  <div className="data-block">
                    <div className="data-label">IATA</div>
                    <p className="data-value">{airport.iata_code}</p>
                  </div>:''
                  }
                  {checkValue(airport.icao_code)?
                  <div className="data-block">
                    <div className="data-label">ICAO</div>
                    <p className="data-value">{airport.icao_code}</p>
                  </div>:''
                  }
                  {checkValue(airport.city && airport.city.name)?
                  <div className="data-block">
                    <div className="data-label">City</div>
                    <p className="data-value">{airport.city && airport.city.name}</p>
                  </div>:''
                  }
                  {checkValue(airport.latitude)?
                  <div className="data-block">
                    <div className="data-label">Latitude</div>
                    <p className="data-value">{airport.latitude}</p>
                  </div>:''
                  }
                  {checkValue(airport.longitude)?
                  <div className="data-block">
                    <div className="data-label">Longitude</div>
                    <p className="data-value">{airport.longitude}</p>
                  </div>:''
                  }
                  {checkValue(airport.sunrise)?
                  <div className="data-block">
                    <div className="data-label">Sunrise</div>
                    <p className="data-value">{`${airport.sunrise} UTC`}</p>
                  </div>:''
                  }
                  {checkValue(airport.sunset)?
                  <div className="data-block">
                    <div className="data-label">Sunset</div>
                    <p className="data-value">{`${airport.sunset} UTC`}</p>
                  </div>:''
                  }
                </div>
                {checkValue(airport?.description) ?
                <div className="details-data-block">
                  <div className="label-block">
                  <div className="ab-svg-icon details-page w-embed">
                      <svg
                        width={16}
                        height={16}
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      >
                        <path
                          fill="currentColor"
                          d="M20 18v2h-20v-2h20zm-19.989-6.426l2.624-1.5 4.765 1.815s9.197-5.519 11.773-7.038c2.226-1.312 4.268-.853 4.647-.216.448.753.131 2.366-2.576 4.09-2.166 1.38-9.233 5.855-9.233 5.855-4.969 2.708-7.565.657-7.565.657l-4.435-3.663zm5.587-6.621l-2.598 1.5 6.252 3.173 5.388-3.227-9.042-1.446z"
                        />
                      </svg>
                    </div>
                    <h3 className="details-block-headline">Airport Description</h3>
                  </div>
                  <div className="data-block">
                    <p className="data-value">
                    {/* This aircraft is going to have c-check in next 30 days and will be available fresh afterwards.  */}
                    {airport?.description}
                    </p>
                  </div>
                </div>: ''}
                <div className="related-items-block">
                {checkValue(airport.country && airport.country.name)?
                  <div className="details-page-headline related-assets">
                    More Airports in {airport.country && airport.country.name}
                  </div>:''
                }
                  {related.length > 0 ? related.map((airport, index) => {
                    return <div className="w-layout-grid ab-list-grid" key={index}>
                      <div className="ab-list-item-wrapper">
                        <div className="item-flex-header">
                          <div className="item-title-block">
                            <Link href={{ pathname: `/airport/[detail]` }} as={`/airport/${airport.id + '-' + airport.name}`}>
                              <a className="item-link-block w-inline-block">
                                <h2 className="item-composite-title">{airport.name}</h2>
                              </a>
                            </Link>
                            {checkValue(airport.airfield_type && airport.airfield_type.name)?
                            <div className="item-h3-block">
                              <div className="airport-type">{airport.airfield_type && airport.airfield_type.name}</div>
                            </div>:''
                            }
                          </div>
                        </div>
                        <div className="item-data-flex">
                          <div className="item-info-block">
                            <div className="flex-specsbox">
                              <p className="item-specs">
                              {checkValue(airport.icao_code)?
                                <span>
                                <span className="ap-label">ICAO</span>{" "}
                                <span className="ap-value">{(airport.icao_code)? airport.icao_code : ''}</span>{" "}
                                </span>:'' }
                               
                                
                                {checkValue(airport.iata_code) ?
                               <span>
                               <span className="ap-label">AIATA</span>{" "}
                                <span className="ap-value">{(airport.iata_code) ? airport.iata_code : 'N/A'}</span>
                               </span>:''
                                }
                              </p>
                            </div>
                            {checkValue(airport.country && airport.country.name)?
                            <div className="flex-specsbox">
                              {checkValue(airport.country && airport.country.flag)? <div className="svg-flag" style={{backgroundImage:`url(/static/media/site/flags/${airport.country.flag})`}} />:''}
                              <div className="country-name">{airport.country && airport.country.name}</div>
                            </div>:''
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  })
                  :
                  <div className="list-empty mb-10">
                    <div className="ab-svg-icon alert w-embed">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.31 7.526c-.099-.807.528-1.526 1.348-1.526.771 0 1.377.676 1.28 1.451l-.757 6.053c-.035.283-.276.496-.561.496s-.526-.213-.562-.496l-.748-5.978zm1.31 10.724c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z">
                        </path>
                      </svg>
                    </div>
                    {checkValue(airport.country && airport.country.name)?
                    <div className="no-results-message">No more airport in {airport.country && airport.country.name}.</div>:''
                    }
                  </div>}
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
                    <h3 className="details-block-headline">Airport Summary</h3>
                  </div>
                  <div className="sidebar-data-block">
                  {checkValue(airport.name)?
                    <p className="data-value">{airport.name}</p>:''}
                  </div>
                  {checkValue(airport.country && airport.country.name)?
                  <div className="sidebar-data-block">
                    {checkValue(airport.country && airport.country.flag)? <div className="svg-flag" style={{backgroundImage:`url(/static/media/site/flags/${airport.country.flag})`}}/>: ''}
                    <p className="data-value">{airport.country && airport.country.name}</p>
                  </div>:''
                  }
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
                    <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${process.env.NEXT_PUBLIC_API_URL}airport/${this.props.params.detail}`} target="_blank" className="share-widget w-inline-block">
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
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${process.env.NEXT_PUBLIC_API_URL}airport/${this.props.params.detail}`} target="_blank" className="share-widget w-inline-block">
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
                    <a href={`https://api.whatsapp.com/send?text=${process.env.NEXT_PUBLIC_API_URL}airport/${this.props.params.detail}`} target="_blank" className="share-widget w-inline-block">
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
                  <div className="update-label">Update Airport Data</div>
                </a>
                {/* <div className="sidebar-data-wrapper">
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
                    <h3 className="details-block-headline">Information Contributors</h3>
                  </div>
                  <div className="data-block file-attachment">
                    <a href="#" target="_blank" className="on-airbook-link">
                      Zulqarnain Siddiq
                    </a>
                    <div className="job-title-company-profile">CEO</div>
                  </div>
                  <div className="data-block file-attachment">
                    <a href="#" target="_blank" className="on-airbook-link">
                      Zulqarnain Siddiq
                    </a>
                    <div className="job-title-company-profile">
                      Maintenance Director
                    </div>
                  </div>
                  <div className="data-block file-attachment">
                    <a href="#" target="_blank" className="on-airbook-link">
                      Zulqarnain Siddiq
                    </a>
                    <div className="job-title-company-profile">CEO</div>
                  </div>
                </div> */}
                {sideAdvert && sideAdvert.media != null && sideAdvert.is_active === 1 ? <a href={sideAdvert?.url} target="_blank" className="asset-list-side-advert w-inline-block" style={{ backgroundImage: 'url(/static/media/uploads/' + sideAdvert.media.original_file_name + ')' }}></a>
                  : ""}
              </div>
            </div>
            </>:
             <>
             <div className="list-empty">
               <div className="ab-svg-icon alert w-embed">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                   <path fill="currentColor" d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.31 7.526c-.099-.807.528-1.526 1.348-1.526.771 0 1.377.676 1.28 1.451l-.757 6.053c-.035.283-.276.496-.561.496s-.526-.213-.562-.496l-.748-5.978zm1.31 10.724c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"></path>
                 </svg>
               </div>
               <div className="no-results-message">We couldn&#x27;t find this item. Either it's removed or not being published. Please contact administrator for further details</div>
             </div>
           </>}
          </div>
        </div>
        <Footer />
      </>
    )
  }
}

export default connect(null,site.actions)(withRouter(AirportDetailPage));
