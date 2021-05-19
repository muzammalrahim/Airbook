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
        const {part_id, type} = this.props.data.match.params
        const divStyle = {
            padding: '15px'
        };
        this.txt_weight = {fontWeight: 500}
        this.handleModalShow = this.handleModalShow.bind(this);
        this.handleModalClose = this.handleModalClose.bind(this);
        this.confirm = this.confirm.bind(this);
        this.state = {
            type: type,
            part: {},
            action: '',
            showModal: false,
            created_at: '',
            updated_at: '',
            is_published: ''

        };
        this.getPart(part_id);
        this.divStyle = divStyle;
    }

    getPart(part_id) {
        list('parts/' + part_id + '/').then(
            (response) => {
                delete response.data.type;
                this.setState({
                    created_at: new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
                    updated_at: new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
                });
                this.setState({part: response.data})
            });
    }

    handleChange(val, attr) {
        var part = this.state.part;

        part[attr] = val;
        this.setState({part: part})
        patch('parts/' + this.state.part.id + '/', this.state.part).then(
            (response) => {
                this.setState({part: response.data});
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
            this.state.part.is_published = this.state.is_published;
            patch('parts/' + this.state.part.id + '/', {is_published: this.state.is_published}).then(
                (response) => {
                    delete response.data.type;
                    this.setState({part: response.data});
                    this.setState({showModal: false});
                }).catch(error => {
                this.props.sendError(error.response.data);
                this.setState({showModal: false});
            });
        }
    }

    render() {
        const {validated, part} = this.state;
        const username = part.user ? (part.user.contact ? part.user.contact.first_name + ' ' + part.user.contact.last_name : part.user.email) : '';
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={9}>
                        <div className="kt_section__detail">
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">User</div>
                                    <div>{part.user ? <Link target="_blank"
                                                            to={"/contact/" + part.user.id + "/"}>{username}</Link> : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Part Number</div>
                                    <div>{part.part_number ? part.part_number : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Alternate Part Number</div>
                                    <div>{part.alternate_part_number ? part.alternate_part_number : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Condition</div>
                                    <div>{part.condition ? part.condition.name : ''}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Release</div>
                                    <div>{part.release ? part.release.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Quantity</div>
                                    <div>{part.quantity ? part.quantity : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Primary Contact</div>
                                    <div>{part.primary_contact ? part.primary_contact.first_name + " " + part.primary_contact.last_name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Location</div>
                                    <div>{part.location ? part.location.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Unit Measure</div>
                                    <div>{part.unit_measure ? part.unit_measure : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Price</div>
                                    <div>{part.price ? part.price : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Owner</div>
                                    <div>{part.owner ? part.owner.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seller</div>
                                    <div>{part.seller ? part.seller.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Status</div>
                                    <div>
                                      <span onClick={(e) => this.handleModalShow(e, 'status')}
                                               className={this.state.part.is_published === 1 ? 'kt-switch kt-switch--sm kt-switch--success' : 'kt-switch kt-switch--sm kt-switch--danger'}>
                                        <label>
                                          <input
                                              type="checkbox" checked={part.is_published === 1 ? 'defaultChecked' : ''}
                                              value={part.is_published === 1 ? '1' : '0'}
                                              name="is_published"
                                          />
                                          <span/>
                                        </label>
                                      </span>
                                    </div>
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
        this.state = {errors: {}, showError: false};
        this.state.type = type;
        this.sendError = this.sendError.bind(this);
    }

    sendError(error) {
        if (Object.keys(error).length)
            this.setState({showError: true});

        this.setState({errors: error});
    }

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
                            beforeCodeTitle={"Part"}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <Link to={"/admin/part/asset"} className="btn btn-clean btn-icon-sm">
                                                <i className="la la-long-arrow-left"></i>
                                                Back
                                            </Link>
                                            <Link to={"/admin/part/asset/" + this.props.match.params.part_id + "/edit"}
                                                  className="btn btn-primary">
                                                <i className="la la-edit"/>
                                                Edit
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        >
                            <div className="kt-section">
                                <Detail data={this.props} sendError={this.sendError}/>
                            </div>
                        </CustomHead>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(DetailPage);