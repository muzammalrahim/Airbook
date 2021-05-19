import React from "react";
import Notice from "../../partials/content/Notice";
import CustomHead from "../../partials/content/CustomHeader.js";
import {Button, Form, Col, Row} from "react-bootstrap";
import {Link, withRouter} from 'react-router-dom'
import {list, post, PERMISSIONS} from "../../crud/api";
import {Paper, Grid, Snackbar, SnackbarContent, IconButton, withStyles} from "@material-ui/core";
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

class Edit extends React.Component {

    constructor(props) {
        super(props);

        const user_id = props.data.userProp ? props.data.userProp.id : null;

        this.state = {
            validated: false,
            user: {},
            showSnackbar: false,
            variant: 'success',
        };

        this.getUser(user_id);
    }

    getUser(user_id) {
        list('users/' + user_id + '/').then(
            (response) => {
                this.setState({user: response.data,})
            });
    }

    handleChange(event) {
        var user = this.state.user;
        var attr = event.target.name;
        var val = event.target.value;

        if (attr == 'current_password' || attr == 'newest_password') {
            if (val != '' && val.length < 8){
                this.setState({
                    showSnackbar: true,
                    variant: "error",
                    snackMessage: "The password field must be at least 8 characters.",
                });
            }else{
                this.setState({showSnackbar: false})
            }

        }

        user[attr] = val;
        this.setState({user: user})
    }

    handleSubmit(event) {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        this.setState({validated: true});
        let user = this.state.user;
        post('changepassword', user).then(
            (response) => {
                this.props.data.history.push("/user/dashboard");
            }).catch(error => {;
            this.setState({
                showSnackbar: true,
                variant: "error",
                snackMessage: error.response.data.error,
            });
        });
    }


    handleCloseSnackbar = () => {
        this.setState({showSnackbar: false})
    }

    render() {
        const {user} = this.state;
        return (
            <div>
                <Form
                    noValidate
                    onSubmit={e => this.handleSubmit(e)}
                >
                    <Form.Group as={Row}>
                        <Form.Label column sm="3"
                                    className="text-sm-right text-left">Current Password</Form.Label>
                        <Col sm="9" lg="6">
                            <Form.Control
                                type="password"
                                placeholder=""
                                name="current_password"
                                onChange={e => this.handleChange(e)}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row}>
                        <Form.Label column sm="3"
                                    className="text-sm-right text-left">New Password</Form.Label>
                        <Col sm="9" lg="6">
                            <Form.Control
                                type="password"
                                placeholder=""
                                name="newest_password"
                                onChange={e => this.handleChange(e)}
                            />
                        </Col>
                    </Form.Group>
                    <Button type="submit" className="btn btn-primary">
                        <i className="la la-save"/>
                        Update
                    </Button>
                    &nbsp;&nbsp;

                    <Link to="/user/account-setting" className="btn btn-danger">
                        <i className="la la-remove"/>
                        Cancel
                    </Link>
                </Form>

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

// const { Formik } = formik;
const buttons = <Link to="/user/account-setting" className="btn btn-clean btn-icon-sm">
    <i className="la la-long-arrow-left"></i>
    Back
</Link>

class EditPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {errors: {}, showError: false};
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
                            beforeCodeTitle="Update Password"
                            jsCode={<div className="kt-portlet__head-toolbar">
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
                                <Edit data={this.props} sendError={this.sendError}/>
                            </div>
                        </CustomHead>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(EditPage);
