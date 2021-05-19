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
    const { category_id, type } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      type : type,
      category:{},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      image:null,
      is_active: ''

    };
    this.getCategory(category_id);
    this.divStyle = divStyle;
  }

  getCategory(category_id) {
    list('category/'+category_id+'/').then(
      (response) => {
          delete response.data.type;
          this.setState({
              created_at : response.data.created_at ? new Intl.DateTimeFormat().format(new Date(response.data.created_at)) : '',
              updated_at : response.data.updated_at ? new Intl.DateTimeFormat().format(new Date(response.data.updated_at)) : '',
              image: response.data.media ? response.data.media.original_file_name : null
          });
          this.props.setTitle(response.data.name);
          this.setState({category : response.data})
    });
  }

  handleChange(val, attr) {
    var category = this.state.category;

    category[attr] = val;
    this.setState({category : category})
    patch('category/'+this.state.category.id+'/', this.state.category).then(
      (response) => {
        this.setState({category : response.data});
    }).catch(error => {
        this.props.sendError(error.response.data);
    });
  }

  /*handleSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    this.setState({ validated: true });
    post('category', this.state.category).then(
      (response) => {
        this.setState({category : response.data});
        this.props.data.history.push(this.state.action == 'save_new' ? "/"+this.state.type+"/category/create":"/"+this.state.type+"/category");
    }).catch(error => { 
        this.props.sendError(error.response.data);
    });
  }*/

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
      this.state.category.is_active = this.state.is_active;
      patch('category/'+this.state.category.id+'/', this.state.category).then(
        (response) => {
          delete response.data.type;
          this.setState({category : response.data});
          this.setState({showModal : false});
          // this.props.data.history.push("/"+this.state.type+"/category");
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }

  render() {
    const { validated, category } = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <div className="kt_section__detail">
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Name</div>
                            <div>{category.name ? category.name : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Description</div>
                            <div>{category.description ? category.description : '---'}</div>
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
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Status</div>
                            <div>
                              <span onClick={(e) => this.handleModalShow(e,'status')} className={this.state.category.is_active === 1 ? 'kt-switch kt-switch--sm kt-switch--success':'kt-switch kt-switch--sm kt-switch--danger'}>
                                <label>
                                  <input
                                    type="checkbox" checked={category.is_active === 1 ? 'defaultChecked':''}
                                    value={category.is_active === 1 ? '1' : '0'}
                                    name="is_active"
                                  />
                                  <span />
                                </label>
                              </span>
                            </div>
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
    this.state = {errors:{}, showError:false, title: type.charAt(0).toUpperCase() + type.slice(1) +' Category'};
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
                  <Link to={"/admin/"+this.state.type+"/category"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                      <Link to={"/admin/"+this.props.match.params.type+"/category/"+this.props.match.params.category_id+"/edit"} className="btn btn-primary">
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