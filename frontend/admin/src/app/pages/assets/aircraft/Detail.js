import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col} from "react-bootstrap";
import {Link, withRouter} from 'react-router-dom'
import {list, patch, MEDIA_URL, NO_IMAGE, STATUSES, post} from "../../../crud/api";
import {Paper, Grid, Snackbar, SnackbarContent, IconButton, withStyles} from "@material-ui/core";
import Notice from "../../../partials/content/Notice";
import Carousel from 'react-bootstrap/Carousel'
import {
    CheckCircle as CheckCircleIcon, Close as CloseIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon
} from "@material-ui/icons";
import {amber, green} from "@material-ui/core/colors";
import clsx from "clsx";
import PropTypes from "prop-types";

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};
const useStylesSnackbarContent = theme => ({
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
});

function AeroSnackbarContent(props) {
    const {classes, className, message, onClose, variant, ...other} = props;
    const Icon = variantIcon[variant];
    return (
        <SnackbarContent
            className={clsx(classes[variant], className)}
            aria-describedby="client-snackbar"
            message={
                <span id="client-snackbar" className={classes.message}>
              <Icon className={clsx(classes.icon, classes.iconVariant)}/>
                    {message}
            </span>
            }
            action={[
                <IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
                    <CloseIcon className={classes.icon}/>
                </IconButton>,
            ]}
            {...other}
        />
    );
}

AeroSnackbarContent.propTypes = {
    className: PropTypes.string,
    message: PropTypes.string,
    onClose: PropTypes.func,
    variant: PropTypes.oneOf(['error', 'info', 'success', 'warning']).isRequired,
};

const SnackbarContentWrapper = withStyles(useStylesSnackbarContent)(AeroSnackbarContent);

class Detail extends React.Component {

    constructor(props) {
        super(props);
        const {aircraft_id, type} = this.props.data.match.params
        const divStyle = {
            padding: '15px'
        };
        this.txt_weight = {fontWeight: 500}
        this.handleModalClose = this.handleModalClose.bind(this);
        this.state = {
            type: type,
            aircraft: {},
            action: '',
            showModal: false,
            showSnackbar: false,
            variant: 'success',
            created_at: '',
            updated_at: '',
            image: [],
            is_published: ''

        };
        this.getAircraft(aircraft_id);
        this.divStyle = divStyle;
    }

    getAircraft(aircraft_id) {
        list('aircrafts/' + aircraft_id + '/').then(
            (response) => {
                // delete response.data.type;
                if(response.data.media && response.data.media !== null){
                    response.data.media.map((img, i) => {
                        const searchFor = img.path+'/';
                        const fileName = img.original_file_name.replace(searchFor,img.path+'/thumb_');
                        var imageDummy = new Image();
                        let src = MEDIA_URL + img.original_file_name;
                        try{
                            imageDummy.onload = () => {
                                img.thumb_file = fileName;
                            }
                            imageDummy.onerror = () => {
                                img.thumb_file = img.original_file_name;
                            }
                            imageDummy.src = MEDIA_URL+fileName;
                        }catch (e) {

                        }
                        return img;
                    })
                }
                this.setState({
                    created_at: new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
                    updated_at: new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
                    image: response.data.media ? response.data.media : null
                });

                this.setState({aircraft: response.data})
            });
    }

