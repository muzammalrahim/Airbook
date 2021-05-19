import Link from 'next/link'
import { isAuthenticated } from '../helpers/frontend'
import { makeStore } from '../redux/store';
import React from 'react';
import { useStore } from 'react-redux';
import Head from 'next/head';
import { list, post } from '../helpers/api';
import Router, {useRouter} from 'next/router'
import { connect } from "react-redux";
import * as site from "../redux/actions/siteActions";
import Detail from '../pages/aircraft/[detail]';


const searchOptions = [
  {label:'All', value: 'all'},
  {label:'Aircraft', value: 'aircraft'},
  {label:'Engines', value: 'engine'},
  {label:'APU\'s', value: 'apu'},
  {label:'Parts', value: 'parts'},
  {label:'Wanted', value: 'wanted'},
  {label:'Contacts', value: 'contact'},
  {label:'Companies', value: 'company'},
  {label:'Airports', value: 'airport'},
];

function Header(props, { Component, pageProps, router }) {
  const store = useStore((state) => state);
  let {seo } = props;
  seo = seo.results && seo.results.length ? seo.results[0]:{}
  let og_image = "static/images/og.jpg"
  if(seo?.media && seo?.media?.original_file_name)
     og_image = 'static/media/uploads/'+seo?.media?.original_file_name;
  if(props?.data && props?.data?.og_image)
        og_image = 'static/media/uploads/'+props?.data?.og_image

  let seo_title = props?.data?.title?.split('-').join(' ').concat(" - Airbook") || seo.title
  if(!seo_title)
    seo_title = 'Airbook Website';
  seo_title = seo_title?.charAt(0).toUpperCase() + seo_title?.slice(1);

  const [isAuthenticate, setAuthenticate] = React.useState(props.user !== null ? true:false);
  // const [searching, setSearching] = React.useState(false);
  const defaultNavWidth = typeof window !== 'undefined' ? window.innerWidth:600
  const linkStyle = {width:'100%'}
  const menuBtnStyle = { position: 'relative',
    float: 'right',
    padding: '18px',
    fontSize: '24px',
    cursor: 'pointer',
    tapHighlightColor: 'rgba(0, 0, 0, 0)',
  }
  const closeMenuStyle = {
    menu: {display:'none'},
    burgerUp: {
      ['transformStyle']: 'preserve-3d',
        transition: 'transform 300ms ease 0s',
        transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px) translateZ(0px)'
      },
    burgerDown: {
      ['transformStyle']: 'preserve-3d',
        transition: 'transform 300ms ease 0s',
        transform: 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px) translateZ(0px)'
    }
  }
  const openMenuStyle = {
    menu: {display:'contents'},
    burgerUp: {
     ['transformStyle']: 'preserve-3d',
        transition: 'transform 300ms ease 0s',
        transform: 'rotateX(0deg) rotateY(0deg) rotateZ(-42deg) translateX(-4px) translateY(0px) translateZ(0px)'
      },
    burgerDown: {
      ['transformStyle']: 'preserve-3d',
        transition: 'transform 300ms ease 0s',
        transform: 'rotateX(0deg) rotateY(0deg) rotateZ(42deg) translateX(-4px) translateY(0px) translateZ(0px)'
    }
  }
  const [menuStyle, setMenuStyle] = React.useState(closeMenuStyle)

  let defaultOption = 'all', defaultSearchStr = '';
  if(props.searchItem !== null) {
    if(props.searchItem.type !== 'part')
      defaultOption = props.searchItem.type
    defaultSearchStr = props.searchItem.value !== undefined ? props.searchItem.value : defaultOption
  }
  const [searchStr, setSearchStr] = React.useState(defaultSearchStr);
  const [searchOption, setSearchOption] = React.useState(defaultOption);

  function redirectToUserDashboard(e) {
    e.preventDefault();
    window.location.assign(`${process.env.NEXT_PUBLIC_USER_URL}/user/dashboard`);
  }

  React.useEffect(() => {
    const { bodyClass } = props
    setAuthenticate(props.user !== null ? true:false);
    document.querySelector("body").classList.add('body')
  }, []);

  React.useEffect(() => {
    setAuthenticate(props.user !== null ? true:false);
  });

  let p = 1;

  function doSearch(e) {
    e.preventDefault();
    if(!props.isSearching) {
      props.searching(true);
      Router.push(`/${searchOption}/p/[list]?search=${searchStr}`, `/${searchOption}/p/1?search=${searchStr}`)
    }

  }

  function triggerMenu(){
      let width = window.innerWidth;
    if(menuStyle.menu.display === 'none') {
      setMenuStyle(openMenuStyle)
      let interval = setInterval(function(){ 
        if(width >= 0) {
        $('#w-nav-overlay-10 nav').css({transform: `translateX(-${width}px)`}) 
        width -= 75
        } else {
          $('#w-nav-overlay-10 nav').css({transform: `translateX(0px)`}) 
           clearInterval(interval);
         }
      }, 1);
    } else {
      let i = 0;
        $('#w-nav-overlay-10 nav').css({transform: `translateX(-50px)`}) 
      let interval = setInterval(function(){ 
        if((i + width) >= 0) {
        $('#w-nav-overlay-10 nav').css({transform: `translateX(${i}px)`}) 
          i -= 40
        } else {
          $('#w-nav-overlay-10').css({transform: `translateX(-${width}px)`}) 
           clearInterval(interval);
           setTimeout(() => setMenuStyle(closeMenuStyle), 400)
            
         }
      }, 1);
      
    }
  }
 const route = useRouter('/')
  let normal_class = "nav-link w-nav-link";
  let current_class ="nav-link w-nav-link w--current";
  return (
    <>
      <Head>
        <>
          <meta charSet="utf-8"></meta>
          <title>{seo_title}</title>
          <meta
            content="width=device-width, initial-scale=1"
            name="viewport"
          ></meta>
          <meta content="Webflow" name="generator"></meta>
          <meta name="title" property="og:title" content={seo_title}></meta>
          <meta
            name="google-site-verification"
            content="wpJgK-14RF7fO3DK2kOceNryY8Adri-JdabUYZvDQR4"
          />
          <meta
            name="description"
            property="og:description"
            content={props?.data?.description || seo.description || "Airbook"}
          ></meta>
          {/* <meta
            name="description"
            content={props?.data?.description || seo.description || "Airbook"}
          ></meta> */}
          <meta
            name="image"
            property="og:image"
            content={process.env.NEXT_PUBLIC_API_URL + og_image}
          ></meta>
          {/* <meta
            name="image"
            content={process.env.NEXT_PUBLIC_API_URL + og_image}
          ></meta> */}
          <meta name="url" property="og:url" content={seo.url}></meta>
          <meta name="twitter:card" content="summary_large_image"></meta>
          <meta
            name="site_name"
            property="og:site_name"
            content="AirBook, Inc."
          ></meta>
          <meta name="twitter:image:alt" content="AirBook"></meta>
          <link
            href="/static/css/normalize.css"
            rel="stylesheet"
            type="text/css"
          ></link>
          <link
            href="/static/css/webflow.css"
            rel="stylesheet"
            type="text/css"
          ></link>
          <link
            href="/static/css/airbookzsmk.webflow.css"
            rel="stylesheet"
            type="text/css"
          ></link>
          <script
            src="https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js"
            type="text/javascript"
          ></script>
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Montserrat:100,100italic,200,200italic,300,300italic,400,400italic,500,500italic,600,600italic,700,700italic,800,800italic,900,900italic"
            media="all"
          ></link>
          <link
            href="/static/css/custom.css"
            rel="stylesheet"
            type="text/css"
          ></link>
          <link
            href="/static/images/favicon.png"
            rel="shortcut icon"
            type="image/x-icon"
          ></link>
          <link href="/static/images/webclip.png" rel="apple-touch-icon"></link>
          <meta name="theme-color" content="#172b4d"></meta>
          <meta name="yandex-verification" content="139220324c5d5f8f"></meta>
          <meta
            name="msvalidate.01"
            content="51E9D2582B62C9692E9A40F2CB7ED9D4"
          ></meta>
          <script
            src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.4.1.min.220afd743d.js?site=5e2dd32412d9358395f1e701"
            type="text/javascript"
            integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo="
            crossOrigin="anonymous"
          ></script>
          <script src="/static/js/webflow.js" type="text/javascript"></script>
          <script src="/static/js/custom.js" type="text/javascript"></script>
        </>
      </Head>
      <div id="airbook" className="ab-header nav-container">
        <div id="top" className="ab-topbar">
          <div className="ab-container container-flex w-container">
            <div className="topbar-left-block">
              <Link href="/support/" as="/support/">
                <a className="topbar-button ab-support w-button">Support</a>
              </Link>
            </div>
            <div className="topbar-right-block">
              {isAuthenticate === true ? (
                ""
              ) : (
                <a
                  href="/register"
                  className="topbar-button ab-signin w-button"
                >
                  Register(free)
                </a>
              )}
              {isAuthenticate === true ? (
                <a
                  onClick={(e) => redirectToUserDashboard(e)}
                  className="topbar-button ab-signin w-button"
                >
                  Account
                </a>
              ) : (
                <a href="/login" className="publish-button w-button">
                  My Account
                </a>
              )}
            </div>
          </div>
        </div>
        <div id="search" className="ab-searchbar">
          <div className="ab-container container-flex w-container">
            {route.asPath == "/" ? (
              <a
                aria-current="page"
                className="ab-brand w-inline-block w--current"
              >
                <img
                  src="/static/images/Airbook_white.svg"
                  width="110"
                  alt="Airbook - aviation market place"
                />
              </a>
            ) : (
              <Link href="/">
                <a
                  aria-current="page"
                  className={
                    props.searchItem && props.searchItem.type == "home"
                      ? "ab-brand w-inline-block w--current"
                      : "ab-brand w-inline-block"
                  }
                >
                  <img
                    src="/static/images/Airbook_white.svg"
                    width="110"
                    alt="Airbook - aviation market place"
                  />
                </a>
              </Link>
            )}
            <div className="ab-search-block">
              <div id="ab_search_form" className="ab-form-block w-form">
                <form
                  id="ab_search_form"
                  action="/"
                  name="wf-form-search_form"
                  data-name="search_form"
                  className="ab-search-form"
                >
                  <select
                    defaultValue={searchOption}
                    onChange={(e) => setSearchOption(e.target.value)}
                    id="select-2"
                    name="select-2"
                    data-name="Select 2"
                    className="ab-select w-select"
                  >
                    {searchOptions.map((option, i) => (
                      <option key={i} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    onChange={(e) => setSearchStr(e.target.value)}
                    className="ab-search-field w-input"
                    autoFocus={false}
                    maxLength="256"
                    name="s-2"
                    data-name="S 2"
                    id="s-2"
                    required=""
                  />
                  <input
                    style={
                      props.isSearching
                        ? {
                            backgroundImage: `url(/static/images/spinner.svg)`,
                            backgroundSize: "unset",
                          }
                        : {}
                    }
                    type="submit"
                    value=""
                    onClick={(e) => doSearch(e)}
                    data-wait="Please wait..."
                    className="ab-search-button w-button"
                  />
                </form>
                <div className="success-message w-form-done"></div>
                <div className="error-message w-form-fail"></div>
              </div>
            </div>
          </div>
        </div>
        <div
          data-collapse="medium"
          data-animation="over-left"
          data-duration="400"
          data-easing="ease-in-out-cubic"
          data-easing2="ease-out"
          role="banner"
          className="ab-navbar w-nav"
        >
          <div className="ab-container w-container nav-wrapper">
            <div className="navbar-flex">
              {props.searchItem && props.searchItem.type === "home" ? (
                <a
                  aria-current="page"
                  className="ab-brand mobile-brand w-nav-brand w--current"
                >
                  <img
                    src="/static/images/Airbook_white.svg"
                    width="110"
                    alt="Airbook"
                  />
                </a>
              ) : (
                <Link href="/">
                  <a
                    aria-current="page"
                    className="ab-brand mobile-brand w-nav-brand w--current"
                  >
                    <img
                      src="/static/images/Airbook_white.svg"
                      width="110"
                      alt="Airbook"
                    />
                  </a>
                </Link>
              )}

              <nav role="navigation" className="ab-nav-menu w-nav-menu">
                {route.asPath == "/aircraft/p/1" ? (
                  <a className={current_class}>Aircraft</a>
                ) : (
                  <Link href="/aircraft/p/1" as={`/aircraft/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "aircraft"
                          ? current_class
                          : normal_class
                      }
                    >
                      Aircraft
                    </a>
                  </Link>
                )}
                {route.asPath == "/engine/p/1" ? (
                  <a className={current_class}>Engines</a>
                ) : (
                  <Link href="/engine/p/[list]" as={`/engine/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "engine"
                          ? current_class
                          : normal_class
                      }
                    >
                      Engines
                    </a>
                  </Link>
                )}
                {route.asPath == "/apu/p/1" ? (
                  <a className={current_class}>APU</a>
                ) : (
                  <Link href="/apu/p/[list]" as={`/apu/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "apu"
                          ? current_class
                          : normal_class
                      }
                    >
                      APU
                    </a>
                  </Link>
                )}
                {route.asPath == "/parts/p/1" ? (
                  <a className={current_class}>Parts</a>
                ) : (
                  <Link href="/parts/p/[list]" as={`/parts/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "part"
                          ? current_class
                          : normal_class
                      }
                    >
                      Parts
                    </a>
                  </Link>
                )}
                {route.asPath == "/wanted/p/1" ? (
                  <a className={current_class}>Wanted</a>
                ) : (
                  <Link href="/wanted/p/[list]" as={`/wanted/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "wanted"
                          ? current_class
                          : normal_class
                      }
                    >
                      Wanted
                    </a>
                  </Link>
                )}
                {/* {route.asPath =='/jobs/p/1' ?
                 <a className={ current_class}>Jobs</a>:
                <Link href="/jobs/p/[list]" as={`/jobs/p/${p}`}>
                  <a className={props.searchItem && props.searchItem.type ==='jobs' ? current_class : normal_class}>Jobs</a>
                </Link>} */}
                {route.asPath == "/contact/p/1" ? (
                  <a className={current_class}>Contacts</a>
                ) : (
                  <Link href="/contact/p/[list]" as={`/contact/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "contact"
                          ? current_class
                          : normal_class
                      }
                    >
                      Contacts
                    </a>
                  </Link>
                )}
                {route.asPath == "/company/p/1" ? (
                  <a className={current_class}>Companies</a>
                ) : (
                  <Link href="/company/p/[list]" as={`/company/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "company"
                          ? current_class
                          : normal_class
                      }
                    >
                      Companies
                    </a>
                  </Link>
                )}
                {route.asPath == "/airport/p/1" ? (
                  <a className={current_class}>Airports</a>
                ) : (
                  <Link href="/airport/p/[list]" as={`/airport/p/${p}`}>
                    <a
                      className={
                        props.searchItem && props.searchItem.type === "airport"
                          ? current_class
                          : normal_class
                      }
                    >
                      Airports
                    </a>
                  </Link>
                )}
                <Link href="/support">
                  <a className="nav-link support-nav-link w-nav-link">
                    support
                  </a>
                </Link>
              </nav>
              <div
                className="ab-menu-button"
                style={menuBtnStyle}
                data-ix="burger"
                onClick={() => triggerMenu()}
              >
                <div className="ab-burger-wrapper">
                  <div className="burger-up" style={menuStyle.burgerUp} />
                  <div className="burger-down" style={menuStyle.burgerDown} />
                </div>
              </div>
            </div>
          </div>
          <div
            style={menuStyle.menu}
            className="w-nav-overlay mobile-menu"
            data-wf-ignore=""
            id="w-nav-overlay-10"
          >
            <nav
              role="navigation"
              className="ab-nav-menu w-nav-menu"
              data-nav-menu-open=""
              style={{
                height: "2597px",
                transform: `translateX(-${defaultNavWidth}px)`,
                transition:
                  "transform 400ms cubic-bezier(0.645, 0.045, 0.355, 1) 0s",
              }}
            >
              {route.asPath == "/aircraft/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Aircraft
                </a>
              ) : (
                <Link href="/aircraft/p/[list]" as={`/aircraft/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "aircraft"
                        ? current_class
                        : normal_class
                    }
                  >
                    Aircraft
                  </a>
                </Link>
              )}
              {route.asPath == "/engine/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Engines
                </a>
              ) : (
                <Link href="/engine/p/[list]" as={`/engine/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "engine"
                        ? current_class
                        : normal_class
                    }
                  >
                    Engines
                  </a>
                </Link>
              )}
              {route.asPath == "/apu/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  APU
                </a>
              ) : (
                <Link href="/apu/p/[list]" as={`/apu/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "apu"
                        ? current_class
                        : normal_class
                    }
                  >
                    APU
                  </a>
                </Link>
              )}
              {route.asPath == "/parts/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Parts
                </a>
              ) : (
                <Link href="/parts/p/[list]" as={`/parts/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "part"
                        ? current_class
                        : normal_class
                    }
                  >
                    Parts
                  </a>
                </Link>
              )}
              {route.asPath == "/wanted/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Wanted
                </a>
              ) : (
                <Link href="/wanted/p/[list]" as={`/wanted/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "wanted"
                        ? current_class
                        : normal_class
                    }
                  >
                    Wanted
                  </a>
                </Link>
              )}
              {/* {route.asPath =='/jobs/p/1' ?
                 <a style={linkStyle} className={current_class}>Jobs</a>:
                <Link href="/jobs/p/[list]" as={`/wanted/p/${p}`}>
                  <a style={linkStyle} className={props.searchItem && props.searchItem.type ==='jobs' ? current_class : normal_class}>Jobs</a>
                </Link>} */}
              {route.asPath == "/contact/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Contacts
                </a>
              ) : (
                <Link href="/contact/p/[list]" as={`/contact/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "contact"
                        ? current_class
                        : normal_class
                    }
                  >
                    Contacts
                  </a>
                </Link>
              )}
              {route.asPath == "/company/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Companies
                </a>
              ) : (
                <Link href="/company/p/[list]" as={`/company/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "company"
                        ? current_class
                        : normal_class
                    }
                  >
                    Companies
                  </a>
                </Link>
              )}
              {route.asPath == "/airport/p/1" ? (
                <a style={linkStyle} className={current_class}>
                  Airports
                </a>
              ) : (
                <Link href="/airport/p/[list]" as={`/airport/p/${p}`}>
                  <a
                    style={linkStyle}
                    className={
                      props.searchItem && props.searchItem.type === "airport"
                        ? current_class
                        : normal_class
                    }
                  >
                    Airports
                  </a>
                </Link>
              )}
              <Link href="/support">
                <a
                  style={linkStyle}
                  className="nav-link support-nav-link w-nav-link"
                >
                  support
                </a>
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

const mapStateToProps = state => ({
  searchItem: state.searchItem,
  user: state.user,
  isSearching:state.isSearching
});

export default connect(mapStateToProps, site.actions)(Header);