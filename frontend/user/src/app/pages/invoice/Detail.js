import React from "react";
import CustomHead from "../../partials/content/CustomHeader.js";
import {Button, Modal, Form, Col, Carousel} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL, USER_URL, STATUSES, NO_IMAGE} from "../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import EasyEdit from 'react-easy-edit';
import Notice from "../../partials/content/Notice";
import { getDateWithFormat } from "../../helpers/listing";
import { Preview, print } from 'react-html2pdf';
import "../../../_metronic/_assets/sass/pages/invoices/invoice-2.scss";


export class Detail extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      invoice:{credits:[]}
    }
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (!Object.keys(prevProps.stateData.invoice).length) {
      this.setState({invoice:this.props.stateData.invoice})
    }
  }

  render() {
    let {invoice} = this.state;
    return (
        <div className="kt-invoice-2">
          <div className="kt-invoice__head">
            <div className="kt-invoice__container">
              <div className="kt-invoice__brand">
                <h1 className="kt-invoice__title">INVOICE</h1>
                <div href="#" className="kt-invoice__logo">
                  <a href="#"><img style={{width:'180px', height:'32px'}} src="/static/media/logos/airbook.jpg" /></a>
                  <span className="kt-invoice__desc">
                    <span>Dubai World Central Headquarters Aviation City,</span>
                    <span> Dubai South</span>
                    <span>P.O. Box 712430 Dubai, </span>
                    <span>United Arab Emirates</span>
                  </span>
                </div>
              </div>
              <div className="kt-invoice__items">
                <div className="kt-invoice__item">
                  <span className="kt-invoice__subtitle">Name</span>
                  <span className="kt-invoice__text">{invoice.customer_name}</span>
                </div>
                <div className="kt-invoice__item">
                  <span className="kt-invoice__subtitle">DATA</span>
                  <span className="kt-invoice__text">{invoice.trans_date}</span>
                </div>
                <div className="kt-invoice__item">
                  <span className="kt-invoice__subtitle">INVOICE NO.</span>
                  <span className="kt-invoice__text">{invoice.transaction_id}</span>
                </div>
                <div className="kt-invoice__item">
                  <span className="kt-invoice__subtitle">INVOICE TO.</span>
                  <span className="kt-invoice__text">{invoice.customer_email}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="kt-invoice__body">
            <div className="kt-invoice__container">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Credits</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    
                      {invoice.credits.map(credit => {
                        if(credit.quantity != 0)
                          return <tr>
                                  <td>{credit.type}</td>
                                  <td>{credit.quantity}</td>
                                  <td>{credit.unit_price}</td>
                                  <td>{credit.unit_price * credit.quantity}</td>
                                  </tr>
                      })}
                    
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="kt-invoice__footer">
            <div className="kt-invoice__container">
              <div className="table-responsive">
                <table className="table text-right">
                  <thead>
                    <tr>
                      <th></th>
                      <th></th>
                      <th></th>
                      <th>TOTAL AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="kt-font-danger kt-font-xl kt-font-boldest">{invoice.transaction_amount} USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
    );
  }
}

class DetailPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      title: 'Invoice', 
      invoice: {},
      credits:{aircraft:0, engine:0, apu:0}
    };
    const { invoice_id} = this.props.match.params;
    this.getInvoice(invoice_id);
  }

  getInvoice(invoice_id) {
    list('paymenthistories/'+invoice_id+'/').then(
      (response) => {
          let invoice = response.data;
          invoice.trans_date = new Intl.DateTimeFormat().format(new Date(invoice.trans_date))
          this.setState({invoice : response.data})
    });
  }

  render() {
    return (
      <>
        <div className="row">
          <div className="col-md-12">
            <CustomHead
              beforeCodeTitle={'Invoice detail for customer '+this.state.invoice.customer_name}
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                      <Link to={"/"+USER_URL+"/invoices/"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                       <Link onClick={()=>print('airbook-invoice', 'invoice-template')} className="btn btn-sm btn-brand btn-elevate btn-icon-sm new-record">
                            <i className="la la-download"></i>
                            Download
                        </Link>
                  </div>
                </div>
              </div>
            </div> }
            >
              <div className="kt-section">
                <Preview id={'invoice-template'} >
                  <Detail data={this.props} stateData={this.state} />
                </Preview>
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(DetailPage);