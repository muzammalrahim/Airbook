import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL, MESSAGE_TYPES} from "../../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import Notice from "../../../partials/content/Notice";

class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { template_id } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      emailTemplate:{},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      is_active: '',
      messageTypes: MESSAGE_TYPES,
      messageType: '',

    };
    this.getEmailTemplate(template_id);
    this.divStyle = divStyle;
  }

  getEmailTemplate(template_id) {
    list('emails/'+template_id+'/').then(
      (response) => {
          let messageType = this.state.messageType;
          this.state.messageTypes.map((index)=> {
              if (index.value === response.data.message_type) {
                  messageType = index.label;
              }
          })
          this.props.setTitle(messageType);
          this.setState({
              created_at : response.data.created_at ? new Intl.DateTimeFormat().format(new Date(response.data.created_at)) : '',
              updated_at : response.data.updated_at ? new Intl.DateTimeFormat().format(new Date(response.data.updated_at)) : ''
          });
          this.setState({emailTemplate : response.data, messageType: messageType })
    });
  }

  handleChange(val, attr) {
    var emailTemplate = this.state.emailTemplate;

    emailTemplate[attr] = val;
    this.setState({emailTemplate : emailTemplate})
    patch('emails/'+this.state.emailTemplate.id+'/', this.state.emailTemplate).then(
      (response) => {
        this.setState({emailTemplate : response.data});
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
      this.state.emailTemplate.is_active = this.state.is_active;
      patch('emails/'+this.state.emailTemplate.id+'/', this.state.emailTemplate).then(
        (response) => {
          delete response.data.type;
          this.setState({emailTemplate : response.data});
          this.setState({showModal : false});
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }

  render() {
    const { validated, emailTemplate, messageType } = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <div className="kt_section__detail">
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Message Type</div>
                            <div>{messageType ? messageType : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Subject</div>
                            <div>{emailTemplate.subject ? emailTemplate.subject : '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Sending Email</div>
                            <div>{emailTemplate.sending_email ? emailTemplate.sending_email : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Date Created</div>
                            <div>{this.state.created_at ? this.state.created_at : ''}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Date Modified</div>
                            <div>{this.state.updated_at ? this.state.updated_at : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Status</div>
                            <div>
                              <span onClick={(e) => this.handleModalShow(e,'status')} className={this.state.emailTemplate.is_active === 1 ? 'kt-switch kt-switch--sm kt-switch--success':'kt-switch kt-switch--sm kt-switch--danger'}>
                                <label>
                                  <input
                                    type="checkbox" checked={emailTemplate.is_active === 1 ? 'defaultChecked':''}
                                    value={emailTemplate.is_active === 1 ? '1' : '0'}
                                    name="is_active"
                                  />
                                  <span />
                                </label>
                              </span>
                            </div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Message</div>
                            <div dangerouslySetInnerHTML={{__html: emailTemplate.message}}></div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Footer</div>
                            <div dangerouslySetInnerHTML={{__html: emailTemplate.footer_message}}></div>
                        </div>
                    </div>
                  </div>
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
    this.state = {errors:{}, showError:false, title: 'Email Template'};
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
                  <Link to={"/admin/email-template"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                    <Link to={"/admin/email-template/"+this.props.match.params.template_id+"/edit"} className="btn btn-primary">
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