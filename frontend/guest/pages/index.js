import Header from "../components/Header";
import Footer from "../components/Footer";
import { connect } from "react-redux";
import Link from "next/link";
import Router, { withRouter } from "next/router";
import { post } from "../helpers/api";
import msg from "../helpers/notifications";
import cookies from "next-cookies";
import * as site from "../redux/actions/siteActions";
import axios from "axios";
import { getTitle, load_meta  } from "../helpers/functions";

export async function getServerSideProps(ctx) {

  let data = [], seo = [],
    headers = {
      "Content-Type": "application/json",
    };
  let { authToken } = cookies(ctx);

  if (authToken !== undefined && authToken !== null)
    headers["Authorization"] = `Token ${authToken.replace(/['"]+/g, "")}`;

  if (ctx.query.search !== "undefined" && ctx.query.search !== undefined)
    search = ctx.query.search;

    // load seo tags
    await load_meta('Home').then((response) => {
      seo = response.data;
    });

  await axios
    .get(process.env.NEXT_PUBLIC_API_URL + `api/home_contents`, {
      headers: headers,
      params: {
        // search:search,
        page: ctx.query.list,
        filters: ctx.query.filters !== "{}" ? ctx.query.filters : null,
        frontend: true,
      },
    })
    .then((response) => {
      data = response.data;
    });

  return {
    props: { data, query: ctx.query, seo },
  };
}

class App extends React.Component {
  constructor(props) {
    super(props);
    let response = this.props;
    this.state = {
      topAdvert: {},
      home: response.data,
      wanteds: response.data.wanted,
      activeIndex: 0,
      listType: "aircraft",
    };
    this.props.search({ type: "all", value: [], detail: true });
    this.props.searching(false);
  }
  componentDidUpdate() {
    this.props.search({ type: "home", value: [], detail: true });
  }
  getData() {
    let data = [
      {
        api: "advertisements",
        params: { section: "page-top" },
        key: "topAdvert",
      },
      {
        api: "advertisements",
        params: { section: "page-bottom" },
        key: "bottomAdvert",
      },
    ];
    getData(this, data);
  }

  handlClick = (type) => {
    this.setState({ listType: type });
  };

