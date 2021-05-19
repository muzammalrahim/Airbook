import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL} from "../../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../../partials/content/Notice";



class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { price_id } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      price:{},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      image:null,
      is_active: ''

    };
    this.getPrice(price_id);
    this.divStyle = divStyle;
  }

  getPrice(price_id) {
    list('pricing/'+price_id+'/').then(
      (response) => {
          delete response.data.type;
          this.setState({
              created_at : response.data.created_at ? new Intl.DateTimeFormat().format(new Date(response.data.created_at)) : '',
              updated_at : response.data.updated_at ? new Intl.DateTimeFormat().format(new Date(response.data.updated_at)) : '',
              image: response.data.media ? response.data.media.original_file_name : null
          });
          this.props.setTitle(response.data.name);
          this.setState({price : response.data})
    });
  }

  handleChange(val, attr) {
    var price = this.state.price;

    price[attr] = val;
    this.setState({price : price})
    patch('pricing/'+this.state.price.id+'/', this.state.price).then(
      (response) => {
        this.setState({price : response.data});
    }).catch(error => {
        this.props.sendError(error.response.data);
    });
  }
  handleModalShow(event, action) {
    var val = event.target.value;
    if (action === 'status'){
      val = parseInt(val);
      this.setState({is_active : val === 1 ? 0:1})
    }
    this.setState({action: action});
    this.setState({ showModal: true });
  }

  handleModalClose() {
   this.setState({ showModal: false });
  }

  confirm() {
    if(this.state.action === 'status') {
      this.state.price.is_active = this.state.is_active;
      patch('pricing/'+this.state.price.id+'/', this.state.price).then(
        (response) => {
          delete response.data.type;
          this.setState({price : response.data});
          this.setState({showModal : false});
          // this.props.data.history.push("/"+this.state.type+"/price");
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }

  render() {
    const { validated, price } = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <div className="kt_section__detail">
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Name</div>
                            <div>{price.name ? price.name : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Price</div>
                            <div>{price.price ? price.price : '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-12 col-12">
                            <div className="kt_detail__item_title">Description</div>
                            <div>{price.description ? price.description : '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Date Created</div>
                            <div>{this.state.created_at ? this.state.created_at : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Date Modified</div>
                            <div>{this.state.updated_at ? this.state.updated_at : '---'}</div>
                        </div>
                    </div>
                  </div>
                </Grid>
                <Grid item xs={12} md={3}>
                    <img style={{maxHeight:'220px', maxWidth:'200px'}} src={ this.state.image ? MEDIA_URL+this.state.image : MEDIA_URL+'dummy_image.svg' } />
                </Grid>
          </Grid>

          <Modal show={this.state.showModal} onHide={this.handleModalClose}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm</Modal.Title>
            </Modal.Header>
            <Modal.Footer>
              <Button variant="success" onClick={this.confirm}>
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
    this.state = {errors:{}, showError:false, title: 'Pricing'};
    this.state.type = type;
    this.sendError = this.sendError.bind(this);
  }

  sendError(error) {
    if(Object.keys(error).length)
      this.setState({showError:true});

    this.setState({errors:error});
  }

  setMainTitle = (value) => {
    this.setState({title: value});
  };

  render() {
    return (
      <>
      <Notice icon="flaticon-warning kt-font-primary" style={{display: this.state.showError ? 'flex' : 'none' }}>
        {
          Object.keys(this.state.errors).map((key, index) => {
            return this.state.errors[key].map((error, i) => {
              console.log(error);
              return <li key={index+i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
            });
          })
        }
        </Notice>
        <div className="row">
          <div className="col-md-12">
            <CustomHead
              beforeCodeTitle={this.state.title}
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                  <Link to={"/admin/pricing"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                      <Link to={"/admin/pricing/"+this.props.match.params.price_id+"/edit"} className="btn btn-primary">
                        <i className="la la-edit" />
                        Edit
                      </Link>
                  </div>
                </div>
              </div>
            </div> }
            >
              <div className="kt-section">
                <Detail data={this.props} sendError={this.sendError} setTitle={this.setMainTitle} />
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(DetailPage);