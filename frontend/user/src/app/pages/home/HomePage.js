import React, { Suspense, lazy } from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import Builder from "./Builder";
import Dashboard from "./Dashboard";
import DocsPage from "./docs/DocsPage";
import { LayoutSplashScreen } from "../../../_metronic";
import {USER_URL} from "../../crud/api";

import AircraftAssetsCreate from "../assets/aircraft/Create";
import AircraftAssetsDetail from "../assets/aircraft/Detail";
import AircraftAssetsEdit from "../assets/aircraft/Edit";
import AircraftAssetsList from "../assets/aircraft/List";

import ApuAssetsList from "../assets/apu/List";
import ApuAssetsEdit from "../assets/apu/Edit";
import ApuAssetsCreate from "../assets/apu/Create";
import ApuAssetsDetail from "../assets/apu/Detail";

import ContactsList from "../../pages/contacts/List";
import ContactsCreate from "../../pages/contacts/Create";
import ContactsEdit from "../../pages/contacts/Edit";
import ContactsView from "../../pages/contacts/Detail";

import ConnectionList from "../connection/List";
import FavouriteList from "../favourite/List";

import CompanyEdit from "../../pages/company/Edit";

import EngineAssetsList from "../assets/engine/List";
import EngineAssetsEdit from "../assets/engine/Edit";
import EngineAssetsCreate from "../assets/engine/Create";
import EngineAssetsDetail from "../assets/engine/Detail";

import LeadList from "../lead/List";
import LeadDetail from "../../pages/lead/Detail";

import PartAssetsList from "../assets/parts/List";
import PartAssetsEdit from "../assets/parts/Edit";
import PartAssetsCreate from "../assets/parts/Create";
import PartAssetsDetail from "../assets/parts/Detail";

import WantedAssetsCreate from "../assets/wanted/Create";
import WantedAssetsDetail from "../assets/wanted/Detail";
import WantedAssetsEdit from "../assets/wanted/Edit";
import WantedAssetsList from "../assets/wanted/List";

import InvoiceList from "../invoice/List";
import InvoiceDetail from "../invoice/Detail";
import * as routerHelpers from "../../router/RouterHelpers";
import AccountSettings from "../security/Account";
import UserUpdatePassword from "../security/UserUpdatePassword";
import Cart from '../cart/cart'

const GoogleMaterialPage = lazy(() =>
  import("./google-material/GoogleMaterialPage")
);
const ReactBootstrapPage = lazy(() =>
  import("./react-bootstrap/ReactBootstrapPage")
);

export default function HomePage(props) {
  let extra_data = props.extra_data;
  extra_data.user = props.user;
  props.setExtraData(extra_data);

  return (
    <Suspense fallback={<LayoutSplashScreen />}>
      <Switch>
        {
          /* Redirect from root URL to /dashboard. */
          <Redirect exact from="/" to={"/"+USER_URL+"/dashboard"} />
        }
        <Route path="/builder" component={Builder} />
        <Route path={"/"+USER_URL+"/dashboard"} component={Dashboard} />
        <Route path="/google-material" component={GoogleMaterialPage} />
        <Route path="/react-bootstrap" component={ReactBootstrapPage} />
        <Route path="/docs" component={DocsPage} />

        <Route exact
          path={"/"+USER_URL+"/aircraft/asset"}
          render={(routeProps) => <AircraftAssetsList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route
          path={"/"+USER_URL+"/aircraft/asset/create"}
          render={(routeProps) => <AircraftAssetsCreate {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route
          path={"/"+USER_URL+"/aircraft/asset/:aircraft_id/edit"}
          render={(routeProps) => <AircraftAssetsEdit {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/aircraft/asset/:aircraft_id"} component={AircraftAssetsDetail} />

        <Route exact
          path={"/"+USER_URL+"/apu/asset"}
          render={(routeProps) => <ApuAssetsList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route
          path={"/"+USER_URL+"/apu/asset/create"}
          render={(routeProps) => <ApuAssetsCreate {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route path={"/"+USER_URL+"/apu/asset/:apu_id/edit"}
          render={(routeProps) => <ApuAssetsEdit {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/apu/asset/:apu_id"} component={ApuAssetsDetail} />

        <Route exact path={"/"+USER_URL+"/contacts"} component={ContactsList} />
        <Route path={"/"+USER_URL+"/contacts/create"} component={ContactsCreate} />
        <Route path={"/"+USER_URL+"/contacts/:contact_id/edit"} component={ContactsEdit} />
        <Route path={"/"+USER_URL+"/contacts/:contact_id"} component={ContactsView} />

         <Route
          path={"/"+USER_URL+"/connection"}
          render={(routeProps) => <ConnectionList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route
          path={"/"+USER_URL+"/favourite"}
          render={(routeProps) => <FavouriteList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route path={"/"+USER_URL+"/company/edit"} render={(routeProps) => <CompanyEdit {...routeProps} userProp={props.user} />} />

        <Route exact
          path={"/"+USER_URL+"/engine/asset"}
          render={(routeProps) => <EngineAssetsList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route
          path={"/"+USER_URL+"/engine/asset/create"}
          render={(routeProps) => <EngineAssetsCreate {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />

        <Route path={"/"+USER_URL+"/engine/asset/:engine_id/edit"}
        render={(routeProps) => <EngineAssetsEdit {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/engine/asset/:engine_id"} component={EngineAssetsDetail} />

        <Route exact
          path={"/"+USER_URL+"/part/asset"}
          render={(routeProps) => <PartAssetsList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/part/asset/create"}
          render={(routeProps) => <PartAssetsCreate {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/part/asset/:part_id/edit"}
          render={(routeProps) => <PartAssetsEdit {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/part/asset/:part_id"} component={PartAssetsDetail} />

        {/*Leads Routes*/}
        {/*<Route exact path={"/"+USER_URL+"/lead"} component={LeadList} />*/}
        <Route
          path={"/"+USER_URL+"/lead"}
          render={(routeProps) => <LeadList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route exact path={"/"+USER_URL+"/leads/:lead_id"} component={LeadDetail} />

        <Route exact
          path={"/"+USER_URL+"/wanted/asset"}
          render={(routeProps) => <WantedAssetsList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/wanted/asset/create"}
          render={(routeProps) => <WantedAssetsCreate {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/wanted/asset/:wanted_id/edit"}
               render={(routeProps) => <WantedAssetsEdit {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/wanted/asset/:wanted_id"} component={WantedAssetsDetail} />

        <Route exact
          path={"/"+USER_URL+"/invoices"}
          render={(routeProps) => <InvoiceList {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} user={props.user} />}
        />
        <Route path={"/"+USER_URL+"/invoices/:invoice_id"}
               render={(routeProps) => <InvoiceDetail {...routeProps} setExtraData={props.setExtraData} extra_data={props.extra_data} />}
        />
        <Route path={"/"+USER_URL+"/cart"}
               render={(routeProps) => <Cart />}
        />
          <Route exact path={"/"+USER_URL+"/account-setting"} render={(routeProps) => <AccountSettings {...routeProps} userProp={props.user} />} />
          <Route path={"/"+USER_URL+"/contacts/:contact_id/edit"} component={ContactsEdit} />
          <Route exact path={"/"+USER_URL+"/update-account-password"} render={(routeProps) => <UserUpdatePassword {...routeProps} userProp={props.user} />} />
        <Redirect to="/error/404" />
      </Switch>
    </Suspense>
  );
}
