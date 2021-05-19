import React from "react";
import CustomHead from "../../partials/content/CustomHeader.js";
import {Button, Modal, Form} from "react-bootstrap";
import { Link, withRouter } from 'react-router-dom'
import {list, patch, MEDIA_URL} from "../../crud/api";
import {Paper, Grid} from "@material-ui/core";
import Notice from "../../partials/content/Notice";



class Detail extends React.Component {

  constructor(props) {
    super(props);
    const { news_id, type } = this.props.data.match.params
    const divStyle = {
      padding : '15px'
    };
    this.txt_weight = {fontWeight:500}
    this.handleModalShow = this.handleModalShow.bind(this);
    this.handleModalClose = this.handleModalClose.bind(this);
    this.confirm = this.confirm.bind(this);
    this.state = {
      type : type,
      news:{id:news_id},
      action:'',
      showModal: false,
      created_at: '',
      updated_at: '',
      image:null,
      is_active: ''

    };
    this.getNews(news_id);
    this.divStyle = divStyle;
  }

  getNews(news_id) {
    list('news/'+news_id+'/').then(
      (response) => {
          let selected_categories =[];
          let categories_ids = [];
          let selected_company ='';
          let selected_region ='';
          let selected_continent ='';
          for (let i in response.data.categories) {
              selected_categories.push(response.data.categories[i].name+', ');
              categories_ids.push(response.data.categories[i].id);
          } 
          response.data.categories = categories_ids;
          response.data.country = response.data.country ? response.data.country.id : null;
          selected_company = response.data.company ? response.data.company.name : '';
          response.data.company = response.data.company ? response.data.company.id : null;
          selected_region = response.data.region ? response.data.region.name : '';
          response.data.region = response.data.region ? response.data.region.id : null;
          selected_continent = response.data.continent ? response.data.continent.name : '';
          response.data.continent = response.data.continent ? response.data.continent.id : null;
          this.setState({created_at : new Intl.DateTimeFormat().format(new Date(response.data.created_at)),
            updated_at : new Intl.DateTimeFormat().format(new Date(response.data.updated_at)),
            image: response.data.media ? response.data.media.original_file_name : null,
            news : response.data, selected_categories:selected_categories, selected_company:selected_company,
            selected_region:selected_region, selected_continent:selected_continent
          });
            this.props.setTitle(response.data.title);
    });
         
  }

  handleChange(val, attr) {
    var news = this.state.news;

    news[attr] = val;
    this.setState({news : news})
    patch('news/'+this.state.news.id+'/', this.state.news).then(
      (response) => {
        this.setState({news : response.data});
    }).catch(error => {
        this.props.sendError(error.response.data);
    });
  }

  handleModalShow(event, action) {
    var val = event.target.value;
    if (action === 'status'){
      val = parseInt(val);
      this.setState({is_active : val === 1 ? 0:1})
    }
    this.setState({action: action});
    this.setState({ showModal: true });
  }

  handleModalClose() {
   this.setState({ showModal: false });
  }

  confirm() {
    if(this.state.action === 'status') {
      this.state.news.is_active = this.state.is_active;
      patch('news/'+this.state.news.id+'/', this.state.news).then(
        (response) => {
          delete response.data.type;
          this.setState({news : response.data});
          this.setState({showModal : false});
      }).catch(error => {
          this.props.sendError(error.response.data);
          this.setState({showModal : false});
      });
    }
  }

  render() {
    const { selected_region, news, selected_categories, selected_continent, selected_company} = this.state;
    return (
        <div>
          <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                    <div className="kt_section__detail">
                        <div className="row mb-4">
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Name</div>
                                <div>{news.title ? news.title : '---'}</div>
                            </div>
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Date</div>
                                <div>{news.date ? news.date : '---'}</div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Category</div>
                                <div>{selected_categories ? selected_categories : '---'}</div>
                            </div>
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Company</div>
                                <div>{selected_company ? selected_company : '---'}</div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Continent</div>
                                <div>{selected_continent? selected_continent : '---'}</div>
                            </div>
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Region</div>
                                <div>{selected_region ? selected_region : '---'}</div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-12">
                                <div className="kt_detail__item_title">Details</div>
                                <div dangerouslySetInnerHTML={{__html: news.details }}></div>
                            </div>
                        </div>
                        <hr/>
                        <div className="row mb-4">
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Date Created</div>
                                <div>{this.state.created_at}</div>
                            </div>
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Date Modified</div>
                                <div>{this.state.updated_at}</div>
                            </div>
                        </div>
                        <div className="row mb-4">
                            <div className="col-md-6 col-12">
                                <div className="kt_detail__item_title">Status</div>
                                <div>
                                    <span onClick={(e) => this.handleModalShow(e,'status')} className={this.state.news.is_active === 1 ? 'kt-switch kt-switch--sm kt-switch--success':'kt-switch kt-switch--sm kt-switch--danger'}>
                                        <label>
                                          <input
                                            type="checkbox" checked={news.is_active === 1 ? 'defaultChecked':''}
                                            value={news.is_active === 1 ? '1' : '0'}
                                            name="is_active"
                                          />
                                          <span />
                                        </label>
                                      </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Grid>
                <Grid item xs={12} md={3}>
                    <img style={{maxHeight:'220px', maxWidth:'200px'}} src={ this.state.image ? MEDIA_URL+this.state.image : MEDIA_URL+'dummy_image.svg' } />
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
    this.state = {errors:{}, showError:false, title: 'News'};
    this.sendError = this.sendError.bind(this);
  }

  sendError(error) {
    if(Object.keys(error).length)
      this.setState({showError:true});

    this.setState({errors:error});
  }
  setMainTitle = (value) => {
    this.setState({title: value});
  };

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
              beforeCodeTitle={this.state.title}
              jsCode =   {<div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                  <div className="dropdown dropdown-inline">
                  <Link to={"/admin/news"} className="btn btn-clean btn-icon-sm">
                        <i className="la la-long-arrow-left"></i>
                        Back
                      </Link>
                      <Link to={"/admin/news/"+this.props.match.params.news_id+"/edit"} className="btn btn-primary">
                        <i className="la la-edit" />
                        Edit
                      </Link>
                  </div>
                </div>
              </div>
            </div> }
            >
              <div className="kt-section">
                <Detail data={this.props} sendError={this.sendError} setTitle={this.setMainTitle} />
              </div>
            </CustomHead>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(DetailPage);