import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import { Button, Form, Col} from "react-bootstrap";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button as ButtonCore,
} from "@material-ui/core";
import { CloudUpload as CloudUploadIcon } from "@material-ui/icons";
import { Link, withRouter } from 'react-router-dom'
import { list, post } from "../../../crud/api";



class Create extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      price:{},
      action:'',
      selectedFile: null,
      previewFile: null,
    };

  }

  handleChange(event) {
    var price = this.state.price;
    var attr = event.target.name;
    var val = event.target.value;
    if(attr === 'is_active')
      val = parseInt(val);

    price[attr] = val;
    this.setState({price : price})
  }

  handleSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    //if(!this.state.selectedFile)
      //delete this.state.price.file;
    post('pricing', this.state.price).then(
      (response) => {
        this.setState({price : response.data});
        this.state.action == 'save_new' ? this.clearForm("price-form") : this.props.data.history.push("/admin/pricing");
    }).catch(error => { 
        this.props.sendError(error.response.data);
    });
  }
  clearForm = (id) => {
    this.props.data.history.replace("/admin/pricing");
    this.props.data.history.replace("/admin/pricing/create");
  }

  render() {
    const { price, selectedFile } = this.state;
    return (
      <Form
        noValidate
        id="price-form"
        onSubmit={e => this.handleSubmit(e)}
      >
        <Form.Row>
          <Form.Group as={Col} md="6">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder=""
              model="pricing"
              name="name"
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
          <Form.Group as={Col} md="6">
            <Form.Label>Price *</Form.Label>
            <Form.Control
              required
              type="number"
              placeholder=""
              model="pricing"
              name="price"
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
          {/*<Form.Group as={Col} md="6">
            <Form.Label>Discount *</Form.Label>
            <Form.Control
              required
              type="number"
              placeholder=""
              model="pricing"
              name="discount"
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
          <Form.Group as={Col} md="6">
          <Form.Label>Price after Discount</Form.Label>
            <Form.Control
              type="number"
              placeholder=""
              model="pricing"
              name="discount_after"
              disabled
            />
          </Form.Group>*/}
          <Form.Group as={Col} md="12">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows="5"
              model="pricing"
              name="description"
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
        </Form.Row>
        <Button type="submit" onClick={(e) => this.setState({action:'save'})} className="btn btn-primary">
          <i className="la la-save" />
          Save & Close
        </Button>
        &nbsp;&nbsp;

        <Button type="submit" onClick={(e) => this.setState({action:'save_new'})} className="btn btn-success">
          <i className="la la-save" />
          Save & New
        </Button>
        &nbsp;&nbsp;

        <Link to={"/admin/pricing"} className="btn btn-danger">
          <i className="la la-remove" />
          Cancel
        </Link>
      </Form>
    );
  }
}

class CreatePage extends React.Component {
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
              beforeCodeTitle="Pricing"
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                  <Link to={"/admin/pricing"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                  </div>
                </div>
              </div>
            </div>
            }>
              <div className="kt-section">
                <Create data={this.props} sendError={this.sendError} />
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(CreatePage);