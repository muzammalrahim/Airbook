import React from "react";
import clsx from 'clsx';
import PropTypes from 'prop-types';
import Notice from "../../partials/content/Notice";
import CustomHead from "../../partials/content/CustomHeader.js";
import { Link, withRouter } from 'react-router-dom'
import { list, post, USER_URL } from "../../crud/api";
import { Dropdown, Modal,  Button, Form, Col} from "react-bootstrap";
import {
    Delete as DeleteIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Info as InfoIcon,
    Warning as WarningIcon
} from '@material-ui/icons';
import { lighten, makeStyles } from '@material-ui/core/styles';
import { amber, green } from '@material-ui/core/colors';
import {
    IconButton, Paper, FormControlLabel, Switch, Snackbar, Checkbox, Toolbar, Tooltip, Typography, SnackbarContent
} from '@material-ui/core';

const variantIcon = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const useStylesSnackbarContent = makeStyles(theme => ({
  success: {
    backgroundColor: green[600],
  },
  error: {
    backgroundColor: theme.palette.error.dark,
  },
  info: {
    backgroundColor: theme.palette.primary.main,
  },
  warning: {
    backgroundColor: amber[700],
  },
  icon: {
    fontSize: 20,
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1),
  },
  message: {
    display: 'flex',
    alignItems: 'center',
  },
}));

function SnackbarContentWrapper(props) {
  const classes = useStylesSnackbarContent();
  const { className, message, onClose, variant, ...other } = props;
  const Icon = variantIcon[variant];

  return (
    <SnackbarContent
      className={clsx(classes[variant], className)}
      aria-describedby="client-snackbar"
      message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
          {message}
        </span>
      }
      action={[
        <IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
          <CloseIcon className={classes.icon} />
        </IconButton>,
      ]}
      {...other}
    />
  );
}

SnackbarContentWrapper.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string,
  onClose: PropTypes.func,
  variant: PropTypes.oneOf(['error', 'info', 'success', 'warning']).isRequired,
};

class Edit extends React.Component {
  constructor(props) {
    super(props);

    let company = this.props.data.userProp.contact.company;

    if(company) {
      const company_id = company.id;
      this.getCompany(company_id);
    }
    
    this.state = { 
      validated: false, 
      company:{},
      showModal:false,
      request_message:'',
      message:'Request sent successfully',
      showMessage:false
    };

    
  }

  getCompany(company_id) {
    list('companies/'+company_id+'/').then(
      (response) => {
        delete response.data.city;
        delete response.data.state;
        delete response.data.country;
        delete response.data.specialities;
        this.setState({company : response.data});
      });  
  }

  handleSendRequest = () => {
    post('contactqueries', {
      enquiry_type:"request for company update",
      message:this.state.request_message,
      email:this.props.data.userProp.email,
      name:this.props.data.userProp.contact.first_name+' '+this.props.data.userProp.contact.last_name,
      phone:this.props.data.userProp.contact.business_phone
    }).then(
        (response) => {
            this.setState({showMessage:true, showModal:false})
        }).catch(error => {
        this.props.sendError(error.response.data);
    });
  }

  render() {
    const { company } = this.state;
    return (
      <Form>
        <Form.Row>
          <Form.Group as={Col} md="4">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              disabled
              type="text"
              placeholder=""
              model="company"
              value = {company? company.name:''}
              // onChange={e => this.handleChange(e)}
            />
          </Form.Group>
          <Form.Group as={Col} md="4">
            <Form.Label>RFQ Email</Form.Label>
            <Form.Control
              disabled
              type="text"
              placeholder=""
              model="company"
              name="rfq_email"
              value = {company? company.rfq_email:''}
              onChange={e => this.handleChange(e)}
            />
          </Form.Group><Form.Group as={Col} md="4">
            <Form.Label>AOG Email</Form.Label>
            <Form.Control
              disabled
              type="text"
              placeholder=""
              model="company"
              name="aog_email"
              value = {company? company.aog_email:''}
              onChange={e => this.handleChange(e)}
            />
          </Form.Group>
        </Form.Row>
      <Button onClick={() => this.setState({showModal:true})} className="btn btn-primary">
          <i className="la la-send" />
          Request For Update
        </Button>
            <Modal show={this.state.showModal} onHide={() => this.setState({showModal:false})} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Send Request For Update</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <textarea rows="5" onChange={(e) => this.setState({request_message:e.target.value})}
                              style={{display: 'block', width: "100%"}}/>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="success"
                            className={this.state.showSpinner === true ? "kt-spinner kt-spinner--right kt-spinner--sm kt-spinner--light" : ''}
                            onClick={() => this.handleSendRequest()}>
                        Send
                    </Button>
                    <Button variant="danger" onClick={() => this.setState({showModal:false})}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>
      <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={this.state.showMessage}
          autoHideDuration={5000}
          onClose={()=>this.setState({showMessage:false})}
        >
          <SnackbarContentWrapper
            onClose={()=>this.setState({showMessage:false})}
            variant="success"
            message={this.state.message}
          />
      </Snackbar>
    </Form>
     );
  }
}

class EditPage extends React.Component {
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
              return <li key={index+i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
            });
          })
        }
        </Notice>

        <div className="row">
          <div className="col-md-12">
            <CustomHead
              beforeCodeTitle={'My Company'}
              jsCode =   {<div className="kt-portlet__head-toolbar">
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