import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import {
  Portlet,
  PortletBody,
  PortletHeader,
  PortletHeaderToolbar
} from "../../partials/content/Portlet";
import { metronic } from "../../../_metronic";
import QuickStatsChart from "../../widgets/QuickStatsChart";
import OrderStatisticsChart from "../../widgets/OrderStatisticsChart";
import OrdersWidget from "../../widgets/OrdersWidget";
import SalesBarChart from "../../widgets/SalesBarChart";
import DownloadFiles from "../../widgets/DownloadFiles";
import NewUsers from "../../widgets/NewUsers";
import LatestUpdates from "../../widgets/LatestUpdates";
import BestSellers from "../../widgets/BestSellers";
import RecentActivities from "../../widgets/RecentActivities";
import PortletHeaderDropdown from "../../partials/content/CustomDropdowns/PortletHeaderDropdown";
import {Button, Table} from "react-bootstrap";
import {list, USER_URL} from "../../crud/api";
import {Chip} from "@material-ui/core";
import {Link} from "react-router-dom";
import MyLeadsChart from "../../charts/MyLeads";

export default function Dashboard() {
    const [rows, setRowsData] = React.useState([]);
    const [aircrafts, setAircrafts] = React.useState([]);
    const [engines, setEngines] = React.useState([]);
    const [apus, setApus] = React.useState([]);
    const [wanteds, setWanteds] = React.useState([]);
    const [count, setCount] = React.useState(0); // set counter for onload functions
  const { brandColor, dangerColor, successColor, primaryColor } = useSelector(
    state => ({
      brandColor: metronic.builder.selectors.getConfig(
        state,
        "colors.state.brand"
      ),
      dangerColor: metronic.builder.selectors.getConfig(
        state,
        "colors.state.danger"
      ),
      successColor: metronic.builder.selectors.getConfig(
        state,
        "colors.state.success"
      ),
      primaryColor: metronic.builder.selectors.getConfig(
        state,
        "colors.state.primary"
      )
    })
  );

  const chartOptions = useMemo(
    () => ({
      chart1: {
        data: [10, 14, 18, 11, 9, 12, 14, 17, 18, 14],
        color: brandColor,
        border: 3
      },

      chart2: {
        data: [11, 12, 18, 13, 11, 12, 15, 13, 19, 15],
        color: dangerColor,
        border: 3
      },

      chart3: {
        data: [12, 12, 18, 11, 15, 12, 13, 16, 11, 18],
        color: successColor,
        border: 3
      },

      chart4: {
        data: [11, 9, 13, 18, 13, 15, 14, 13, 18, 15],
        color: primaryColor,
        border: 3
      }
    }),
    [brandColor, dangerColor, primaryColor, successColor]
  );

  onInitialLoad();
  function onInitialLoad() {
    if(count === 0) {
      getDashboardData();
      getRecentAircraftsData();
      getRecentEnginesData();
      getRecentApusData();
      getRecentWantedData();
      setCount(count+1);
    }
  }

  function getDashboardData() {
    let filter = {};
     list('user_dashboard', filter).then(function (response) {
      setRowsData(response.data);
    });
  }

  function getRecentAircraftsData() {
    let filter = {layout: 'dashboard' };
     list('aircrafts', filter).then(function (response) {
      setAircrafts(response.data);
    });
  }

  function getRecentEnginesData() {
    let filter = {layout: 'dashboard' };
     list('engines', filter).then(function (response) {
      setEngines(response.data);
    });
  }

  function getRecentApusData() {
    let filter = {layout: 'dashboard' };
     list('apus', filter).then(function (response) {
      setApus(response.data);
    });
  }

  function getRecentWantedData() {
    let filter = {layout: 'dashboard' };
     list('wanteds', filter).then(function (response) {
      setWanteds(response.data);
    });
  }

  return (
    <>
      <div className="row">
        <div className="col-xl-6">
          <div className="row row-full-height">
            <div className="col-sm-12 col-md-12 col-lg-6">
              <Portlet className="kt-portlet--height-fluid-half kt-portlet--border-bottom-brand">
                <PortletHeader
                  title="Aircraft"
                  toolbar={
                    <PortletHeaderToolbar>
                    </PortletHeaderToolbar>
                  }
                />
                <PortletBody fluid={true}>
                  <div className="kt-widget26" style={{flexDirection:'row'}}>
                    <div className="kt-widget26__content" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.aircraftActive}</span>
                      <span className="kt-widget26__desc">Active</span>
                    </div>
                    <div className="kt-widget26__content text-right" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.aircraftInactive}</span>
                      <span className="kt-widget26__desc">Inactive</span>
                    </div>
                  </div>
                </PortletBody>
              </Portlet>

              <div className="kt-space-20" />

              <Portlet className="kt-portlet--height-fluid-half kt-portlet--border-bottom-brand">
                <PortletHeader
                  title="Engine"
                  toolbar={
                    <PortletHeaderToolbar>
                    </PortletHeaderToolbar>
                  }
                />
                <PortletBody fluid={true}>
                  <div className="kt-widget26" style={{flexDirection:'row'}}>
                    <div className="kt-widget26__content" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.engineActive}</span>
                      <span className="kt-widget26__desc">Active</span>
                    </div>
                    <div className="kt-widget26__content text-right" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.engineInactive}</span>
                      <span className="kt-widget26__desc">Inactive</span>
                    </div>
                  </div>
                </PortletBody>
              </Portlet>
            </div>

            <div className="col-sm-12 col-md-12 col-lg-6">
              <Portlet className="kt-portlet--height-fluid-half kt-portlet--border-bottom-brand">
                <PortletHeader
                  title="Apu"
                  toolbar={
                    <PortletHeaderToolbar>
                    </PortletHeaderToolbar>
                  }
                />
                <PortletBody fluid={true}>
                  <div className="kt-widget26" style={{flexDirection:'row'}}>
                    <div className="kt-widget26__content" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.apuActive}</span>
                      <span className="kt-widget26__desc">Active</span>
                    </div>
                    <div className="kt-widget26__content text-right" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.apuInactive}</span>
                      <span className="kt-widget26__desc">Inactive</span>
                    </div>
                  </div>
                </PortletBody>
              </Portlet>

              <div className="kt-space-20" />

              <Portlet className="kt-portlet--height-fluid-half kt-portlet--border-bottom-brand">
                <PortletHeader
                  title="Wanted"
                  toolbar={
                    <PortletHeaderToolbar>
                    </PortletHeaderToolbar>
                  }
                />
                <PortletBody fluid={true}>
                  <div className="kt-widget26" style={{flexDirection:'row'}}>
                    <div className="kt-widget26__content" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.wantedActive}</span>
                      <span className="kt-widget26__desc">Active</span>
                    </div>
                    <div className="kt-widget26__content text-right" style={{width:'50%'}}>
                      <span className="kt-widget26__number">{rows.wantedInactive}</span>
                      <span className="kt-widget26__desc">Inactive</span>
                    </div>
                  </div>
                </PortletBody>
              </Portlet>
            </div>
          </div>
        </div>

        <div className="col-xl-6">
          <Portlet fluidHeight={true}>
            <PortletHeader
              title="Leads"
              toolbar={
                <PortletHeaderToolbar>
                </PortletHeaderToolbar>
              }
            />

            <PortletBody>
              <MyLeadsChart data={rows['chartData']} />
            </PortletBody>
          </Portlet>
        </div>
      </div>

        <div className="row">
            <div className="col-xl-6">
                <Portlet fluidHeight={true}>
                    <PortletHeader
                      title="Recent Aircraft"
                      toolbar={
                        <PortletHeaderToolbar>
                            <Button href={"/"+USER_URL+"/aircraft/asset"} variant="outline-primary">Go to Aircraft</Button>
                        </PortletHeaderToolbar>
                      }
                    />
                    <PortletBody>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>MSN</th>
                              <th>Status</th>
                              <th>Views</th>
                            </tr>
                          </thead>
                          <tbody>
                          {aircrafts.map((val, i) => {
                              val.title = val.title.replace(/-/g,' ');
                              const name = val.title;
                              const aircraft_slug = val.id+'-'+name.replace(/\s+/g, '-').toLowerCase()
                              return (
                                  <tr>
                                      <td><a target="_blank" href={"/aircraft/" + aircraft_slug + "/"}>{val.title ? val.title.split("YOM")[0] : ' -- '}</a></td>
                                      <td>{val.msn ? val.msn : ' -- '}</td>
                                      <td>{val.isactivestatus ? val.isactivestatus : ' -- '}</td>
                                      <td>{val.views}</td>
                                  </tr>
                              );
                            })
                          }
                          </tbody>
                        </Table>
                    </PortletBody>
                </Portlet>
            </div>
            <div className="col-xl-6">
                <Portlet fluidHeight={true}>
                    <PortletHeader
                      title="Recent Engines"
                      toolbar={
                        <PortletHeaderToolbar>
                            <Button href={"/"+USER_URL+"/engine/asset"} variant="outline-primary">Go to Engines</Button>
                        </PortletHeaderToolbar>
                      }
                    />
                    <PortletBody>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>ESN</th>
                              <th>Status</th>
                              <th>Views</th>
                            </tr>
                          </thead>
                          <tbody>
                          {engines.map((val, i) => {
                              val.title = val.title.replace(/-/g,' ');
                              const name = val.title;
                              const engine_slug = val.id+'-'+name.replace(/\s+/g, '-').toLowerCase()
                              return (
                                  <tr>
                                      <td><a target="_blank" href={"/engine/" + engine_slug + "/"}>{val.title ? val.title : ' -- '}</a></td>
                                      <td>{val.esn ? val.esn : ' -- '}</td>
                                      <td>{val.isactivestatus ? val.isactivestatus : ' -- '}</td>
                                      <td>{val.views}</td>
                                  </tr>
                              );
                            })
                          }
                          </tbody>
                        </Table>
                    </PortletBody>
                </Portlet>
            </div>
        </div>

        <div className="row">
            <div className="col-xl-6">
                <Portlet fluidHeight={true}>
                    <PortletHeader
                      title="Recent APU's"
                      toolbar={
                        <PortletHeaderToolbar>
                            <Button href={"/"+USER_URL+"/apu/asset"} variant="outline-primary">Go to APU's</Button>
                        </PortletHeaderToolbar>
                      }
                    />
                    <PortletBody>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>ESN</th>
                              <th>Status</th>
                              <th>Views</th>
                            </tr>
                          </thead>
                          <tbody>
                          {apus.map((val, i) => {
                              val.title = val.title.replace(/-/g,' ');
                              const name = val.title;
                              const apu_slug = val.id+'-'+name.replace(/\s+/g, '-').toLowerCase()

                              return (
                                  <tr>
                                      <td><a target="_blank" href={"/apu/" + apu_slug + "/"}>{val.title ? val.title : ' -- '}</a></td>
                                      <td>{val.esn ? val.esn : ' -- '}</td>
                                      <td>{val.isactivestatus ? val.isactivestatus : ' -- '}</td>
                                      <td>{val.views}</td>
                                  </tr>
                              );
                            })
                          }
                          </tbody>
                        </Table>
                    </PortletBody>
                </Portlet>
            </div>
            <div className="col-xl-6">
                <Portlet fluidHeight={true}>
                    <PortletHeader
                      title="Recent Wanted"
                      toolbar={
                        <PortletHeaderToolbar>
                            <Button href={"/"+USER_URL+"/wanted/asset"} variant="outline-primary">Go to Wanted</Button>
                        </PortletHeaderToolbar>
                      }
                    />
                    <PortletBody>
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Title</th>
                              <th>Status</th>
                              <th>Views</th>
                            </tr>
                          </thead>
                          <tbody>
                          {wanteds.map((val, i) => {
                                val.title = val.title.replace(/-/g,' ');
                                const name = val.title;
                                const wanted_slug = val.id+'-'+name.replace(/\s+/g, '-').toLowerCase()
                              return (
                                  <tr>
                                      <td><a target="_blank" href={"/wanted/" + wanted_slug + "/"}>{val.title ? val.title : ' -- '}</a></td>
                                      <td>{val.is_active ? 'Active' : ' In Active '}</td>
                                      <td>{val.views}</td>
                                  </tr>
                              );
                            })
                          }
                          </tbody>
                        </Table>
                    </PortletBody>
                </Portlet>
            </div>
        </div>
    </>
  );
}
