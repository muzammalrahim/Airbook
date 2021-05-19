import Header from "../../components/Header";
import Footer from "../../components/Footer";
import React from "react";
import {
  formatDate,
  checkValue,
  getData,
  likes,
  graphValues,
  find_date_differance,
  getTitle,
  getMediaUrl,
  load_meta
} from "../../helpers/functions";
import { img_placeholder } from "../../helpers/filters";
import axios from "axios";
import Link from "next/link";
import { isAuthenticated } from "../../helpers/frontend";
import { Carousel } from "react-responsive-carousel";
import { post, list } from "../../helpers/api";
import msg from "../../helpers/notifications";
import Canvas from "../canvas/canvas";
import { connect } from "react-redux";
import * as site from "../../redux/actions/siteActions";

export async function getServerSideProps({ params }) {
  var id = params.detail.split("-");
  let data = [], seo=[];
   // load seo tags
   await load_meta('Aircraft').then((response) => {
    seo = response.data;
  });
  await axios
    .get(process.env.NEXT_PUBLIC_API_URL + `api/aircrafts/${id[0]}/`, {
      params: { frontend: true },
    })
    .then((response) => {
      data = response.data;
    })
    .catch((error) => {
      data = [];
    });
  return {
    props: { data, params, seo },
  };
}

