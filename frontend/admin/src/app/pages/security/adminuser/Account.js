import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col} from "react-bootstrap";
import {Link, withRouter} from 'react-router-dom'
import {list, patch, MEDIA_URL} from "../../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../../partials/content/Notice";


class Detail extends React.Component {

    constructor(props) {
        super(props);
        const user_id = props.data.userProp.contact ? props.data.userProp.contact.id :  null;
        const divStyle = {
            padding: '15px'
        };
        this.txt_weight = {fontWeight: 500}
        this.handleModalShow = this.handleModalShow.bind(this);
        this.handleModalClose = this.handleModalClose.bind(this);
        this.confirm = this.confirm.bind(this);
        this.state = {
            contact: {},
            action: '',
            showModal: false,
            created_at: '',
            updated_at: '',
            image: null,
            is_published: ''

        };
        this.getUser(user_id);
        this.divStyle = divStyle;
    }

    getUser(contact_id) {
        list('contacts/' + contact_id + '/').then(
            (response) => {
                this.setState({
                    created_at: new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
                    updated_at: new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
                    image: response.data.media ? response.data.media.original_file_name : null
                });
                //this.props.setTitle(response.data.first_name+' '+ response.data.last_name);
                this.setState({contact: response.data})
            });
    }

    handleChange(val, attr) {
        var contact = this.state.contact;

        contact[attr] = val;
        this.setState({contact: contact})
        patch('contacts/' + this.state.contact.id + '/', this.state.contact).then(
            (response) => {
                this.setState({contact: response.data});
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }

    handleModalShow(event, action) {
        var val = event.target.value;
        if (action === 'status') {
            val = parseInt(val);
            this.setState({is_published: val === 1 ? 0 : 1})
        }
        this.setState({action: action});
        this.setState({showModal: true});
    }

    handleModalClose() {
        this.setState({showModal: false});
    }

    confirm() {
        if (this.state.action === 'status') {
            this.state.contact.is_published = this.state.is_published;
            patch('contacts/' + this.state.contact.id + '/', {is_published: this.state.is_published}).then(
                (response) => {
                    this.setState({contact: response.data});
                    this.setState({showModal: false});
                }).catch(error => {
                this.props.sendError(error.response.data);
                this.setState({showModal: false});
            });
        }
    }


    render() {
        const {validated, contact} = this.state;
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={9}>
                        <Form>
                            <Form.Row>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Name</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.first_name + ' ' + contact.last_name}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Religion</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.religion}</Form.Label>
                                </Form.Group>
                            </Form.Row>
                            <hr/>
                            <Form.Row>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Company</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.company ? contact.company.name : ''}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Job Title</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.job_title ? contact.job_title.name : ''}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Department</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.department ? contact.department.name : ''}</Form.Label>
                                </Form.Group>
                            </Form.Row>
                            <hr/>
                            <Form.Row>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Mobile Phone</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.mobile_phone}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Business Phone</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.business_phone}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Skype</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.skype}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Linkedin</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.linkedin}</Form.Label>
                                </Form.Group>
                            </Form.Row>
                            <hr/>
                            <Form.Row>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Address</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.address}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>City</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.city ? contact.city.name : ''}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>State</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.state ? contact.state.name : ''}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Country</Form.Label><br/>
                                    <Form.Label
                                        style={this.txt_weight}>{contact.country ? contact.country.name : ''}</Form.Label>
                                </Form.Group>
                            </Form.Row>
                            <hr/>
                            <Form.Row>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Preferred contact method</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.preferred_contact_method}</Form.Label>
                                </Form.Group>
                                <Form.Group as={Col} md="6" xs="12">
                                    <Form.Label>Primary Status</Form.Label><br/>
                                    <Form.Label style={this.txt_weight}>{contact.is_primary == 0 ? 'No' : 'Yes'}</Form.Label>
                                </Form.Group>
                            </Form.Row>

                        </Form>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <img style={{maxHeight: '220px', maxWidth: '200px'}}
                             src={this.state.image ? MEDIA_URL + this.state.image : MEDIA_URL + 'dummy_image.svg'}/>
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
        this.state = {errors: {}, showError: false, title: 'Account Setting'};
        this.sendError = this.sendError.bind(this);
    }

    sendError(error) {
        if (Object.keys(error).length)
            this.setState({showError: true});

        this.setState({errors: error});
    }

    setMainTitle = (value) => {
        this.setState({title: value});
    };

    render() {
        return (
            <>
                <Notice icon="flaticon-warning kt-font-primary"
                        style={{display: this.state.showError ? 'flex' : 'none'}}>
                    {
                        Object.keys(this.state.errors).map((key, index) => {
                            return this.state.errors[key].map((error, i) => {
                                console.log(error);
                                return <li key={index + i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
                            });
                        })
                    }
                </Notice>
                <div className="row">
                    <div className="col-md-12">
                        <CustomHead
                            beforeCodeTitle={this.state.title}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <button onClick={() => this.props.history.push("/admin/update-account-password")} className="btn btn-brand btn-square btn-icon-sm mr-2">
                                                Update Password
                                            </button>
                                            <button onClick={() => this.props.history.push("/admin/contacts/" + this.props.userProp.contact.id + "/edit")}
                                                  className="btn btn-primary">
                                                <i className="la la-edit"/>
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        >
                            <div className="kt-section">
                                <Detail data={this.props} sendError={this.sendError} setTitle={this.setMainTitle}/>
                            </div>
                        </CustomHead>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(DetailPage);