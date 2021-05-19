import React, {useState} from "react";
import {Formik} from "formik";
import {Portlet, PortletBody, PortletFooter, PortletHeader, PortletHeaderToolbar} from "../../partials/content/Portlet";
import {get} from "lodash";
import clsx from "clsx";
import {list, patch} from '../../crud/api';
import {
    Delete as DeleteIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Info as InfoIcon,
    Warning as WarningIcon
} from '@material-ui/icons';
import { amber, green } from '@material-ui/core/colors';
import {
    FormHelperText, Switch, Tab, Tabs, TextField, IconButton, Paper, FormControlLabel, Snackbar, Checkbox, Toolbar, Tooltip, Typography, SnackbarContent
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { lighten, makeStyles } from '@material-ui/core/styles';

const localStorageActiveTabKey = "settingsActiveTab";

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

export default function Settings() {
    const activeTab = localStorage.getItem(localStorageActiveTabKey);
    const [tab, setTab] = useState(activeTab ? +activeTab : 0);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [loadingButtonPreviewStyle, setLoadingButtonPreviewStyle] = useState({
        paddingRight: "2.5rem"
    });
    const [loadingReset, setLoadingReset] = useState(false);
    const [loadingButtonResetStyle, setLoadingButtonResetStyle] = useState({
        paddingRight: "2.5rem"
    });
    const [first_notify, setFirstNotify] = useState(0);
    const [second_notify, setSecondNotify] = useState(0);
    const [third_notify, setThirdNotify] = useState(0);
    const [expired_notify, setExpiredNotify] = useState(0);
    const [open, setOpen] = React.useState(false); // show/hide Snackbar
    const [message, setMessage] = React.useState('Changes applied successfully!'); // set Message
  

    const initialValues = {
        settings: localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : {
            api: {
                enable: false,
                access_key_id: "",
                secret_key_id: ""
            },
            site: {
                title: "",
                deactivate_days: "90"
            },
            payments: {
                enable: false
            }
        }

    };

    React.useEffect(() => {
        getSettings();
      }, []);

    function getSettings() {
        list('settings').then(
          (response) => {
             response.data.map((row,i)=>{
                if(row.key === 'first_notify')
                    setFirstNotify(row.value);
                if(row.key === 'second_notify')
                    setSecondNotify(row.value);
                if(row.key === 'third_notify')
                    setThirdNotify(row.value);
                if(row.key === 'expired_notify')
                    setExpiredNotify(row.value);
             })
        });
    }
    const handleCloseSnackbar = (event, reason) => {
        setOpen(false);
    };
    return (
        <>
            <Formik
                initialValues={initialValues}
                onSubmit={values => {
                    localStorage.setItem('settings',JSON.stringify(get(values, "settings")))
                    patch('settings/bulk_update', {
                        'first_notify'  : first_notify,
                        'second_notify' : second_notify,
                        'third_notify'  : third_notify,
                        'expired_notify': expired_notify,
                    }).then(
                        (response) => {
                        setOpen(true);
                        setMessage(response.data.message);
                        }).catch(error => {
                        this.props.sendError(error.response.data);
                    });
                }}
                onReset={() => {
                }}

            >
                {({values, handleReset, handleSubmit, handleChange, handleBlur}) => (
                    <div className="kt-form kt-form--label-right">
                        <Portlet>
                            <PortletHeader
                                toolbar={
                                    <PortletHeaderToolbar>
                                        <Tabs
                                            component="div"
                                            className="settings-tabs"
                                            value={tab}
                                            onChange={(_, nextTab) => {
                                                setTab(nextTab);
                                                localStorage.setItem(localStorageActiveTabKey, nextTab);
                                            }}
                                        >
                                            <Tab label="General Settings"/>
                                        </Tabs>
                                    </PortletHeaderToolbar>
                                }
                            />
                            {tab === 0 && (
                                <PortletBody>
                                    <div className="kt-section kt-margin-t-30">
                                        <div className="kt-section__body">
                                            {/*Site Title*/}
                                            <div className="form-group row">
                                                <div className="col-lg-4 col-md-12">
                                                        <TextField
                                                            label="Site Title"
                                                            margin="normal"
                                                            onChange={handleChange}
                                                            name="settings.site.title"
                                                            variant="outlined"
                                                            value={get(values, "settings.site.title")}
                                                        />
                                                        <FormHelperText>Set site title</FormHelperText>
                                                </div>
                                            </div>
                                            {/**/}
                                            <div className="form-group row">
                                                <div className="col-lg-4 col-md-12">
                                                        <TextField
                                                            label="First Notification (days)"
                                                            margin="normal"
                                                            onChange={(e) => setFirstNotify(e.target.value) }
                                                            name="settings.site.deactivate_days"
                                                            variant="outlined"
                                                            value={first_notify}
                                                        />
                                                        <FormHelperText>First notification for assets expiration.</FormHelperText>
                                                </div>
                                            </div>
                                            {/**/}
                                            <div className="form-group row">
                                                <div className="col-lg-4 col-md-12">
                                                        <TextField
                                                            label="Second Notification (days)"
                                                            margin="normal"
                                                            onChange={(e) => setSecondNotify(e.target.value) }
                                                            name="settings.site.deactivate_days"
                                                            variant="outlined"
                                                            value={second_notify}
                                                        />
                                                        <FormHelperText>Second notification for assets expiration.</FormHelperText>
                                                </div>
                                            </div>
                                            {/**/}
                                            <div className="form-group row">
                                                <div className="col-lg-4 col-md-12">
                                                        <TextField
                                                            label="Third Notification (days)"
                                                            margin="normal"
                                                            onChange={(e) => setThirdNotify(e.target.value) }
                                                            name="settings.site.deactivate_days"
                                                            variant="outlined"
                                                            value={third_notify}
                                                        />
                                                        <FormHelperText>Third notification for assets expiration.</FormHelperText>
                                                </div>
                                            </div>
                                            {/**/}
                                            <div className="form-group row">
                                                <div className="col-lg-4 col-md-12">
                                                        <TextField
                                                            label="Auto deactivate listings (days)"
                                                            margin="normal"
                                                            onChange={(e) => setExpiredNotify(e.target.value) }
                                                            name="settings.site.deactivate_days"
                                                            variant="outlined"
                                                            value={expired_notify}
                                                        />
                                                        <FormHelperText>Set number of days to auto deactivate listings.</FormHelperText>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </PortletBody>
                                )}
                                <PortletFooter>
                                <div className="kt-padding-30 text-center">
                                    <button
                                        type="button"
                                        onClick={()=> handleSubmit(values)}
                                        style={loadingButtonPreviewStyle}
                                        className={`btn btn-primary btn-elevate kt-login__btn-primary ${clsx(
                                            {
                                                "kt-spinner kt-spinner--right kt-spinner--md kt-spinner--light": loadingPreview
                                            }
                                        )}`}
                                    >
                                    <i className="la la-send"/> Submit
                                    </button>
                                </div>
                                </PortletFooter>
                        </Portlet>
                        <Snackbar
                            anchorOrigin={{
                              vertical: 'top',
                              horizontal: 'right',
                            }}
                            open={open}
                            autoHideDuration={1600000}
                            onClose={handleCloseSnackbar}
                          >
                            <SnackbarContentWrapper
                              onClose={handleCloseSnackbar}
                              variant="success"
                              message={message}
                            />
                        </Snackbar>
                    </div>
                )}
            </Formik>
        </>
    );
}