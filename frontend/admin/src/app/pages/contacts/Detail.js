import React from "react";
import CustomHead from "../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL, NO_IMAGE} from "../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../partials/content/Notice";



class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { contact_id, type } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      type : type,
      contact:{},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      image:[],
      is_published: ''

    };
    this.getContact(contact_id);
    this.divStyle = divStyle;
  }

  getContact(contact_id) {
    list('contacts/'+contact_id+'/').then(
      (response) => {
          delete response.data.type;
          this.setState({
              created_at : new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
              updated_at : new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
              image: response.data.media ? response.data.media.original_file_name : null
          });
          this.props.setTitle(response.data.first_name+' '+ response.data.last_name);
          this.setState({contact : response.data})
    });
  }

  handleChange(val, attr) {
    var contact = this.state.contact;

    contact[attr] = val;
    this.setState({contact : contact})
    patch('contacts/'+this.state.contact.id+'/', this.state.contact).then(
      (response) => {
        this.setState({contact : response.data});
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
      this.state.contact.is_published = this.state.is_published;
      patch('contacts/'+this.state.contact.id+'/', {is_published: this.state.is_published}).then(
        (response) => {
          delete response.data.type;
          this.setState({contact : response.data});
          this.setState({showModal : false});
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }

  render() {
    const { validated, contact } = this.state;
    const username = contact.first_name+' '+contact.last_name;
    const contact_slug = contact.id+'-'+username.replace(/\s+/g, '-').toLowerCase()
    const company_slug = contact.company ? contact.company.id+'-'+contact.company.name.replace(/\s+/g, '-').toLowerCase() : '';
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <div className="kt_section__detail">
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Name</div>
                            <div><Link target="_blank" to={"/contact/" + contact_slug + "/"}>{username}</Link></div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Religion</div>
                            <div>{contact.religion}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Company</div>
                            <div>{contact.company && contact.company.name && company_slug ? <Link target="_blank" to={"/company/" + company_slug + "/"}>{contact.company.name}</Link> : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Job Title</div>
                            <div>{contact.job_title ? contact.job_title.name: '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Department</div>
                            <div>{contact.department ? contact.department.name : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Job Title</div>
                            <div>{contact.job_title ? contact.job_title.name: '---'}</div>
                        </div>
                    </div>
                    <hr/>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Mobile Phone</div>
                            <div>{contact.mobile_phone ? contact.mobile_phone : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Business Phone</div>
                            <div>{contact.business_phone ? contact.business_phone: '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Skype</div>
                            <div>{contact.skype ? contact.skype : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Linkedin</div>
                            <div>{contact.linkedin ? contact.linkedin: '---'}</div>
                        </div>
                    </div>
                    <hr/>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Address</div>
                            <div>{contact.address ? contact.address : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">City</div>
                            <div>{contact.city ? contact.city.name: '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">State</div>
                            <div>{contact.state ? contact.state.name : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Country</div>
                            <div>{contact.country ? contact.country.name: '---'}</div>
                        </div>
                    </div>
                    <hr/>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Preferred contact method</div>
                            <div>{contact.preferred_contact_method ? contact.preferred_contact_method : '---'}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Published Status</div>
                            <div>{contact.is_published ? contact.is_published: '---'}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Date Created</div>
                            <div>{this.state.created_at}</div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Date Modified</div>
                            <div>{this.state.updated_at}</div>
                        </div>
                    </div>
                    <div className="row mb-4">
                        <div className="col-md-6 col-12">
                            <div className="kt_detail__item_title">Status</div>
                            <div>
                              <span onClick={(e) => this.handleModalShow(e,'status')} className={this.state.contact.is_published === 1 ? 'kt-switch kt-switch--sm kt-switch--success':'kt-switch kt-switch--sm kt-switch--danger'}>
                                <label>
                                  <input
                                    type="checkbox" checked={contact.is_published === 1 ? 'defaultChecked':''}
                                    value={contact.is_published === 1 ? '1' : '0'}
                                    name="is_published"
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
                    <img style={{maxHeight:'220px', maxWidth:'200px'}} src={ this.state.image ? MEDIA_URL+this.state.image : NO_IMAGE } />
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
    this.state = {errors:{}, showError:false, title: 'Contact'};
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
                  <Link to={"/admin/contacts"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                    <Link to={"/admin/contacts/"+this.props.match.params.contact_id+"/edit"} className="btn btn-primary">
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