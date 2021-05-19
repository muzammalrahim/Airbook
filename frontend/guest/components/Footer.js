import { renderMenus } from "../helpers/functions";
import { isAuthenticated } from '../helpers/frontend'
import Link from "next/link";
const Footer = (props) => {
 
  const [isAuthenticate, setAuthenticate] = React.useState(false);
  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("persist:demo3-auth"))?.user
    {user !== undefined ? setAuthenticate(true) : setAuthenticate(false);
    }
  });
  let p = 1;
  return (
    <div className="ab-footer">
      <a
        href="#"
        className="back-to-top w-inline-block"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
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
              d="M0 16.67l2.829 2.83 9.175-9.339 9.167 9.339 2.829-2.83-11.996-12.17z"
            />
          </svg>
        </div>
      </a>
      <div className="ab-container w-container">
        <div className="footer-flex">
          <div className="footer-top-content">
            <div className="footer-brand-block">
              <div className="footer-logo w-embed">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={120}
                  height={22}
                  viewBox="0 0 120 22"
                >
                  <title>Artboard 1</title>
                  <g>
                    <path
                      d="M18,21.34l-4-.51a15.75,15.75,0,0,1-5,.74c-4,0-7.94-1.25-8.58-3.68A15.54,15.54,0,0,1,0,14a16.19,16.19,0,0,1,.44-3.92C1,7.62,5,6.37,9,6.37s8,1.25,8.62,3.78A14.61,14.61,0,0,1,18,13.7Zm-4-7.4a17.48,17.48,0,0,0-.24-3.07c-.37-2-2.57-3-4.83-3s-4.46,1-4.8,3A18.68,18.68,0,0,0,4,14a18.69,18.69,0,0,0,.24,3.18c.34,2,2.6,3,4.83,3a10.64,10.64,0,0,0,5-1.08Z"
                      fill="currentcolor"
                    />
                    <path
                      d="M25.41,3.6C25.1,5,21.18,5,20.84,3.67a5.46,5.46,0,0,1,0-2.09c.34-1.32,4.22-1.32,4.56,0A4,4,0,0,1,25.41,3.6ZM21.15,21.34V6.78l4,.54v14Z"
                      fill="currentcolor"
                    />
                    <path
                      d="M32.26,21.34h-4V6.78L32,7.25a15.26,15.26,0,0,1,5.27-.88c.51,0,1,0,1.52.07V7.86c-.47,0-.95-.07-1.42-.07-2.23,0-4.49,1-4.83,3a21.46,21.46,0,0,0-.24,3.07v7.43Z"
                      fill="currentcolor"
                    />
                    <path
                      d="M41.55.29l4,.51V7.22a16.12,16.12,0,0,1,5.07-.74c4,0,7.94,1.25,8.55,3.68A15.74,15.74,0,0,1,59.56,14,16,16,0,0,1,59.12,18c-.64,2.5-4.59,3.75-8.55,3.75S42.63,20.43,42,17.89a13.62,13.62,0,0,1-.44-3.82Zm4,13.78a17.88,17.88,0,0,0,.24,3.11c.37,2.06,2.57,3.07,4.83,3.07s4.43-1,4.8-3A18.68,18.68,0,0,0,55.61,14a18.55,18.55,0,0,0-.24-3.14c-.34-2-2.57-3-4.8-3A11.11,11.11,0,0,0,45.51,9Z"
                      fill="currentcolor"
                    />
                    <path
                      d="M79.86,17.76c-1.25,5.17-15.91,5-17.16.14a17.89,17.89,0,0,1,0-7.8c1.25-5,15.91-5,17.16.07A17.49,17.49,0,0,1,79.86,17.76ZM66.45,10.83a22.24,22.24,0,0,0,0,6.35c.71,3.92,9,4.05,9.66-.14a20,20,0,0,0,0-6.18C75.37,6.78,67.16,6.81,66.45,10.83Z"
                      fill="currentcolor"
                    />
                    <path
                      d="M100.78,17.76c-1.25,5.17-15.91,5-17.16.14a17.89,17.89,0,0,1,0-7.8c1.25-5,15.91-5,17.16.07A17.49,17.49,0,0,1,100.78,17.76ZM87.36,10.83a22.24,22.24,0,0,0,0,6.35c.71,3.92,9,4.05,9.66-.14a20,20,0,0,0,0-6.18C96.28,6.78,88.07,6.81,87.36,10.83Z"
                      fill="currentcolor"
                    />
                    <path
                      d="M108.38.8V15.32l6,6H120l-7.8-7.8,6.42-6.45h-2l-8.24,8.24v6h-4V.29Z"
                      fill="currentcolor"
                    />
                  </g>
                </svg>
              </div>
              <div className="xbs-info">A project of XBS</div>
              {isAuthenticate === false ?
              <div className="footer-button-block">
                <a href="/login" className="fbutton access-acc w-button">
                  Access my account
                </a>
                <a href="/register" className="fbutton register w-button">
                  Register now (free forever)
                </a>
              </div>: ""}
              <div className="footer-social">
                <div className="w-layout-grid grid">
                  <a href="https://www.linkedin.com/company/airbook" target="_blank" className="fsocialnav w-inline-block">
                    <div className="w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={32}
                        height={32}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M0 0v24h24v-24h-24zm8 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.397-2.586 7-2.777 7 2.476v6.759z"
                        />
                      </svg>
                    </div>
                  </a>
                  <a href="https://web.facebook.com/airbook.aero" target="_blank" className="fsocialnav w-inline-block">
                    <div className="html-embed w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={32}
                        height={32}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M0 0v24h24v-24h-24zm16 7h-1.923c-.616 0-1.077.252-1.077.889v1.111h3l-.239 3h-2.761v8h-3v-8h-2v-3h2v-1.923c0-2.022 1.064-3.077 3.461-3.077h2.539v3z"
                        />
                      </svg>
                    </div>
                  </a>
                  <a href="https://twitter.com/airbookaero" target="_blank" className="fsocialnav w-inline-block">
                    <div className="w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={32}
                        height={32}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M0 0v24h24v-24h-24zm18.862 9.237c.208 4.617-3.235 9.765-9.33 9.765-1.854 0-3.579-.543-5.032-1.475 1.742.205 3.48-.278 4.86-1.359-1.437-.027-2.649-.976-3.066-2.28.515.098 1.021.069 1.482-.056-1.579-.317-2.668-1.739-2.633-3.26.442.246.949.394 1.486.411-1.461-.977-1.875-2.907-1.016-4.383 1.619 1.986 4.038 3.293 6.766 3.43-.479-2.053 1.079-4.03 3.198-4.03.944 0 1.797.398 2.396 1.037.748-.147 1.451-.42 2.085-.796-.245.767-.766 1.41-1.443 1.816.664-.08 1.297-.256 1.885-.517-.44.656-.997 1.234-1.638 1.697z"
                        />
                      </svg>
                    </div>
                  </a>
                  <a href="https://www.youtube.com/channel/UCCg_n48SbSsmp5H3cR5j_vg" target="_blank" className="fsocialnav w-inline-block">
                    <div className="w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={32}
                        height={32}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M10 9.333l5.333 2.662-5.333 2.672v-5.334zm14-9.333v24h-24v-24h24zm-4 12c-.02-4.123-.323-5.7-2.923-5.877-2.403-.164-7.754-.163-10.153 0-2.598.177-2.904 1.747-2.924 5.877.02 4.123.323 5.7 2.923 5.877 2.399.163 7.75.164 10.153 0 2.598-.177 2.904-1.747 2.924-5.877z"
                        />
                      </svg>
                    </div>
                  </a>
                  <a href="https://www.instagram.com/airbook.aero/" target="_blank" className="fsocialnav w-inline-block">
                    <div className="w-embed">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={32}
                        height={32}
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="currentColor"
                          d="M18 6.615v1.45c0 .34-.275.616-.616.616h-1.449c-.341 0-.615-.276-.615-.616v-1.45c0-.34.274-.615.615-.615h1.449c.341 0 .616.275.616.615zm-1.131 4.699c.033.225.054.453.054.686 0 2.72-2.204 4.923-4.922 4.923s-4.923-2.204-4.923-4.923c0-.233.021-.461.054-.686.031-.221.075-.437.134-.647h-1.266v6.719c0 .339.275.614.616.614h10.769c.34 0 .615-.275.615-.615v-6.719h-1.265c.058.211.102.427.134.648zm-4.869 3.763c1.699 0 3.078-1.378 3.078-3.077s-1.379-3.077-3.078-3.077-3.077 1.377-3.077 3.077 1.378 3.077 3.077 3.077zm12-15.077v24h-24v-24h24zm-4 5.846c0-1.019-.826-1.846-1.846-1.846h-12.308c-1.019 0-1.846.827-1.846 1.846v12.307c0 1.02.827 1.847 1.846 1.847h12.309c1.019 0 1.845-.827 1.845-1.847v-12.307z"
                        />
                      </svg>
                    </div>
                  </a>
                </div>
              </div>
            </div>
            <div className="footer-nav-block">
              <div className="footer-nav">
                <div className="w-layout-grid footer-nav-grid">
                  <div
                    id="w-node-cfe3fc071af5-5a79b764"
                    className="footer-nav-col"
                  >
                    <h3 className="footer-nav-headline">Aviation Listings</h3>
                    <Link href="/aircraft/p/[list]" as={`/aircraft/p/${p}`}>
                      <a className="footer-nav-link"> Aircraft Listings</a>
                    </Link>
                    <Link href="/engine/p/[list]" as={`/engine/p/${p}`}>
                      <a className="footer-nav-link">Engine Listings</a>
                    </Link>
                    <Link href="/apu/p/[list]" as={`/apu/p/${p}`}>
                      <a className="footer-nav-link"> APU Listings</a>
                    </Link>
                    <Link href="/parts/p/[list]" as={`/parts/p/${p}`}>
                      <a className="footer-nav-link"> Aircraft Parts</a>
                    </Link>
                    <Link href="/wanted/p/[list]" as={`/wanted/p/${p}`}>
                      <a className="footer-nav-link">Aviation Wanted</a>
                    </Link>
                    <Link href="/user/dashboard">
                      <a className="footer-nav-link"> Submit Assets</a>
                    </Link>
                  </div>
                  <div
                    id="w-node-2af76cb5bbd1-5a79b764"
                    className="footer-nav-col"
                  >
                    <h3 className="footer-nav-headline">Information</h3>
                    <Link href="/jobs/p/[list]" as={`/jobs/p/${p}`}>
                      <a className="footer-nav-link">Aviation Jobs</a>
                    </Link>
                    <Link href="/jobs/p/[list]" as={`/jobs/p/${p}`}>
                      <a className="footer-nav-link"> Submit Job</a>
                    </Link>
                    <Link href="/contact/p/[list]" as={`/contact/p/${p}`}>
                      <a className="footer-nav-link"> Aviation Professionals</a>
                    </Link>
                    <Link href="/company/p/[list]" as={`/company/p/${p}`}>
                      <a className="footer-nav-link"> Aviation Companies</a>
                    </Link>
                    <Link href="/airport/p/[list]" as={`/airport/p/${p}`}>
                      <a className="footer-nav-link"> Global Airports</a>
                    </Link>
                  </div>
                  <div
                    id="w-node-afb96ffb9c7b-5a79b764"
                    className="footer-nav-col"
                  >
                    <h3 className="footer-nav-headline">Help &amp; Support</h3>
                    <Link href="/support/" as={`/support/`}>
                      <a className="footer-nav-link">
                        Report an Issue
                      </a>
                    </Link>
                    <Link href="/support/" as={`/support/`}>
                      <a className="footer-nav-link">
                        Send us an Email
                      </a>
                    </Link>
                    <Link href="/support/" as={`/support/`}>
                      <a className="footer-nav-link">
                        Advertise on Airbook
                      </a>
                    </Link>
                  </div>
                  <div
                    id="w-node-5a946598497e-5a79b764"
                    className="footer-nav-col"
                  >
                    <h3 className="footer-nav-headline">About Airbook</h3>
                    <Link href="/about/" as={`/about/`}>
                      <a className="footer-nav-link"> Who we are</a>
                    </Link>
                    <Link href="/support/" as={`/support/`}>
                      <a className="footer-nav-link"> Contact us</a>
                    </Link>
                    <Link href="/terms/" as={`/terms/`}>
                      <a className="footer-nav-link"> Terms of use</a>
                    </Link>
                    <Link href="/privacy/" as={`/privacy/`}>
                      <a className="footer-nav-link"> Privacy Policy</a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-end">
            <div className="ab-container w-container">
              <div className="footer-copyright-info">
                © 2017-2021, Airbook. All Rights Reserved
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
