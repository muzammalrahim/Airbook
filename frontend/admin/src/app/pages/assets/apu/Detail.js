import React from "react";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col} from "react-bootstrap";
import {Link, withRouter} from 'react-router-dom'
import {list, patch, MEDIA_URL, NO_IMAGE, post, STATUSES} from "../../../crud/api";
import {Paper, Grid, SnackbarContent, IconButton, withStyles, Snackbar} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../../partials/content/Notice";
import Carousel from 'react-bootstrap/Carousel';
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
        const {apu_id, type} = this.props.data.match.params
        const divStyle = {
            padding: '15px'
        };
        this.txt_weight = {fontWeight: 500}
        this.handleModalClose = this.handleModalClose.bind(this);
        this.state = {
            type: type,
            apu: {},
            action: '',
            showModal: false,
            showSnackbar: false,
            variant: 'success',
            created_at: '',
            updated_at: '',
            image: [],
            is_published: ''

        };
        this.getApu(apu_id);
        this.divStyle = divStyle;
    }

    getApu(apu_id) {
        list('apus/' + apu_id + '/').then(
            (response) => {
                // delete response.data.type;
                this.setState({
                    created_at: new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
                    updated_at: new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
                    image: response.data.media ? response.data.media : null
                });
                this.setState({apu: response.data})
            });
    }

    handleChange(val, attr) {
        var apu = this.state.apu;

        apu[attr] = val;
        this.setState({apu: apu})
        patch('apus/' + this.state.apu.id + '/', this.state.apu).then(
            (response) => {
                this.setState({apu: response.data});
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
        var apu = this.state.apu;
        let data = {isactivestatus: event.target.value, model: 'AbApus', id: apu.id};
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
        const {validated, apu} = this.state;
        const username = apu.user ? (apu.user.contact ? apu.user.contact.first_name + ' ' + apu.user.contact.last_name : apu.user.email) : '';
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
                                    <div>{apu.user ? <Link target="_blank" to={"/contact/" + apu.user.id + "/"}>{username}</Link> : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Category</div>
                                    <div>{apu.category ? apu.category.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Manfacturer</div>
                                    <div>{apu.manufacturer ? apu.manufacturer.name : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Type</div>
                                    <div>{apu.type ? apu.type.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Model</div>
                                    <div>{apu.model ? apu.model.name : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Serial Number</div>
                                    <div>{apu.serial_number ? apu.serial_number : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Part Number</div>
                                    <div>{apu.part_number ? apu.part_number : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Cycles Remaining (CR)</div>
                                    <div>{apu.cycle_remaining ? apu.cycle_remaining : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Status</div>
                                    <div>{apu.status ? apu.status : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Thrust Rating</div>
                                    <div>{apu.thrust_rating ? apu.thrust_rating : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">LSV Description</div>
                                    <div>{apu.lsv_description ? apu.lsv_description : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Thrust Rating</div>
                                    <div>{apu.thrust_rating ? apu.thrust_rating : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Offer For</div>
                                    <div>{apu.offer_for ? apu.offer_for : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Availablility</div>
                                    <div>{apu.availability ? new Intl.DateTimeFormat().format(new Date(apu.availability)) : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Current Location</div>
                                    <div>{apu.current_location ? apu.current_location.name : '---'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Primary Contact</div>
                                    <div>{apu.primary_contact ? apu.primary_contact.first_name + ' ' + apu.primary_contact.last_name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Owner</div>
                                    <div>{apu.owner ? apu.owner.name : '-----'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Seller</div>
                                    <div>{apu.seller ? apu.seller.name : '-----'}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Additional details</div>
                                    <div>{apu.description ? apu.description : '-----'}</div>
                                </div>
                            </div>
                            <hr/>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Views</div>
                                    <div>{apu.views ? apu.views : 0}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Likes</div>
                                    <div>{apu.likes ? apu.likes : 0}</div>
                                </div>
                            </div>
                            <div className="row mb-4">
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Promote Status</div>
                                    <div>{apu.is_featured ? 'Yes' : 'No'}</div>
                                </div>
                                <div className="col-md-6 col-12">
                                    <div className="kt_detail__item_title">Active Status</div>
                                    <div className={"d-flex align-items-center"} style={{width: "230px;"}}>
                                      <Form.Control className="btn-danger approvals" onChange={(e) => this.changeStatus(e, apu)} as="select"
                                                  style={{width: "200px"}}>
                                        {
                                            STATUSES.map((val, i) => {
                                                if (val.value === apu.isactivestatus)
                                                    defaultValue = 'selected'
                                                else
                                                    defaultValue = '';
                                                if (val.value === 'Expired')
                                                        disabledValue = 'disabled'
                                                    else
                                                        disabledValue = '';
                                                return <option disabled={disabledValue} selected={defaultValue} key={i}>{val.label}</option>
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
                                    <div>{apu.is_published ? apu.is_published : '-----'}</div>
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
                                        src={MEDIA_URL + image.original_file_name}
                                    />
                                </Carousel.Item>
                            })
                            }
                        </Carousel> :
                         <img
                                        className="d-block w-100"
                                        src={NO_IMAGE}
                                        alt="First slide"
                                    />}
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
                                console.log(error);
                                return <li key={index + i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
                            });
                        })
                    }
                </Notice>
                <div className="row">
                    <div className="col-md-12">
                        <CustomHead
                            beforeCodeTitle={"Apu"}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <Link to={"/admin/apu/asset"} className="btn btn-clean btn-icon-sm">
                                                <i className="la la-long-arrow-left"></i>
                                                Back
                                            </Link>
                                            <Link to={"/admin/apu/asset/" + this.props.match.params.apu_id + "/edit"}
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