    handleChange(val, attr) {
        var aircraft = this.state.aircraft;

        aircraft[attr] = val;
        this.setState({aircraft: aircraft})
        patch('aircrafts/' + this.state.aircraft.id + '/', this.state.aircraft).then(
            (response) => {
                this.setState({aircraft: response.data});
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }

    handleModalClose(event) {
        if (event === 'send') {
            this.setState({showSpinner: true});
            let data = this.state.statusData;
            data['status_reason'] = this.state.mailText;
            this.sendMail(data);
        } else {
            this.setState({showModal: false});
        }
    }

    changeStatus(event, index) {
        var aircraft = this.state.aircraft;
        let data = {isactivestatus: event.target.value, model: 'AbAircrafts', id: aircraft.id};
        this.setState({statusData: data});
        if (data.isactivestatus === 'Revise' || data.isactivestatus === 'Rejected') {
            this.setState({showModal: true});
        } else {
            this.sendMail(data);
            this.setState({showSpinner: true})
        }

    }

    sendMail(data) {
        post('assets/update_status', data).then(
            (response) => {
                this.setState({
                    showSnackbar: true,
                    variant: "success",
                    snackMessage: "Mail successfully sent.",
                    showModal: false,
                    showSpinner: false
                });
            }).catch(error => {
            this.setState({
                showSnackbar: true,
                variant: "error",
                snackMessage: "An error occurred.",
                showModal: false,
                showSpinner: false
            });
        });
    }

    handleCloseSnackbar = () => {
        this.setState({showSnackbar: false})
    }

    render() {
        const {validated, aircraft} = this.state;
        const username = aircraft.user ? (aircraft.user.contact ? aircraft.user.contact.first_name + ' ' + aircraft.user.contact.last_name : aircraft.user.email) : '';
        let defaultValue = '';
        let disabledValue = '';
        return (
            <div>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={9}>
                        <div className="kt_section__detail">
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">User</div>
                                    <div>{aircraft.user ? <Link target="_blank" to={"/contact/" + aircraft.user.id + "/"}>{username}</Link> : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Category</div>
                                    <div>{aircraft.category ? aircraft.category.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Manufacturer</div>
                                    <div>{aircraft.manufacturer ? aircraft.manufacturer.name : ''}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Type</div>
                                    <div>{aircraft.type ? aircraft.type.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Model</div>
                                    <div>{aircraft.model ? aircraft.model.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">MSN</div>
                                    <div>{aircraft.msn ? aircraft.msn : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">YOM</div>
                                    <div>{aircraft.yom ? aircraft.yom : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Configuration</div>
                                    <div>{aircraft.configuration ? aircraft.configuration.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seating</div>
                                    <div>Economy
                                        (Y) {aircraft.seating_economy ? aircraft.seating_economy : 0}, Business
                                        (C) {aircraft.seating_business ? aircraft.seating_business : 0}, First
                                        (F) {aircraft.seating_first_class ? aircraft.seating_first_class : 0}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Status</div>
                                    <div>{aircraft.status ? aircraft.status : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Compliance</div>
                                    <div>{aircraft.compliance ? aircraft.compliance : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">TSN</div>
                                    <div>{aircraft.tsn ? aircraft.tsn : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">CSN</div>
                                    <div>{aircraft.csn ? aircraft.csn : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">MTOW Kg</div>
                                    <div>{aircraft.mtow ? aircraft.mtow : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">MLGW Kg</div>
                                    <div>{aircraft.mlgw ? aircraft.mlgw : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Last C Check</div>
                                    <div>{aircraft.last_c_check ? new Intl.DateTimeFormat().format(new Date(aircraft.last_c_check)) : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Registration Number</div>
                                    <div>{aircraft.registration_number ? aircraft.registration_number : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Registration Country</div>
                                    <div>{aircraft.registration_country ? aircraft.registration_country.name : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Engine Manufacturer</div>
                                    <div>{aircraft.engine_manufacturer ? aircraft.engine_manufacturer.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Engine Type</div>
                                    <div>{aircraft.engine_type ? aircraft.engine_type.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Engine Model</div>
                                    <div>{aircraft.engine_model ? aircraft.engine_model.name : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Offer For</div>
                                    <div>{aircraft.offer_for ? aircraft.offer_for : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Price</div>
                                    <div>{aircraft.price ? aircraft.price : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Availability</div>
                                    <div>{aircraft.availability ? new Intl.DateTimeFormat().format(new Date(aircraft.availability)) : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Location</div>
                                    <div>{aircraft.current_location ? aircraft.current_location.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Primary Contact</div>
                                    <div>{aircraft.primary_contact ? aircraft.primary_contact.first_name + ' ' + aircraft.primary_contact.last_name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Owner</div>
                                    <div>{aircraft.owner ? aircraft.owner.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seller</div>
                                    <div>{aircraft.seller ? aircraft.seller.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Manager</div>
                                    <div>{aircraft.manager ? aircraft.manager.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Previous Operator</div>
                                    <div>{aircraft.previous_operator ? aircraft.previous_operator.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Operator</div>
                                    <div>{aircraft.current_operator ? aircraft.current_operator.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Additional details</div>
                                    <div>{aircraft.description ? aircraft.description : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Views</div>
                                    <div>{aircraft.views ? aircraft.views : 0}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Likes</div>
                                    <div>{aircraft.likes ? aircraft.likes : 0}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Promote Status</div>
                                    <div>{aircraft.is_featured ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Active Status</div>
                                    <div className={"d-flex align-items-center"} style={{width: "230px;"}}>
                                        <Form.Control className="btn-danger approvals"
                                                      onChange={(e) => this.changeStatus(e, aircraft)} as="select"
                                                      style={{width: "200px"}}>
                                            {
                                                STATUSES.map((val, i) => {
                                                    if (val.value === aircraft.isactivestatus)
                                                        defaultValue = 'selected'
                                                    else
                                                        defaultValue = '';
                                                    if (val.value === 'Expired')
                                                        disabledValue = 'disabled'
                                                    else
                                                        disabledValue = '';
                                                    return <option disabled={disabledValue} selected={defaultValue}
                                                                   key={i}>{val.label}</option>
                                                })
                                            }
                                        </Form.Control>
                                        {this.state.showSpinner === true && !this.state.showModal &&
                                        <div className="kt-spinner kt-spinner--md kt-spinner--brand ml-2"></div>
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Published Status</div>
                                    <div>{aircraft.is_published ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Date Created</div>
                                    <div>{this.state.created_at ? this.state.created_at : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Date Modified</div>
                                    <div>{this.state.updated_at ? this.state.updated_at : '-----'}</div>
                                </div>
                            </div>
                        </div>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        {this.state.image !== '' && this.state.image.length > 0  ?<Carousel>
                            {this.state.image && this.state.image.map((image, index) => {
                                return <Carousel.Item key={index}>
                                    <img
                                        className="d-block w-100"
                                        src={MEDIA_URL+image.original_file_name}
                                    />
                                </Carousel.Item>
                            })
                            }
                        </Carousel>:
                         <img className="d-block w-100" src={NO_IMAGE} />
                        }
                    </Grid>
                </Grid>

                <Modal show={this.state.showModal} onHide={this.handleModalClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Send mail
                            to {this.state.statusData ? this.state.statusData.isactivestatus : ''}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <textarea rows="5" onChange={(e) => this.setState({mailText: e.target.value})}
                                  style={{display: 'block', width: "100%"}}/>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="success"
                                className={this.state.showSpinner === true ? "kt-spinner kt-spinner--right kt-spinner--sm kt-spinner--light" : ''}
                                onClick={() => this.handleModalClose('send')}>
                            Send
                        </Button>
                        <Button variant="danger" onClick={this.handleModalClose}>
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Snackbar
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    open={this.state.showSnackbar}
                    autoHideDuration={1600000}
                    onClose={this.handleCloseSnackbar}
                >
                    <SnackbarContentWrapper
                        onClose={this.handleCloseSnackbar}
                        variant={this.state.variant}
                        message={this.state.snackMessage}
                    />
                </Snackbar>
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
                                return <li key={index + i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
                            });
                        })
                    }
                </Notice>
                <div className="row">
                    <div className="col-md-12">
                        <CustomHead
                            beforeCodeTitle={"Aircraft"}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <Link to={"/admin/aircraft/asset"} className="btn btn-clean btn-icon-sm">
                                                <i className="la la-long-arrow-left"></i>
                                                Back
                                            </Link>

                                            <Link
                                                to={"/admin/aircraft/asset/" + this.props.match.params.aircraft_id + "/edit"}
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