/* eslint-disable no-script-url,jsx-a11y/anchor-is-valid */
import React from "react";
import { Link } from "react-router-dom";
import Dropdown from "react-bootstrap/Dropdown";
import {USER_URL, MEDIA_URL} from "../../crud/api"
import { connect } from "react-redux";
import { toAbsoluteUrl } from "../../../_metronic";
import {HeaderDropdownToggle} from "../content/CustomDropdowns/HeaderDropdownToggle";

class UserProfile extends React.Component {
  render() {
    const { user, showHi, showAvatar, showBadge } = this.props;

    return (
      <Dropdown className="kt-header__topbar-item kt-header__topbar-item--user" drop="down" alignRight>
        <Dropdown.Toggle as={HeaderDropdownToggle}
          id="dropdown-toggle-user-profile"
        >

          <div className="kt-header__topbar-user">
            {showHi && (
              <span className="kt-header__topbar-welcome kt-hidden-mobile">
                Hi,
              </span>
            )}

            {showHi && (
              <span className="kt-header__topbar-username kt-hidden-mobile">
                {user.contact ? user.contact.first_name : 'User'}
              </span>
            )}

            {<img id="profile-image" alt="Pic" src={user.media != null  ? MEDIA_URL+user.media.original_file_name: `${toAbsoluteUrl("/media/users/default.jpg")}`} />}

          </div>
        </Dropdown.Toggle>
        <Dropdown.Menu className="dropdown-menu-fit dropdown-menu-right dropdown-menu-anim dropdown-menu-top-unround dropdown-menu-xl">
          {/** ClassName should be 'dropdown-menu dropdown-menu-fit dropdown-menu-right dropdown-menu-anim dropdown-menu-top-unround dropdown-menu-xl' */}
          <div
            className="kt-user-card kt-user-card--skin-dark kt-notification-item-padding-x d-block"
            style={{
              backgroundImage: `url(${toAbsoluteUrl("/media/misc/bg-1.jpg")})`
            }}
          >
            {user.media &&
            <div className="kt-user-card__avatar">
              <img alt="Pic" className="kt-hidden" src={user.pic} />
              {user.contact && user.contact.first_name ?
                  <span className="kt-badge kt-badge--lg kt-badge--rounded kt-badge--bold kt-font-success">
                  {user.contact && user.contact.first_name.charAt(0)}
              </span> : ''
              }
            </div>
            }
            <div className="kt-user-card__name">
              {user.contact && user.contact.first_name ? user.contact.first_name+' ' : ''}
              {user.contact && user.contact.last_name ? user.contact.last_name : ''}
            </div>
            <div className="kt-user-card__details">
              {user.contact && user.contact.job_title ? user.contact.job_title.name : ''}
              <br />
              {user.contact && user.contact.company ? user.contact.company.name : ''}
            </div>
            {/*<div className="kt-user-card__badge">
              <span className="btn btn-success btn-sm btn-bold btn-font-md">
                23 messages
             </span>
            </div>*/}
          </div>
          <div className="kt-notification">
            <div className="kt-notification__item">
              <div className="kt-notification__item-icon">
                <i className="flaticon2-calendar-3 kt-font-success" />
              </div>
              <div className="kt-notification__item-details"
              onClick={() => document.getElementById('profile-image').click()}>
                <Link style={{color: 'inherit'}} to={"/user/account-setting"}>
                <div className="kt-notification__item-title kt-font-bold">
                  My Profile
                </div>
                    <div className="kt-notification__item-time">
                      Account settings and more
                    </div>
                  </Link>
              </div>
            </div>
            {/*<a className="kt-notification__item">
              <div className="kt-notification__item-icon">
                <i className="flaticon2-mail kt-font-warning" />
              </div>
              <div className="kt-notification__item-details">
                <div className="kt-notification__item-title kt-font-bold">
                  My Messages
                </div>
                <div className="kt-notification__item-time">
                  Inbox and tasks
                </div>
              </div>
            </a>
            <a className="kt-notification__item">
              <div className="kt-notification__item-icon">
                <i className="flaticon2-rocket-1 kt-font-danger" />
              </div>
              <div className="kt-notification__item-details">
                <div className="kt-notification__item-title kt-font-bold">
                  My Activities
                </div>
                <div className="kt-notification__item-time">
                  Logs and notifications
                </div>
              </div>
            </a>
            <a className="kt-notification__item">
              <div className="kt-notification__item-icon">
                <i className="flaticon2-hourglass kt-font-brand" />
              </div>
              <div className="kt-notification__item-details">
                <div className="kt-notification__item-title kt-font-bold">
                  My Tasks
                </div>
                <div className="kt-notification__item-time">
                  latest tasks and projects
                </div>
              </div>
            </a>*/}
            <div className="kt-notification__custom">
              <Link
                to={"/"+USER_URL+"/logout"}
                className="btn btn-label-brand btn-sm btn-bold"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}

const mapStateToProps = ({ auth: { user } }) => ({
  user
});

export default connect(mapStateToProps)(UserProfile);
