import React from "react";
import SearchDropdown from "../../../app/partials/layout/SearchDropdown";
import UserNotifications from "../../../app/partials/layout/UserNotifications";
import QuickPanelToggler from "./QuickPanelToggle";
import LanguageSelector from "../../../app/partials/layout/LanguageSelector";
import UserProfile from "../../../app/partials/layout/UserProfile";
import { toAbsoluteUrl } from "../../utils/utils";

export default class Topbar extends React.Component {
  render() {
    return (
      <div className="kt-header__topbar">
        {/*<SearchDropdown useSVG="true" />
        
        <UserNotifications
          bgImage={toAbsoluteUrl("/media/misc/bg-1.jpg")}
          pulse="true"
          pulseLight="false"
          skin="dark"
          iconType=""
          type="success"
          useSVG="true"
          dot="false"
        />

          <QuickPanelToggler /> 


          <LanguageSelector iconType="" />*/}

        <UserProfile showAvatar={true} showHi={true} showBadge={false} />
      </div>
    );
  }
}
