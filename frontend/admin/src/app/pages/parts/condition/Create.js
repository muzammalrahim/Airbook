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
import { Link, withRouter } from 'react-router-dom'
import { post } from "../../../crud/api";



class Create extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      condition:{is_active: 0},
      validated: false,
      action:'',
    };

  }

  handleChange(event) {
    var condition = this.state.condition;
    var attr = event.target.name;
    var val = event.target.value;
    if(attr === 'is_active')
      val = parseInt(val);
    condition[attr] = val;
    this.setState({condition : condition})
  }

  handleSubmit(event) {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    this.setState({ validated: true });
    post('conditions', this.state.condition).then(
      (response) => {
        this.setState({condition : response.data});
        this.state.action == 'save_new' ? this.clearForm("part-condition-form") : this.props.data.history.push("/admin/parts/condition");
    }).catch(error => { 
        this.props.sendError(error.response.data);
    });
  }
  clearForm = (id) => {
      this.props.data.history.replace("/admin/parts/condition");
        this.props.data.history.replace("/admin/parts/condition/create");
    }
  render() {
    const { validated, condition } = this.state;
    return (
      <Form
        noValidate
        id = "part-condition-form"
        onSubmit={e => this.handleSubmit(e)}
      >
        <Form.Row>
          <Form.Group as={Col} md="12">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              required
              type="text"
              placeholder=""
              model="condition"
              name="name"
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
        </Form.Row>
        <Form.Row>
          <Form.Group as={Col} md="12">
            <FormControl component="fieldset" className="col-md-12">
              <RadioGroup
                aria-label="status"
                name="is_active"
                className="col-md-12"
                value={condition.is_active === 1 ? '1' : '0'}
                onChange={e => this.handleChange(e)}
              >
                <FormControlLabel className="col-md-2" value="1" control={<Radio />} label="Publish" />
                <FormControlLabel className="col-md-2" value="0" control={<Radio />} label="Inactive" />
              </RadioGroup>
            </FormControl>
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

        <Link to={"/admin/parts/condition"} className="btn btn-danger">
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
    this.state = {errors:{}, showError:false};
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
              beforeCodeTitle={"Parts Condition"}
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                  <Link to={"/admin/parts/condition"} className="btn btn-clean btn-icon-sm">
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