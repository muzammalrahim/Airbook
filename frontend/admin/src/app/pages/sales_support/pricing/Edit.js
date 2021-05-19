import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import { Button, Form, Col} from "react-bootstrap";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl, Button as ButtonCore,
} from "@material-ui/core";
import { Link, withRouter } from 'react-router-dom'
import { list, patch, MEDIA_URL } from "../../../crud/api";
import Select from 'react-select';
import {CloudUpload as CloudUploadIcon} from "@material-ui/icons";



class Edit extends React.Component {
  constructor(props) {
    super(props);

    const { price_id, type } = this.props.data.match.params
    this.state = { 
      validated: false, 
      price:{},
      type: type,
      selectedFile: null,
      previewFile: null,
    };

    this.getPrice(price_id);
  }

  getPrice(price_id) {
    list('pricing/'+price_id+'/').then(
      (response) => {
          delete response.data.type;
          this.setState({price : response.data, previewFile: response.data.media ? MEDIA_URL+response.data.media.original_file_name : null})
    });
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
    this.setState({ validated: true });
    patch('pricing/'+this.state.price.id+'/', this.state.price).then(
      (response) => {
        delete response.data.type;
        this.setState({price : response.data});
        this.props.data.history.push("/admin/pricing");
    }).catch(error => { 
        this.props.sendError(error.response.data);
    });
  }

  render() {
    const { validated, price, selectedFile} = this.state;
    return (
      <Form
        noValidate
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
              defaultValue={price ? price.name:''}
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
              defaultValue={price ? price.price:''}
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
        </Form.Row>
        <Form.Row>
          <Form.Group as={Col} md="12">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows="3" 
              required
              placeholder=""
              model="pricing"
              name="description"
              defaultValue={price ? price.description:''}
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
        </Form.Row>
        <Button type="submit" className="btn btn-primary">
          <i className="la la-save" />
          Update
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

class EditPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {errors:{}, showError:false, type:props.match.params.type};
    this.sendError = this.sendError.bind(this);
  }

  sendError(error) {
    if(Object.keys(error).length)
      this.setState({showError:true});

    this.setState({errors:error});
  }

  render() {
    
    // const { Formik } = formik;
    const buttons = <Link to={"/admin/pricing"} className="btn btn-clean btn-icon-sm">
                      <i className="la la-long-arrow-left"></i>
                      Back
                    </Link>
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
              beforeCodeTitle='Pricing'
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                  {buttons}
                  </div>
                </div>
              </div>
            </div>}
            >
              <div className="kt-section">
                <Edit data = {this.props} sendError={this.sendError} />
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(EditPage);