  render() {
    let { topAdvert, wanteds, home, listType } = this.state;
    let p = 1;
    return (
      <>
        <Header seo={this.props.seo} />
        <div>
          <div className="ab-home-advert">
            <div className="ab-home-hero-container w-container">
              <h2 className="ab-home-hero-h2">Get more leads</h2>
              <p className="ab-home-hero-p">
                Promote your aircraft &amp; engines on Airbook
              </p>
            </div>
          </div>
          <div className="home-h1-section">
            <div className="ab-container w-container">
              <h1 className="ab-home-h1">
                On Airbook you can quickly market your aircraft, engines, APU
                and parts for sale, lease, charter &amp; ACMI. It's free!
              </h1>
            </div>
          </div>
          <div className="home-listing-section">
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
                      "url(/static/images/" +
                      topAdvert.media.original_file_name +
                      ")",
                  }}
                ></a>
              ) : (
                ""
              )}
              <div className="home-latest-flex-wrapper">
                <div className="home-latest-listings offered">
                  <div className="listing-headline-div">
                    <h2 className="home-listing-headline">
                      Latest Offered Assets
                    </h2>
                  </div>
                  <div className="home-listing-block">
                    {home[listType].map((hom, index) => {
                      return (
                        <div className="home-latest-link-composite" key={index}>
                          <Link
                            href={{ pathname: `/${listType}/[detail]` }}
                            as={`/${listType}/${
                              hom.id &&
                              hom.id + "-" + hom.title.split("/").join("-")
                            }`}
                          >
                            <a className="latest-link-span">
                              {getTitle(hom.title)}
                            </a>
                          </Link>{" "}
                          for{" "}
                          <span className="latest-type-span">
                            {hom.offer_for}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="latest-btn-block">
                    <a
                      onClick={() => this.handlClick("aircraft")}
                      href="#"
                      className={
                        listType === "aircraft"
                          ? "home-view-all-btn w-button"
                          : "home-view-al-btn w-button"
                      }
                    >
                      aircraft
                    </a>
                    <a
                      onClick={() => this.handlClick("engine")}
                      href="#"
                      className={
                        listType === "engine"
                          ? "home-view-all-btn w-button"
                          : "home-view-al-btn w-button"
                      }
                    >
                      engines
                    </a>
                    <a
                      onClick={() => this.handlClick("apu")}
                      href="#"
                      className={
                        listType === "apu"
                          ? "home-view-all-btn w-button"
                          : "home-view-al-btn w-button"
                      }
                    >
                      APU's
                    </a>
                  </div>
                </div>
                <div className="home-latest-listings">
                  <div className="listing-headline-div wanted">
                    <h2 className="home-listing-headline">
                      Latest Wanted Assets
                    </h2>
                  </div>
                  <div className="home-listing-block">
                    {home.wanted.map((wanted, index) => {
                      return (
                        <div className="home-latest-link-composite" key={index}>
                          <Link
                            href={{ pathname: `/wanted/[detail]` }}
                            as={`/wanted/${
                              wanted.id &&
                              wanted.id +
                                "-" +
                                wanted.title.split("/").join("-")
                            }`}
                          >
                            <a className="latest-link-span">
                              {getTitle(wanted.title, "wanted")}
                            </a>
                          </Link>{" "}
                          for{" "}
                          <span className="latest-type-span">
                            {wanted.terms}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="latest-btn-block">
                    <Link href="/wanted/p/[list]" as={`/wanted/p/${p}`}>
                      <a className="home-view-all-btn w-button">
                        view all wanted listings
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="home-wanted-section">
            <div className="ab-container w-container">
              <div className="listing-headline-div">
                <h2 className="home-listing-headline">
                  Browse by Manufacturers
                </h2>
              </div>
              <div className="home-cat-flex-block">
                <div className="home-asset-cat">
                  <h3 className="home-cat-manf-title">
                    Aircraft&nbsp;{" "}
                    <Link href="/aircraft/p/[list]" as={`/aircraft/p/${p}`}>
                      <a className="link-2">View all</a>
                    </Link>
                  </h3>
                  {home.aircraft_manufacturer.map((manufacturer, index) => {
                    return (
                      <div className="home-cat-link-flex" key={index}>
                        <Link
                          href={`/aircraft/p/1?filters={"manufacturer":[${manufacturer.id}]}`}
                        >
                          <a className="home-asset-cat-link">
                            {manufacturer.name}
                          </a>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <div className="home-asset-cat eng">
                  <h3 className="home-cat-manf-title">
                    Engines{" "}
                    <Link href="/engine/p/[list]" as={`/engine/p/${p}`}>
                      <a className="link-2">View all</a>
                    </Link>
                  </h3>
                  {home.engine_manufacturer.map((manufacturer, index) => {
                    return (
                      <div className="home-cat-link-flex" key={index}>
                        <Link
                          className="latest-link-span"
                          href={`/engine/p/1?filters={"manufacturer":[${manufacturer.id}]}`}
                        >
                          <a className="home-asset-cat-link">
                            {manufacturer.name}
                          </a>
                        </Link>
                      </div>
                    );
                  })}
                </div>
                <div className="home-asset-cat apu">
                  <h3 className="home-cat-manf-title">
                    APU{" "}
                    <Link href="/apu/p/[list]" as={`/apu/p/${p}`}>
                      <a className="link-2">View all</a>
                    </Link>
                  </h3>
                  {home.apu_manufacturer.map((manufacturer, index) => {
                    return (
                      <div className="home-cat-link-flex" key={index}>
                        <Link
                          className="latest-link-span"
                          href={`/apu/p/1?filters={"manufacturer":[${manufacturer.id}]}`}
                        >
                          <a className="home-asset-cat-link">
                            {manufacturer.name}
                          </a>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
}

export default connect(null, site.actions)(withRouter(App));