class AircraftDetailPage extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props;
    let responseDataMedia = response.data.media
      ? response.data.media.filter((media) => media.exist)
      : null;
    response.data.media = responseDataMedia;
    this.state = {
      aircraft: response.data,
      related: [],
      promoted: {},
      isAuthenticate: false,
      sideAdvert: {},
      topAdvert: {},
      showCarousel: false,
      message: "",
      submitting: false,
      viewsByID: [],
      monthsByID: [],
      likesByID: [],
      monthsByType: [],
      viewsByType: [],
      likesByType: [],
      mainImageUrl:
        process.env.NEXT_PUBLIC_API_URL +
        "static/media/uploads/" +
        (response.data.media && response.data.media.length > 0
          ? response.data.media[0].original_file_name
          : img_placeholder),
    };

    this.props.search({ type: "aircraft", value: null, detail: true });
    this.setCarousel = this.setCarousel.bind(this);
    if (this.state.aircraft.id) this.getData();
  }

  get_description = () => {
    const description_attrs = [
      'offer_for','availability',{owner:'name'}, {manager:'name'}, {seller:'name'}, {category:'name'}, {manufacturer:'name'},
      {type:'name'}, {model:'name'}, 'yom', {configuration:'name'}, 'seating_business', 'seating_economy', 'seating_first',
      {engine_model:'name'}, 'compliance',''
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

  setCarousel() {
    this.setState({ showCarousel: !this.state.showCarousel });
  }
  getData() {
    let id = this.props.params.detail.split("-");
    let { manufacturer } = this.state.aircraft;
    manufacturer =
      manufacturer !== null && manufacturer !== undefined
        ? manufacturer.id
        : manufacturer;
    let data = [
      {
        api: `aircrafts/${id[0]}/related_aircrafts/${manufacturer}/`,
        params: { frontend: true },
        key: "related",
      },
      {
        api: `aircrafts/${id[0]}/promoted_aircrafts`,
        params: { frontend: true },
        key: "promoted",
      },
      {
        api: "advertisements",
        params: { section: "page-top" },
        key: "topAdvert",
      },
      {
        api: "advertisements",
        params: { section: "page-sidebar" },
        key: "sideAdvert",
      },
    ];
    getData(this, data);
  }

  getlikes(id, path) {
    let self = this;
    let related = this.state.related;
    if (isAuthenticated(this.props.store)) {
      likes(id, path).then(function (response) {
        if (response.status === 200) {
          related.map((aircraft) => {
            if (aircraft.id === id) {
              if (aircraft.liked === 0) {
                aircraft.likes += 1;
                aircraft.liked = 1;
              } else {
                aircraft.likes -= 1;
                aircraft.liked = 0;
              }
            }
          });
          self.setState({ related });
        }
      });
    } else {
      msg.error(`You are not logged in, please first login....`);
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    let { message, aircraft } = this.state;
    if (message) {
      if (isAuthenticated(this.props.store)) {
        this.setState({ submitting: true });
        post("leads_send_message", {
          message: message,
          model: "Aircraft",
          model_id: aircraft.id,
        })
          .then((response) => {
            msg.success("Your message has been sended successfully");
            this.setState({ submitting: false, message: "" });
          })
          .catch((error) => {
            this.setState({ submitting: false });
            msg.error("Something went wrong....");
          });
      } else {
        msg.error("Please login to send message");
      }
    } else {
      msg.error("You are trying to send blank message");
    }
  }
  getGraphData(id, model) {
    list(`aircrafts/${id}/analytics`, { model }).then((response) => {
      let { likeFavouriteById, likeFavouriteByType } = response.data;
      let { monthsByID, viewsByID, likesByID } = graphValues(
        likeFavouriteById,
        "ID"
      );
      let { monthsByType, viewsByType, likesByType } = graphValues(
        likeFavouriteByType,
        "Type"
      );
      this.setState({
        monthsByID,
        viewsByID,
        likesByID,
        monthsByType,
        viewsByType,
        likesByType,
      });
    });
  }

  focusbox() {
    let box = document.getElementById("focus");
    box.focus();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevProps !== this.props) {
      this.setState({ aircraft: this.props.data });
    }
  }

  componentDidMount() {
    let { aircraft } = this.state;
    if (aircraft.id) {
      this.setState({ isAuthenticate: isAuthenticated(this.props.store) });
      post("views", {
        viewable_id: aircraft.id,
        viewable_type: "App\\Aircraft",
      });
      this.getGraphData(aircraft.id, "Aircraft", this);
    }

    jQuery(document).ready(function () {
      function rescaleGrocerytable() {
        var height = jQuery("#focus").height();
        var scale;
        if (height < 800) {
          scale = height / 800;
        } else {
          scale = 1.0;
        }
        jQuery(".carousel-root").css("transform", "scale(" + scale + ")");
        jQuery(".carousel-root").css(
          "-webkit-transform",
          "scale(" + scale + ")"
        );
        jQuery(".carousel-root").css("transform-origin", "300px 0");
        jQuery(".carousel-root").css("-webkit-transform-origin", "300px 0");
      }
      rescaleGrocerytable();
      jQuery(window).resize(function () {
        rescaleGrocerytable();
      });

      $(document).keydown(function (e) {
        switch (e.which) {
          case 37:
            $(".control-prev").click();
            break;

          case 38:
            $(".control-prev").click();
            break;

          case 39:
            $(".control-next").click();
            break;

          case 40:
            $(".control-next").click();
            break;

          default:
            return;
        }
        e.preventDefault();
      });
    });
  }
  render() {
    let {
      aircraft,
      submitting,
      mainImageUrl,
      isAuthenticate,
      related,
      sideAdvert,
      topAdvert,
      showCarousel,
      promoted,
      likesByID,
      viewsByID,
      monthsByID,
      monthsByType,
      viewsByType,
      likesByType,
    } = this.state;
    var date = new Date();

   let title = `${
     aircraft?.manufacturer?.name ? aircraft.manufacturer.name : ""
   }, ${aircraft?.type?.name ? aircraft.type.name : ""}, ${
     aircraft?.model?.name ? aircraft.model.name : ""
   },${aircraft?.yom ? "YOM" + formatDate(aircraft?.yom, ) : ""}, ${
     aircraft?.offer_for ? "aircraft available for " + aircraft?.offer_for : ""
   },`;
   let description = `${aircraft?.manufacturer?.name ? aircraft.manufacturer.name :'' }, ${aircraft?.type?.name ? aircraft.type.name : ''}, ${aircraft?.model?.name ? aircraft.model.name: ''}, ${aircraft?.offer_for ? 'aircraft available for '+aircraft?.offer_for:''}, ${aircraft?.yom ? 'Year of manf '+aircraft?.yom:''}, ${aircraft?.configuration?.name ? 'configration '+aircraft?.configuration?.name:'' }, ${aircraft?.country?.name ? 'current location '+aircraft?.country?.name : ''}.Browse more aircraft in Airbook ${aircraft?.category?.name ? aircraft?.category?.name:''} listing.`
    return (
      <>
        {showCarousel && aircraft.media.length > 0 && (
          <div
            id="focus"
            onLoad={this.focusbox}
            className="w-lightbox-backdrop"
            tabIndex={0}
            style={{
              transition: "opacity 300ms ease 0s",
              opacity: 1,
              textAlign: "right",
              display:"flex"
            }}
          >
            <div
              className="w-lightbox-control w-lightbox-close"
              onClick={() => {
                this.setCarousel();
              }}
            ></div>
            <div className='img-setting'>
              <Carousel
                showIndicators={false}
                autoFocus={true}
                useKeyboardArrows={true}
                autoPlay={true}
                infiniteLoop={true}
                // className='w-lightbox-content w-lightbox-group'
              >
                {aircraft.media.length > 0 &&
                  aircraft.media.map((media, index) => {
                    return (
                      <figure key={index} className="w-lightbox-figure">
                        <img
                        className="w-lightbox-img w-lightbox-image"
                          src={`${process.env.NEXT_PUBLIC_API_URL}static/media/uploads/${media.original_file_name}`}
                        />
                      </figure>
                    );
                  })}
              </Carousel>
            </div>
          </div>
        )}
        <Header seo={this.props.seo} data={{
          title:title || null,
          description:description || null,
          og_image:aircraft?.media?.length ? aircraft.media[0].original_file_name : null
          }} />
        <div className="ab-page-content">
          <div className="ab-container w-container">
            {aircraft.id ? (
              <>
                {topAdvert && topAdvert.media != null && topAdvert.is_active === 1 ? (
                  <a
                    href={topAdvert?.url}
                    target="_blank"
                    className="ab-top-page-advert w-inline-block"
                    style={{
                      backgroundImage:
                        "url(/static/media/uploads/" +
                        topAdvert?.media?.original_file_name +
                        ")",
                    }}
                  ></a>
                ) : (
                  ""
                )}
                <h1 className="details-page-headline">
                  {aircraft.title.split("-").join(" ")}
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
                      formatDate(aircraft.created_at) +
                      " - Updated " +
                      formatDate(aircraft.updated_at)}
                  </div>
                </div>
                <div className="breadcrumb-block">
                  <Link href="/">
                    <a href="index.html" className="breadcrumbs-link">
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
                  <Link href="/aircraft/p/1">
                    <a className="breadcrumbs-link">Aircraft</a>
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
                    {aircraft.manufacturer && aircraft.manufacturer.name}{" "}
                    {aircraft.type && aircraft.type.name}{" "}
                    {aircraft.model && aircraft.model.name}
                  </div>
                </div>
                <div className="flex-wrapper">
                  <div className="flex-col-left">
                    {aircraft.media.length > 0 ? (
                      <div className="image-gallery">
                        <a
                          href="#"
                          className="main-lightbox w-inline-block w-lightbox"
                        >
                          <div
                            className="main-image"
                            style={{
                              backgroundImage: `url(${
                                '"' + mainImageUrl + '"'
                              })`,
                            }}
                            onClick={() => {
                              this.setCarousel();
                            }}
                          >
                            <div className="gal-info-block">
                              <div className="image-controls">
                                <div className="image-icon w-embed">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width={16}
                                    height={16}
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M5 8.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5c0 .829-.672 1.5-1.5 1.5s-1.5-.671-1.5-1.5zm9 .5l-2.519 4-2.481-1.96-4 5.96h14l-5-8zm8-4v14h-20v-14h20zm2-2h-24v18h24v-18z"
                                    />
                                  </svg>
                                </div>
                                <div className="image-count">{`${
                                  aircraft.media && aircraft.media.length
                                } Photos`}</div>
                              </div>
                              <div className="image-controls next-button w-embed">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width={16}
                                  height={16}
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    fill="currentColor"
                                    d="M7.33 24l-2.83-2.829 9.339-9.175-9.339-9.167 2.83-2.829 12.17 11.996z"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </a>
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
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4 14.083c0-2.145-2.232-2.742-3.943-3.546-1.039-.54-.908-1.829.581-1.916.826-.05 1.675.195 2.443.465l.362-1.647c-.907-.276-1.719-.402-2.443-.421v-1.018h-1v1.067c-1.945.267-2.984 1.487-2.984 2.85 0 2.438 2.847 2.81 3.778 3.243 1.27.568 1.035 1.75-.114 2.011-.997.226-2.269-.168-3.225-.54l-.455 1.644c.894.462 1.965.708 3 .727v.998h1v-1.053c1.657-.232 3.002-1.146 3-2.864z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">Commercial</h3>
                      </div>
                      {checkValue(aircraft.offer_for) ? (
                        <div className="data-block">
                          <div className="data-label">Offered for</div>
                          <p className="data-value">{aircraft.offer_for} </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        aircraft.price !== null && aircraft.price >= 1
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Asking price</div>
                          <p className="data-value">{"$" + parseFloat(aircraft.price).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.terms) ? (
                        <div className="data-block">
                          <div className="data-label">Terms</div>
                          <p className="data-value">{aircraft.terms}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {formatDate(aircraft.availability, "availability") ? (
                        <div className="data-block">
                          <div className="data-label">Availability</div>
                          <p className="data-value">
                            {formatDate(aircraft.availability, "availability")}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        aircraft.current_location &&
                          aircraft.current_location.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Location</div>
                          {checkValue(
                            aircraft.current_location && aircraft.current_location.name &&
                              aircraft.current_location.flag
                          ) ? (
                            <div
                              className="svg-flag"
                              style={{
                                backgroundImage: `url(/static/media/site/flags/${aircraft.current_location.flag})`,
                              }}
                            />
                          ) : (
                            ""
                          )}
                          <p className="data-value">
                            {aircraft.current_location.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.owner && aircraft.owner.name) ? (
                        <div className="data-block">
                          <div className="data-label">Owner</div>
                          <p className="data-value">
                            {aircraft.owner && aircraft.owner.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.manager && aircraft.owner && aircraft.owner.name) ? (
                        <div className="data-block">
                          <div className="data-label">Manager</div>
                          <p className="data-value">
                            {aircraft.manager && aircraft.manager.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.seller && aircraft.seller.name) ? (
                        <div className="data-block">
                          <div className="data-label">Seller</div>
                          <p className="data-value">
                            { aircraft.seller.name}
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
                              d="M12 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm0-2c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2.033 16.01c.564-1.789 1.632-3.932 1.821-4.474.273-.787-.211-1.136-1.74.209l-.34-.64c1.744-1.897 5.335-2.326 4.113.613-.763 1.835-1.309 3.074-1.621 4.03-.455 1.393.694.828 1.819-.211.153.25.203.331.356.619-2.498 2.378-5.271 2.588-4.408-.146zm4.742-8.169c-.532.453-1.32.443-1.761-.022-.441-.465-.367-1.208.164-1.661.532-.453 1.32-.442 1.761.022.439.466.367 1.209-.164 1.661z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">General</h3>
                      </div>
                      {checkValue(
                        aircraft.category && aircraft.category.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Category</div>
                          <p className="data-value">
                            {aircraft.category && aircraft.category.name}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        aircraft.manufacturer && aircraft.manufacturer.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Manufacturer</div>
                          <p className="data-value">
                            {checkValue(
                              aircraft.manufacturer &&
                                aircraft.manufacturer.name
                            )}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.type && aircraft.type.name) ? (
                        <div className="data-block">
                          <div className="data-label">Type</div>
                          <p className="data-value">
                            {checkValue(aircraft.type && aircraft.type.name)}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.model && aircraft.model.name) ? (
                        <div className="data-block">
                          <div className="data-label">Model</div>
                          <p className="data-value">
                            {checkValue(aircraft.model && aircraft.model.name)}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {formatDate(aircraft.yom, "yom") ? (
                        <div className="data-block">
                          <div className="data-label">Year of manf</div>
                          <p className="data-value">
                            {formatDate(aircraft.yom, "yom")}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {aircraft.csn ? (
                        <div className="data-block">
                          <div className="data-label">Serial #</div>
                          <p className="data-value">{aircraft.csn}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        aircraft.configuration && aircraft.configuration.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Configuration</div>
                          <p className="data-value">
                            {checkValue(
                              aircraft.configuration &&
                                aircraft.configuration.name
                            )}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      <div className="data-block">
                        <div className="data-label">Seating</div>
                        <p className="data-value">
                          {`B ${checkValue(
                            aircraft.seating_business
                          )} E ${checkValue(
                            aircraft.seating_economy
                          )} F ${checkValue(aircraft.seating_first_class)}`}
                        </p>
                      </div>
                      {checkValue(
                        aircraft.registration_number &&
                          aircraft.registration_number
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Registration# </div>
                          {isAuthenticate ? (
                            <p className="data-value">
                              {checkValue(
                                aircraft.registration_number &&
                                  aircraft.registration_number
                              )}
                            </p>
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
                      {checkValue(
                        aircraft.registration_country &&
                          aircraft.registration_country.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Reg country</div>
                          {checkValue(
                            aircraft.current_location &&
                              aircraft.current_location.flag
                          ) ? (
                            <div
                              className="svg-flag"
                              style={{
                                backgroundImage: `url(/static/media/site/flags/${aircraft.current_location.flag})`,
                              }}
                            />
                          ) : (
                            ""
                          )}
                          <p className="data-value">
                            {checkValue(
                              aircraft.registration_country &&
                                aircraft.registration_country.name
                            )}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        aircraft.current_operator &&
                          aircraft.current_operator.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Operator</div>
                          {isAuthenticate ? (
                            <p className="data-value">
                              {checkValue(
                                aircraft.current_operator &&
                                  aircraft.current_operator.name
                              )}
                            </p>
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
                      {checkValue(
                        aircraft.previous_operator &&
                          aircraft.previous_operator.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Prev-Operator</div>
                          <p className="data-value">
                            {checkValue(
                              aircraft.previous_operator &&
                                aircraft.previous_operator.name
                            )}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(
                        aircraft.previous_operator &&
                          aircraft.previous_operator.name
                      ) ? (
                        <div className="data-block">
                          <div className="data-label">Status</div>
                          <p className="data-value">
                            {checkValue(aircraft.status)}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                    {checkValue(
                      aircraft.engine_model && aircraft.engine_model.name
                    ) ? (
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
                                d="M12,2A10,10,0,1,1,2,12,10,10,0,0,1,12,2Zm0-2A12,12,0,1,0,24,12,12,12,0,0,0,12,0Zm.13,14.33a2.26,2.26,0,0,1-.8-.08A13.24,13.24,0,0,0,11.25,17a6.51,6.51,0,0,0,.58,2.55.76.76,0,0,0,1.37-.1,6.51,6.51,0,0,0,.2-2.61,13.24,13.24,0,0,0-.49-2.7A2.26,2.26,0,0,1,12.13,14.33Zm-1.35-3a1.36,1.36,0,1,1,.65,1.81A1.36,1.36,0,0,1,10.79,11.35Zm-1.08-.44a2.26,2.26,0,0,1,.47-.65A13.24,13.24,0,0,0,7.83,8.83a6.51,6.51,0,0,0-2.5-.75.76.76,0,0,0-.59,1.25,6.51,6.51,0,0,0,2.17,1.46,13.24,13.24,0,0,0,2.59.91A2.26,2.26,0,0,1,9.71,10.91Zm4.67-.33a2.26,2.26,0,0,1,.24.77,13.24,13.24,0,0,0,2.55-1,6.51,6.51,0,0,0,2.11-1.55.76.76,0,0,0-.64-1.22,6.51,6.51,0,0,0-2.47.86,13.24,13.24,0,0,0-2.28,1.53A2.26,2.26,0,0,1,14.38,10.58Z"
                                fill="currentColor"
                              />
                            </svg>
                          </div>
                          <h3 className="details-block-headline">Engines</h3>
                        </div>
                        <div className="data-block">
                          <div className="data-label">Engine model</div>
                          <p className="data-value">
                            {checkValue(
                              aircraft.engine_model &&
                                aircraft.engine_model.name
                            )}
                          </p>
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
                              d="M12,2A10,10,0,1,1,2,12,10,10,0,0,1,12,2Zm0-2A12,12,0,1,0,24,12,12,12,0,0,0,12,0Zm5.83,10.86-1.09-.13a4.89,4.89,0,0,0-.49-1.18l.68-.86a.35.35,0,0,0,0-.46L15.77,7.1a.36.36,0,0,0-.46,0l-.87.68a4.82,4.82,0,0,0-1.18-.49l-.13-1.09a.36.36,0,0,0-.34-.3H11.2a.35.35,0,0,0-.34.3l-.13,1.09a4.86,4.86,0,0,0-1.18.49l-.87-.68a.36.36,0,0,0-.46,0L7.1,8.23a.36.36,0,0,0,0,.46l.68.87a4.85,4.85,0,0,0-.49,1.18l-1.09.13a.36.36,0,0,0-.3.34v1.6a.36.36,0,0,0,.3.34l1.09.13a4.88,4.88,0,0,0,.49,1.18l-.68.87a.36.36,0,0,0,0,.46L8.23,16.9a.36.36,0,0,0,.46,0l.87-.68a4.83,4.83,0,0,0,1.18.49l.13,1.09a.35.35,0,0,0,.34.3h1.6a.35.35,0,0,0,.34-.3l.13-1.09a4.87,4.87,0,0,0,1.18-.49l.87.68a.36.36,0,0,0,.46,0l1.13-1.13a.36.36,0,0,0,0-.46l-.68-.87a4.85,4.85,0,0,0,.49-1.18l1.09-.13a.35.35,0,0,0,.3-.34V11.2A.35.35,0,0,0,17.83,10.86ZM12,15.07A3.07,3.07,0,1,1,15.07,12,3.07,3.07,0,0,1,12,15.07Z"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">Technical</h3>
                      </div>
                      {checkValue(aircraft.compliance) ? (
                        <div className="data-block">
                          <div className="data-label">Compliance</div>
                          <p className="data-value">
                            {checkValue(aircraft.compliance)}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      <div className="data-block">
                        <div className="data-label">Total time</div>
                        <p className="data-value">7399</p>
                      </div>
                      <div className="data-block">
                        <div className="data-label">Total cycles</div>
                        <p className="data-value">56299</p>
                      </div>
                      {checkValue(aircraft.mtow) ? (
                        <div className="data-block">
                          <div className="data-label">MTOW</div>
                          <p className="data-value">
                            {checkValue(aircraft.mtow)}{" "}
                            <span className="unit-span">KG</span>
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {checkValue(aircraft.mlgw) ? (
                        <div className="data-block">
                          <div className="data-label">MLGW</div>
                          <p className="data-value">
                            {checkValue(aircraft.mlgw)}{" "}
                            <span className="unit-span">KG</span>
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      {formatDate(aircraft.last_c_check, "availability") ? (
                        <div className="data-block">
                          <div className="data-label">Last C-Check</div>
                          <p className="data-value">
                            {formatDate(aircraft.last_c_check, "availability")}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>

                    <div className="details-data-block">
                      {checkValue(aircraft.last_c_check) ? (
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
                      ) : (
                        ""
                      )}
                      <div className="data-block">
                        {aircraft.last_c_check &&
                          find_date_differance(aircraft.last_c_check, date) >
                            0 && (
                            <p className="data-value">
                              {`This aircraft is going to have c-check in next ${find_date_differance(
                                aircraft.last_c_check,
                                date
                              )} days and will be available fresh afterwards.`}
                            </p>
                          )}
                        {aircraft.last_c_check &&
                          find_date_differance(aircraft.last_c_check, date) <
                            0 && (
                            <p className="data-value">
                              {`This aircraft has been c-check ${Math.abs(
                                find_date_differance(
                                  aircraft.last_c_check,
                                  date
                                )
                              )} days ago and now its available.`}
                            </p>
                          )}
                        {aircraft.last_c_check &&
                          find_date_differance(aircraft.last_c_check, date) ===
                            0 && (
                            <p className="data-value">
                              {`This aircraft has been c-check today and now its available.`}
                            </p>
                          )}
                      </div>
                    </div>
                    {aircraft.attachments.length ? (
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
                          <h3 className="details-block-headline">
                            Attachments
                          </h3>
                        </div>
                        {aircraft.attachments.length > 0 &&
                          aircraft.attachments.map((attachment, index) => {
                            return (
                              <div
                                className="data-block file-attachment"
                                key={index}
                              >
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
                                  {isAuthenticate ? (
                                    <a
                                      href={
                                        "/static/media/uploads/" +
                                        attachment.original_file_name
                                      }
                                      target="_blank"
                                      className="data-value file-attachment"
                                    >
                                      {attachment.original_file_name
                                        .split("/")
                                        .pop()}
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
                                      <div className="locked-alert">
                                        Login to view
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      ""
                    )}
                    <div className="details-data-block">
                      <div className="label-block">
                        <div className="ab-svg-icon details-page w-embed">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={16}
                            height={16}
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M13.012 5.007v-1.668l2.802-2.771c.409.136.809.293 1.197.471l-3.999 3.968zm7.089-1.93l-7.089 7.058v.853h.877l7.044-7.076c-.263-.292-.541-.57-.832-.835zm-7.089-1.468l1.437-1.406c-.46-.094-.96-.163-1.437-.203v1.609zm10.789 7.962l-1.386 1.417h1.585c-.04-.47-.106-.964-.199-1.417zm-.363-1.366c-.135-.41-.292-.81-.469-1.199l-3.951 3.982h1.668l2.752-2.783zm-1.063-2.337c-.205-.346-.426-.682-.664-1.004l-6.093 6.124h1.668l5.089-5.12zm-3.225-3.57c-.322-.238-.657-.459-1.003-.665l-5.135 5.104v1.668l6.138-6.107zm-8.15 10.702v-13c-6.161.519-11 5.683-11 11.978 0 6.639 5.382 12.022 12.021 12.022 6.296 0 11.46-4.839 11.979-11h-13z"
                            />
                          </svg>
                        </div>
                        <h3 className="details-block-headline">Analytics</h3>
                      </div>
                      <div className="data-block charts">
                        <div className="analytics-block">
                          {monthsByID.length > 0 && (
                            <Canvas
                              title="This aircraft"
                              labels={monthsByID}
                              views={viewsByID}
                              likes={likesByID}
                            />
                          )}
                        </div>
                        <div className="analytics-block">
                          {monthsByType.length > 0 && (
                            <Canvas
                              title={`All ${getTitle(
                                aircraft.title
                              )} on Airbook`}
                              labels={monthsByType}
                              views={viewsByType}
                              likes={likesByType}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="related-items-block">
                      <div className="details-page-headline related-assets">
                        Related aircraft
                      </div>
                      {related.length > 0 ? (
                        related.map((aircraft, index) => {
                          return (
                            <div
                              className="w-layout-grid ab-list-grid"
                              key={index}
                            >
                              <div className="ab-list-item-wrapper">
                                {aircraft.is_featured ? (
                                  <div className="premium-tag">Premium</div>
                                ) : (
                                  ""
                                )}
                                <div className="item-flex-header">
                                  <div className="item-title-block">
                                    <Link
                                      href={{ pathname: `/aircraft/[detail]` }}
                                      as={`/aircraft/${
                                        aircraft.id + "-" + aircraft.title
                                      }`}
                                    >
                                      <a className="item-link-block w-inline-block">
                                        <h2 className="item-composite-title">
                                          {getTitle(aircraft.title)}
                                        </h2>
                                      </a>
                                    </Link>
                                    <div className="item-h3-block">
                                      <div className="available-label">
                                        Available for
                                      </div>
                                      <h3 className="available-value">
                                        {aircraft.offer_for}
                                      </h3>
                                    </div>
                                  </div>
                                  <div className="item-like-block">
                                    <div
                                      className="ab-likes w-embed"
                                      onClick={() =>
                                        this.getlikes(aircraft.id, "Aircraft")
                                      }
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        className={
                                          aircraft.liked !== 0 ? "liked" : ""
                                        }
                                      >
                                        <path
                                          fill="currentColor"
                                          d="M5 22h-5v-12h5v12zm17.615-8.412c-.857-.115-.578-.734.031-.922.521-.16 1.354-.5 1.354-1.51 0-.672-.5-1.562-2.271-1.49-1.228.05-3.666-.198-4.979-.885.906-3.656.688-8.781-1.688-8.781-1.594 0-1.896 1.807-2.375 3.469-1.221 4.242-3.312 6.017-5.687 6.885v10.878c4.382.701 6.345 2.768 10.505 2.768 3.198 0 4.852-1.735 4.852-2.666 0-.335-.272-.573-.96-.626-.811-.062-.734-.812.031-.953 1.268-.234 1.826-.914 1.826-1.543 0-.529-.396-1.022-1.098-1.181-.837-.189-.664-.757.031-.812 1.133-.09 1.688-.764 1.688-1.41 0-.565-.424-1.109-1.26-1.221z"
                                        ></path>
                                      </svg>
                                    </div>
                                    <div className="likecount">
                                      {aircraft.likes}
                                    </div>
                                  </div>
                                </div>
                                <div className="item-data-flex">
                                  {getMediaUrl(aircraft.media) ? (
                                    <Link
                                      href={{ pathname: `/aircraft/[detail]` }}
                                      as={`/aircraft/${
                                        aircraft.id + "-" + aircraft.title
                                      }`}
                                    >
                                      <a className="item-image w-inline-block" style={{backgroundImage: `url(${'"'+getMediaUrl(aircraft.media)+'"'})`}}></a>
                                    </Link>
                                  ) : (
                                    ""
                                  )}
                                  <div className="item-info-block">
                                    <div className="flex-specsbox">
                                      <div className="sn-label">SN</div>

                                      {isAuthenticate ? (
                                        <>
                                          <div className="item-specs sn-value">
                                            {aircraft.csn
                                              ? aircraft.csn
                                              : "(On Request)"}
                                          </div>
                                          <div className="item-specs reg-value">
                                            {aircraft.registration_number
                                              ? "REG " +
                                                aircraft.registration_number
                                              : ""}
                                          </div>
                                        </>
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
                                    <div className="flex-specsbox">
                                      <p className="item-specs">
                                        <span className="spec-span">
                                          {aircraft.type && aircraft.type.type}
                                        </span>{" "}
                                        <span className="spec-span dot-before">
                                          {"YOM " +
                                            formatDate(aircraft.yom, "yom")}
                                        </span>
                                        {checkValue(aircraft.tsn) ? (
                                          <span className="spec-span dot-before tsn">
                                            {"TSN " + aircraft.tsn}
                                          </span>
                                        ) : (
                                          ""
                                        )}{" "}
                                        <span className="spec-span dot-before item-status">
                                          {aircraft.status}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="flex-specsbox">
                                      <div className="ab-svg-icon w-embed">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="18"
                                          height="18"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            fill="currentColor"
                                            d="M14 18.435v.565h-14v-.583c-.006-1.557.062-2.446 1.854-2.86 1.964-.453 3.901-.859 2.97-2.577-2.762-5.093-.788-7.98 2.176-7.98 2.908 0 4.93 2.78 2.178 7.979-.905 1.708.963 2.114 2.97 2.577 1.797.416 1.859 1.311 1.852 2.879zm10-13.435h-8v2h8v-2zm0 4h-8v2h8v-2zm0 4h-8v2h8v-2zm0 4h-8v2h8v-2z"
                                          ></path>
                                        </svg>
                                      </div>

                                      {isAuthenticate ? (
                                        <Link
                                          href={{
                                            pathname: `/contact/[detail]`,
                                          }}
                                          as={`/contact/${
                                            aircraft.primary_contact &&
                                            aircraft.primary_contact.id +
                                              "-" +
                                              aircraft.primary_contact
                                                .first_name +
                                              "-" +
                                              aircraft.primary_contact.last_name
                                          }`}
                                        >
                                          <a className="publisher-link">
                                            {aircraft.primary_contact &&
                                              aircraft.primary_contact
                                                .first_name}{" "}
                                            {aircraft.primary_contact &&
                                              aircraft.primary_contact
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
                                      {checkValue(
                                        aircraft.current_location &&
                                          aircraft.current_location.name
                                      ) ? (
                                        <div className="location-box">
                                          <div className="ab-svg-icon w-embed">
                                            <svg
                                              width="16"
                                              height="16"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fillRule="evenodd"
                                              clipRule="evenodd"
                                            >
                                              <path
                                                fill="currentColor"
                                                d="M20 18v2h-20v-2h20zm-19.989-6.426l2.624-1.5 4.765 1.815s9.197-5.519 11.773-7.038c2.226-1.312 4.268-.853 4.647-.216.448.753.131 2.366-2.576 4.09-2.166 1.38-9.233 5.855-9.233 5.855-4.969 2.708-7.565.657-7.565.657l-4.435-3.663zm5.587-6.621l-2.598 1.5 6.252 3.173 5.388-3.227-9.042-1.446z"
                                              ></path>
                                            </svg>
                                          </div>
                                          <div className="country-name">
                                            {aircraft.current_location &&
                                              aircraft.current_location.name}
                                          </div>
                                        </div>
                                      ) : (
                                        ""
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
                            No related aircrafts.
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
                          Aircraft summary
                        </h3>
                      </div>
                      {aircraft.csn ? (
                        <div className="sidebar-data-block">
                          <div className="data-label">Serial #</div>
                          <p className="data-value">{aircraft.csn}</p>
                        </div>
                      ) : (
                        ""
                      )}
                      {aircraft.yom ? (
                        <div className="sidebar-data-block">
                          <div className="data-label">Year of manf</div>
                          <p className="data-value">
                            {formatDate(aircraft.yom, "yom")}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                      <div className="sidebar-data-block">
                        <div className="data-label">Offered for</div>
                        <div className="offered-for-value">
                          {checkValue(aircraft.offer_for) ? (
                            <p className="data-value">{aircraft.offer_for}</p>
                          ) : (
                            ""
                          )}
                          {checkValue(aircraft.price && aircraft.price >= 1) ? (
                            <div className="sidebar-price">
                              {"$" + parseFloat(aircraft.price).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </div>
                          ) : (
                            ""
                          )}
                        </div>
                      </div>
                      {aircraft.availability ? (
                        <div className="sidebar-data-block">
                          <div className="data-label">Availability</div>
                          <p className="data-value">
                            {formatDate(aircraft.availability, "availability")}
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
                                aircraft.primary_contact &&
                                  `${aircraft.primary_contact.first_name} ${aircraft.primary_contact.last_name}`
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
                                  aircraft.primary_contact &&
                                  aircraft.primary_contact.id +
                                    "-" +
                                    aircraft.primary_contact.first_name +
                                    "-" +
                                    aircraft.primary_contact.last_name
                                }`}
                              >
                                <a target="_blank" className="sidebar-link">
                                  {checkValue(
                                    aircraft.primary_contact &&
                                      `${aircraft.primary_contact.first_name} ${aircraft.primary_contact.last_name}`
                                  )}
                                </a>
                              </Link>
                              <div className="sidebar-publisher-txt">
                                {checkValue(
                                  aircraft.primary_contact &&
                                    aircraft.primary_contact.job_title &&
                                    aircraft.primary_contact.job_title.name
                                )}
                              </div>
                              <div className="member-info">{`Member since ${formatDate(
                                aircraft.primary_contact &&
                                  aircraft.primary_contact.created_at,
                                "availability"
                              )}`}</div>
                              <Link
                                href={{ pathname: `/company/detail` }}
                                as={`/company/${
                                  aircraft.primary_contact &&
                                  aircraft.primary_contact.company &&
                                  aircraft.primary_contact.company.id +
                                    "-" +
                                    aircraft.primary_contact.company.name
                                }`}
                              >
                                <a
                                  target="_blank"
                                  className="sidebar-link org-name"
                                >
                                  {checkValue(
                                    aircraft.primary_contact &&
                                      aircraft.primary_contact.company &&
                                      aircraft.primary_contact.company.name
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
                            {checkValue(
                              aircraft.primary_contact &&
                                aircraft.primary_contact.country &&
                                aircraft.primary_contact.country.name
                            ) ? (
                              <div className="sidebar-country">
                                {checkValue(
                                  aircraft.current_location &&
                                    aircraft.current_location.flag
                                ) ? (
                                  <div
                                    className="svg-flag"
                                    style={{
                                      backgroundImage: `url(/static/media/site/flags/${aircraft.current_location.flag})`,
                                    }}
                                  />
                                ) : (
                                  ""
                                )}
                                <div className="ab-list-data-txt">
                                  {aircraft.primary_contact &&
                                    aircraft.primary_contact.country &&
                                    aircraft.primary_contact.country.name}
                                </div>
                              </div>
                            ) : (
                              ""
                            )}
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
                          href={`https://www.linkedin.com/shareArticle?mini=true&url=${process.env.NEXT_PUBLIC_API_URL}aircraft/${this.props.params.detail}`}
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
                          href={`https://www.facebook.com/sharer/sharer.php?u=${process.env.NEXT_PUBLIC_API_URL}aircraft/${this.props.params.detail}`}
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
                          href={`https://api.whatsapp.com/send?text=${process.env.NEXT_PUBLIC_API_URL}aircraft/${this.props.params.detail}`}
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
                    {checkValue(promoted.length > 0) ? (
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
                            Promoted Aircraft listing
                          </div>
                        </div>
                        {promoted.length > 0 ? (
                          promoted.map((aircraft, index) => {
                            return (
                              <div
                                className="w-layout-grid sidebar-promoted-grid"
                                key={index}
                              >
                                <div className="ab-list-item-wrapper sidebar-promoted">
                                  <div className="item-flex-header">
                                    <div className="item-title-block">
                                      <Link
                                        href={{
                                          pathname: `/aircraft/[detail]`,
                                        }}
                                        as={`/aircraft/${
                                          aircraft.id &&
                                          aircraft.id + "-" + aircraft.title
                                        }`}
                                      >
                                        <a
                                          aria-current="page"
                                          className="item-link-block w-inline-block w--current"
                                        >
                                          <h2 className="item-composite-title">
                                            {getTitle(aircraft.title)}
                                          </h2>
                                        </a>
                                      </Link>
                                      <div className="item-h3-block">
                                        <div className="available-label">
                                          Available for{" "}
                                        </div>
                                        <h3 className="available-value">
                                          {aircraft.offer_for}
                                        </h3>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="item-data-flex">
                                    <div className="item-info-block">
                                      <div className="flex-specsbox">
                                        <div className="sn-label">SN</div>
                                        {isAuthenticate ? (
                                          <>
                                            <div className="item-specs sn-value">
                                              {aircraft.csn
                                                ? aircraft.csn
                                                : "(On Request)"}
                                            </div>
                                            <div className="item-specs reg-value">
                                              {aircraft.registration_number
                                                ? "REG " +
                                                  aircraft.registration_number
                                                : ""}
                                            </div>
                                          </>
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
                                      {checkValue(aircraft.yom) ? (
                                        <p className="item-specs">
                                          <span className="spec-span">
                                            {aircraft.type &&
                                              aircraft.type.type}
                                          </span>{" "}
                                          <span className="spec-span dot-before">
                                            {"YOM " +
                                              formatDate(aircraft.yom, "yom")}
                                          </span>
                                        </p>
                                      ) : (
                                        ""
                                      )}
                                    </div>
                                  </div>
                                  {aircraft.is_featured ? (
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
                              No promoted aircrafts.
                            </div>
                          </div>
                        )}
                        {sideAdvert && sideAdvert.media != null && sideAdvert.is_active ===1 ? (
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
        <Footer />
      </>
    );
  }
}

export default connect(null, site.actions)(AircraftDetailPage);
