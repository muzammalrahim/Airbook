import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col, Carousel} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL, USER_URL, STATUSES, NO_IMAGE} from "../../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../../partials/content/Notice";


class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { apu_id, type } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      type : type,
      apu:{},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      image:[],
      is_published: ''

    };
    this.getApu(apu_id);
    this.divStyle = divStyle;
  }

  getApu(apu_id) {
    list('apus/'+apu_id+'/').then(
      (response) => {
          delete response.data.type;
          this.setState({
              created_at : new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
              updated_at : new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
              image: response.data.media ? response.data.media : null
          });
          this.props.setApuTitle(response.data.title, apu_id);
          this.setState({apu : response.data})
    });
  }

  handleChange(val, attr) {
    var apu = this.state.apu;

    apu[attr] = val;
    this.setState({apu : apu})
    patch('apus/'+this.state.apu.id+'/', this.state.apu).then(
      (response) => {
        this.setState({apu : response.data});
    }).catch(error => {
        this.props.sendError(error.response.data);
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
      this.state.apu.is_published = this.state.is_published;
      patch('apus/'+this.state.apu.id+'/', {is_published: this.state.is_published}).then(
        (response) => {
          delete response.data.type;
          this.setState({apu : response.data});
          this.setState({showModal : false});
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }



  render() {
    const { validated, apu } = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <div className="kt_section__detail">
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Category</div>
                                    <div>{apu.category ? apu.category.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Manfacturer</div>
                                    <div>{apu.manufacturer ? apu.manufacturer.name : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Type</div>
                                    <div>{apu.type ? apu.type.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Model</div>
                                    <div>{apu.model ? apu.model.name : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Serial Number</div>
                                    <div>{apu.serial_number ? apu.serial_number : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Part Number</div>
                                    <div>{apu.part_number ? apu.part_number : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Cycles Remaining (CR)</div>
                                    <div>{apu.cycle_remaining ? apu.cycle_remaining : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Status</div>
                                    <div>{apu.status ? apu.status : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Thrust Rating</div>
                                    <div>{apu.thrust_rating ? apu.thrust_rating : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">LSV Description</div>
                                    <div>{apu.lsv_description ? apu.lsv_description : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Thrust Rating</div>
                                    <div>{apu.thrust_rating ? apu.thrust_rating : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Offer For</div>
                                    <div>{apu.offer_for ? apu.offer_for : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Availablility</div>
                                    <div>{apu.availability ? new Intl.DateTimeFormat().format(new Date(apu.availability)) : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Location</div>
                                    <div>{apu.current_location ? apu.current_location.name : '---'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Primary Contact</div>
                                    <div>{apu.primary_contact ? apu.primary_contact.first_name + ' ' + apu.primary_contact.last_name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Owner</div>
                                    <div>{apu.owner ? apu.owner.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seller</div>
                                    <div>{apu.seller ? apu.seller.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Additional details</div>
                                    <div>{apu.description ? apu.description : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Views</div>
                                    <div>{apu.views ? apu.views : 0}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Likes</div>
                                    <div>{apu.likes ? apu.likes : 0}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Promote Status</div>
                                    <div>{apu.is_featured ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Active Status</div>
                                    <div>
                                      {
                                                apu.isactivestatus? STATUSES.map((val, i) => {
                                                    if (val.value === apu.isactivestatus)
                                                        return val.value
                                                }) : '---'
                                            }
                                    </div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Published Status</div>
                                    <div>{apu.is_published ? apu.is_published : '-----'}</div>
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
              <Button variant="danger" onClick={this.confirm}>
                Yes
              </Button>
              <Button variant="success" onClick={this.handleModalClose}>
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
    this.state = {errors:{}, showError:false};
    this.state.type = type;
    this.sendError = this.sendError.bind(this);
  }

  sendError(error) {
    if(Object.keys(error).length)
      this.setState({showError:true});

    this.setState({errors:error});
  }
    setApuTitle = (title, id) => {
        let apuName = title.toLowerCase();
        if(apuName.includes('-yom-')){
            apuName = apuName.split('-yom-')[0].replace(/-/g,' ')
        }else{
            apuName = apuName.replace(/-/g,' ')
        }
        this.setState({apu_title:apuName, apu_url: id+'-'+title.toLowerCase()});
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
              <a target="_blank" href={"/apu/"+this.state.apu_url}>{this.state.apu_title}</a>
              </h3>}
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                      <Link to={"/"+USER_URL+"/apu/asset"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                      <Link
                        to={"/"+USER_URL+"/apu/asset/" + this.props.match.params.apu_id + "/edit"}
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
                <Detail data={this.props} setApuTitle={(title, id)=> this.setApuTitle(title, id)} sendError={this.sendError} />
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(DetailPage);