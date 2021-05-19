import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col, Carousel} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL, USER_URL, STATUSES, NO_IMAGE} from "../../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../../partials/content/Notice";
import { getDateWithFormat } from "../../../helpers/listing";


class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { aircraft_id, type } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      type : type,
      aircraft:{},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      image:[],
      is_published: ''

    };
    this.getAircraft(aircraft_id);
    this.divStyle = divStyle;
  }

  getAircraft(aircraft_id) {
    list('aircrafts/'+aircraft_id+'/').then(
      (response) => {
          this.setState({
              created_at : new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
              updated_at : new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
              image: response.data.media ? response.data.media : null
          });
          this.props.setAircraftTitle(response.data.title, aircraft_id);
          this.setState({aircraft : response.data})
    });
  }

  handleModalShow(event, action) {
    var val = event.target.value;
    if (action === 'status'){
      val = parseInt(val);
      this.setState({is_published : val === 1 ? 0:1})
    }
    this.setState({action: action});
    this.setState({ showModal: true });
  }

  handleModalClose() {
   this.setState({ showModal: false });
  }

  confirm() {
    if(this.state.action === 'status') {
      this.state.aircraft.is_published = this.state.is_published;
      patch('aircrafts/'+this.state.aircraft.id+'/', {is_published: this.state.is_published}).then(
        (response) => {
          this.setState({aircraft : response.data});
          this.setState({showModal : false});
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }

  render() {
    const { validated, aircraft } = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <div className="kt_section__detail">
                            {/*<div className="row">
                                <div className="col-12">
                                    <h3>Basic Info</h3>
                                </div>
                            </div>
                            <hr/>*/}
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Category</div>
                                    <div>{aircraft.category ? aircraft.category.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Manufacturer</div>
                                    <div>{aircraft.manufacturer ? aircraft.manufacturer.name : ''}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Primary Contact</div>
                                    <div>{aircraft.primary_contact ? aircraft.primary_contact.first_name + ' ' + aircraft.primary_contact.last_name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Owner</div>
                                    <div>{aircraft.owner ? aircraft.owner.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seller</div>
                                    <div>{aircraft.seller ? aircraft.seller.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Manager</div>
                                    <div>{aircraft.manager ? aircraft.manager.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Previous Operator</div>
                                    <div>{aircraft.previous_operator ? aircraft.previous_operator.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Operator</div>
                                    <div>{aircraft.current_operator ? aircraft.current_operator.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Availability</div>
                                    <div>{aircraft.availability ? getDateWithFormat(new Date(aircraft.availability), 'MMM DD, YYYY') : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Location</div>
                                    <div>{aircraft.current_location ? aircraft.current_location.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Configuration</div>
                                    <div>{aircraft.configuration ? aircraft.configuration.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seating</div>
                                    <div>Economy
                                        (Y) {aircraft.seating_economy ? aircraft.seating_economy : 0}, Business
                                        (C) {aircraft.seating_business ? aircraft.seating_business : 0}, First
                                        (F) {aircraft.seating_first_class ? aircraft.seating_first_class : 0}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Engine Manufacturer</div>
                                    <div>{aircraft.engine_manufacturer ? aircraft.engine_manufacturer.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">YOM</div>
                                    <div>{aircraft.yom ? aircraft.yom : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            {/*<div className="row">
                                <div className="col-12">
                                    <h3>Technial Info</h3>
                                </div>
                            </div>
                            <hr/>*/}
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Type</div>
                                    <div>{aircraft.type ? aircraft.type.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Model</div>
                                    <div>{aircraft.model ? aircraft.model.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Status</div>
                                    <div>{aircraft.status ? aircraft.status : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Compliance</div>
                                    <div>{aircraft.compliance ? aircraft.compliance : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Last C Check</div>
                                    <div>{aircraft.last_c_check ? new Intl.DateTimeFormat().format(new Date(aircraft.last_c_check)) : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">MSN</div>
                                    <div>{aircraft.msn ? aircraft.msn : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">TSN</div>
                                    <div>{aircraft.tsn ? aircraft.tsn : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">CSN</div>
                                    <div>{aircraft.csn ? aircraft.csn : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">MTOW Kg</div>
                                    <div>{aircraft.mtow ? aircraft.mtow : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">MLGW Kg</div>
                                    <div>{aircraft.mlgw ? aircraft.mlgw : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Registration Country</div>
                                    <div>{aircraft.registration_country ? aircraft.registration_country.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Registration Number</div>
                                    <div>{aircraft.registration_number ? aircraft.registration_number : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Engine Model</div>
                                    <div>{aircraft.engine_model ? aircraft.engine_model.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Engine Type</div>
                                    <div>{aircraft.engine_type ? aircraft.engine_type.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Offer For</div>
                                    <div>{aircraft.offer_for ? aircraft.offer_for : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Price</div>
                                    <div>{aircraft.price ? aircraft.price+' USD' : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-12 col-12">
                                    <div className="kt_detail__item_title">Additional details</div>
                                    <div>{aircraft.description ? aircraft.description : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Views</div>
                                    <div>{aircraft.views ? aircraft.views : 0}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Likes</div>
                                    <div>{aircraft.likes ? aircraft.likes : 0}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Promote Status</div>
                                    <div>{aircraft.is_featured ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Active Status</div>
                                    <div>
                                            {
                                                aircraft.isactivestatus? STATUSES.map((val, i) => {
                                                    if (val.value === aircraft.isactivestatus)
                                                        return val.value
                                                }) : '---'
                                            }
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Published Status</div>
                                    <div>{aircraft.is_published ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Date Created</div>
                                    <div>{this.state.created_at ? this.state.created_at : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Date Modified</div>
                                    <div>{this.state.updated_at ? this.state.updated_at : '-----'}</div>
                                </div>
                            </div>
                        </div>
                </Grid>
                <Grid item xs={12} md={3}>
                    {this.state.image !== '' && this.state.image.length > 0  ?<Carousel>
                            {this.state.image && this.state.image.map((image, index) => {
                                return <Carousel.Item key={index}>
                                    <img
                                        className="d-block w-100"
                                        src={MEDIA_URL+image.original_file_name}
                                    />
                                </Carousel.Item>
                            })
                            }
                        </Carousel>:
                         <img className="d-block w-100" src={NO_IMAGE} />
                        }
                </Grid>
          </Grid>

          <Modal show={this.state.showModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm</Modal.Title>
            </Modal.Header>
            <Modal.Footer>
              <Button variant="succes" onClick={this.confirm}>
                Yes
              </Button>
              <Button variant="danger" onClick={this.handleModalClose}>
                No
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
    );
  }
}

class DetailPage extends React.Component {
  constructor(props) {
    super(props);
    let type = props.match.params.type;
    this.state = {errors:{}, showError:false, aircraft_title:'Aircraft'};
    this.state.type = type;
    this.sendError = this.sendError.bind(this);
  }

  sendError(error) {
    if(Object.keys(error).length)
      this.setState({showError:true});

    this.setState({errors:error});
  }

  setAircraftTitle = (title, id) => {
    let aircraftName = title.toLowerCase();
    if(aircraftName.includes('-yom-')){
        aircraftName = aircraftName.split('-yom-')[0].replace(/-/g,' ')
    }else{
        aircraftName = aircraftName.replace(/-/g,' ')
    }
    this.setState({aircraft_title:aircraftName, aircraft_url: id+'-'+title.toLowerCase()});
  }
  render() {
    return (
      <>
      <Notice icon="flaticon-warning kt-font-primary" style={{display: this.state.showError ? 'flex' : 'none' }}>
        {
          Object.keys(this.state.errors).map((key, index) => {
            return this.state.errors[key].map((error, i) => {
              return <li key={index+i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
            });
          })
        }
        </Notice>
        <div className="row">
          <div className="col-md-12">
            <CustomHead
              beforeCodeTitle={<h3 class="kt-portlet__head-title" style={{textTransform: 'capitalize'}}>
              <a target="_blank" href={"/aircraft/"+this.state.aircraft_url}>{this.state.aircraft_title}</a>
              </h3>}
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                  <Link to={"/"+USER_URL+"/aircraft/asset"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                    <Link
                                                to={"/"+USER_URL+"/aircraft/asset/" + this.props.match.params.aircraft_id + "/edit"}
                                                className="btn btn-primary">
                                                <i className="la la-edit"/>
                                                Edit
                                            </Link>
                  </div>
                </div>
              </div>
            </div> }
            >
              <div className="kt-section">
                <Detail data={this.props} setAircraftTitle={(title, id)=> this.setAircraftTitle(title, id)} sendError={this.sendError} />
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(DetailPage);