import React, { Component } from "react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import PerfectScrollbar from "react-perfect-scrollbar";
import { Dropdown } from "react-bootstrap";
import { toAbsoluteUrl } from "../../../_metronic";
import HeaderDropdownToggle from "../../partials/content/CustomDropdowns/HeaderDropdownToggle";
import { ReactComponent as CartNum3Icon } from "../../../_metronic/layout/assets/layout-svg-icons/CartNum3.svg";
import PaypalExpressBtn from 'react-paypal-express-checkout';
import { list, patch, USER_URL, setLocalStorageItem, post} from "../../crud/api";
import { amber, green } from '@material-ui/core/colors';
import { lighten, makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import {
    IconButton, Paper, FormControlLabel, Switch, Snackbar, Checkbox, Toolbar, Tooltip, Typography, SnackbarContent
} from '@material-ui/core';
import {
    Delete as DeleteIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Info as InfoIcon,
    Warning as WarningIcon
} from '@material-ui/icons';

const perfectScrollbarOptions = {
    wheelSpeed: 2,
    wheelPropagation: false
  };
  
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
  
export class Cart extends Component {
  constructor(props) {
    super(props);

    this.state = {
      products : [],
      total: 0,
      quantity:0,
      open:true,
      showDropdown:true,
      message:'Error occur - try again',
      message_type:'error',
    }
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    list("pricing").then((response) => {
      this.setState({ products: response.data });
      this.calculateTotal()
      setLocalStorageItem("credits", response.data);
    });
  }

  setQuantity = (i,op) => {
    let products = this.state.products;
    if(op === '+')
      products[i].credits.cart_val += 1;
    else {
      if(products[i].credits.cart_val > 0)
        products[i].credits.cart_val -= 1;
    }

    if('id' in products[i].credits)
      patch('credits/'+products[i].credits.id+'/', {
        cart_val:products[i].credits.cart_val
      }).then(
        (response) => {
          // this.setState({products:response.data})
      });
    else
      post('credits',{
        cart_val:products[i].credits.cart_val,
        pricing:products[i].id,
      }).then(
        (response) => {
          products[i].credits.id = response.data.id
          this.setState({products:products}, () => {
            this.calculateTotal()
          })
      });

    this.setState({products:products}, () => {
      this.calculateTotal()
    })
  }

  calculateTotal = () => {
    let total = 0, quantity = 0, products = this.state.products;
    products.map(product => {
      total += (product.credits.cart_val * product.price)
      quantity += product.credits.cart_val

    })
    this.setState({total:total, quantity});
  }


  handleCloseSnackbar = (event, reason) => {
    this.setState({open:false});
  };

  toggle(e) {
    if (this.state.dropdownOpen && (e.target === this.dropdown.current || !this.dropdown.current.contains(e.target))) return;
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }


  render() {
    const { bgImage, useSVG, icon, iconType } = this.props;
    const { products, total } = this.state;

    const onSuccess = (payment) => {
      this.setState({
              message_type: 'info',
              message: 'Finalizing! please wait',
              open: true,
              showDropdown:false
            })
      post('paymenthistories_update_payment',payment).then(
        (response) => {
          if(response.data.type == 'success') {
            this.setState({
              message_type: response.data.type,
              message: response.data.message,
            })
            let new_products = [], new_product = {};
            this.state.products.map(product => {
              new_product = {};
              Object.keys(product).map(key => {
                new_product[key] = product[key]
                if(key == 'credits') {
                  new_product[key].value = product[key].cart_val + product[key].value
                  new_product[key].cart_val = 0
                }
              })
              new_products.push(new_product);
            })
            this.setState({products:new_products, total:0, quantity:0})
            this.props.propsData.history.push('/'+USER_URL+'/invoices/'+response.data.transaction_id)
          }
      });
    }

    const onCancel = (data) => {
        // User pressed "cancel" or close Paypal's popup!
        this.setState({
              message_type:'error',
              message: 'Paypal: The payment was cancelled!',
              open: true,
              showDropdown:false
            })
        // You can bind the "data" object's value to your state or props or whatever here, please see below for sample returned data
    }

    const onError = (err) => {
        // The main Paypal's script cannot be loaded or somethings block the loading of that script!
        this.setState({
          message_type:'error',
          message: 'Paypal: '+err.message,
          open: true,
        })
        // Because the Paypal's main script is loaded asynchronously from "https://www.paypalobjects.com/api/checkout.js"
        // => sometimes it may take about 0.5 second for everything to get set, or for the button to appear
    }

    let env = process.env.REACT_APP_PAYMENT_MODE; // you can set here to 'production' for production
    let currency = 'USD'; // or you can set this value from your props or state
     // same as above, this is the total amount (based on currency) to be paid by using Paypal express checkout
    // Document on Paypal's currency code: https://developer.paypal.com/docs/classic/api/currency_codes/

    const client = {
        sandbox:    process.env.REACT_APP_PAYPAL_CLIENT_ID,
        production: process.env.REACT_APP_PAYPAL_CLIENT_ID,
    }
    return (
      <div style={{alignContent:'right'}} className="main">
           <form className="flex-column p-0">
            <div className="kt-mycart">
              <div
                className="kt-mycart__head kt-head"
                style={{ backgroundImage: `url(${toAbsoluteUrl("/media/misc/bg-1.jpg")})` }}
              >
                <div className="kt-mycart__info">
                  <span className="kt-mycart__icon">
                    <i className="flaticon2-shopping-cart-1 kt-font-success" />
                  </span>
                  <h3 className="kt-mycart__title">My Cart</h3>
                </div>
                <div className="kt-mycart__button">
                  <button type="button" className="btn btn-success btn-sm">
                    {this.state.quantity} Items
                  </button>
                </div>
              </div>

                <div className="kt-mycart__body bg-white" style={{fontSize:'15px'}}>

                  {products.map((product, i) => {
                    return <div className="kt-mycart__item">
                      <div className="kt-mycart__container">
                        <div className="kt-mycart__info">
                          <Link className="kt-mycart__title">
                            {product.name}
                          </Link>

                          <span className="kt-mycart__desc">
                            {product.description}
                          </span>

                          <div className="kt-mycart__action">
                            <span className="kt-mycart__price">$ {product.price * product.credits.cart_val}</span>
                            <span className="kt-mycart__text">for</span>
                            <span className="kt-mycart__quantity">{product.credits.cart_val}</span>
                            <span className="btn btn-danger btn-icon" onClick={()=>this.setQuantity(i, '-')} style={{position:"absolute", marginLeft:"110px"}}>
                              −
                            </span>
                            <span className="btn btn-success btn-icon" onClick={()=>this.setQuantity(i, '+')} style={{position:"absolute", marginLeft:"135px"}}>
                              +
                            </span>
                          </div>
                        </div>
                        <div className="kt-mycart__info">
                          <Link className="kt-mycart__title">
                            Existing Credits
                          </Link>

                          <span className="kt-mycart__desc">
                            {product.credits.value ? product.credits.value:0}
                          </span>

                        </div>
                      </div>
                    </div>
                  })}
                </div>

              <div className="kt-mycart__footer bg-white" fontWeight='fontWeightBold'>
                <div className="kt-mycart__section">
                  <div className="kt-mycart__subtitel font-weight-bold" fontWeight='fontWeightBold'>
                    <span>Sub Total</span>
                    <span>Discount</span>
                    <span>Total</span>
                  </div>

                  <div className="kt-mycart__prices">
                    <span>$ {total}</span>
                    <span>$ 0</span>
                    <span className="kt-font-brand">$ {total}</span>
                  </div>
                </div>
                <div className="kt-mycart__button kt-align-right">
                  {total > 0 ?
                    <PaypalExpressBtn env={env} client={client} currency={currency} total={total} onError={onError} onSuccess={onSuccess} onCancel={onCancel} />
                  : ''}

                </div>
              </div>
            </div>
          </form>
      </div>
    );
  }
}

export default Cart;
