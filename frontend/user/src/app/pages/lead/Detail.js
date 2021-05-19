import React from "react";
import CustomHead from "../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL} from "../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../partials/content/Notice";



class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { lead_id } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.state = {
      lead:{},
      action:'',
      created_at: '',
      updated_at: '',
      is_published: ''

    };
    this.getLead(lead_id);
    this.divStyle = divStyle;
  }

  getLead(lead_id) {
    list('leads/'+lead_id+'/').then(
      (response) => {
          delete response.data.type;
          this.setState({
              created_at : new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
              updated_at : new Intl.DateTimeFormat().format(new Date(response.data.updated_at))
          });
          //this.props.setTitle(response.data.first_name+' '+ response.data.last_name);
          this.setState({lead : response.data})
    });
  }

  render() {
    const { validated, lead } = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <Form>
                  <Form.Row>
                    <Form.Group as={Col} md="6" xs="12">
                      <Form.Label>Lead Title</Form.Label><br/>
                      <Form.Label style={this.txt_weight}>
                        {lead.leadable ? (lead.leadable_type === 'App\\Contact' ? lead.leadable.first_name+' '+lead.leadable.last_name: lead.leadable.title) : '---'}</Form.Label>
                    </Form.Group>
                    <Form.Group as={Col} md="6" xs="12">
                      <Form.Label>Sender</Form.Label><br/>
                      <Form.Label style={this.txt_weight}>{lead.creator && lead.creator.contact ? lead.creator.contact.first_name+' '+lead.creator.contact.last_name : '---'}</Form.Label>
                    </Form.Group>
                    <Form.Group as={Col} md="6" xs="12">
                      <Form.Label>Receiver</Form.Label><br/>
                      <Form.Label style={this.txt_weight}>{lead.creator && lead.creator.contact && lead.creator.contact.company ? lead.creator.contact.company.name: ' --- '}</Form.Label>
                    </Form.Group>
                  </Form.Row>
                  <hr/>
                  <Form.Row>
                    <Form.Group as={Col} md="6" xs="12">
                      <Form.Label>Message</Form.Label><br/>
                      <Form.Label style={this.txt_weight}>{lead.message ? lead.message: ' --- '}</Form.Label>
                    </Form.Group>
                    <Form.Group as={Col} md="6" xs="12">
                      <Form.Label>Status</Form.Label><br/>
                      <Form.Label style={this.txt_weight}>{lead.lead_status ? lead.lead_status: ' --- '}</Form.Label>
                    </Form.Group>
                    <Form.Group as={Col} md="6" xs="12">
                      <Form.Label>Date Created</Form.Label><br/>
                      <Form.Label style={this.txt_weight}>{this.state.created_at}</Form.Label>
                    </Form.Group>
                  </Form.Row>
                  </Form>
                </Grid>
          </Grid>
        </div>
    );
  }
}

class DetailPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {errors:{}, showError:false, title: 'Lead'};
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
                  <Link to={"/user/lead"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
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