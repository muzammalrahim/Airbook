import React from "react";
import { Button, Form, Col, Tab, Tabs, Modal, Navbar, Nav} from "react-bootstrap";
import RUG, {DragArea, Card} from 'react-upload-gallery'
import {list, del, post, getToken, MEDIA_URL, API_URL, patch, USER_URL} from "../crud/api";
import Gallery from 'react-grid-gallery';
import Select from 'react-select';
import DeleteForeverOutlinedIcon from '@material-ui/icons/DeleteForeverOutlined';
import Grid from "@material-ui/core/Grid";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { amber, green } from '@material-ui/core/colors';
import clsx from "clsx";
import PropTypes from 'prop-types';
import {
    IconButton, Paper, FormControlLabel, Switch, Snackbar, Checkbox, Toolbar, Tooltip, Typography, SnackbarContent
} from '@material-ui/core';
import { lighten, makeStyles } from '@material-ui/core/styles';
import {
    Delete as DeleteIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Info as InfoIcon,
    Warning as WarningIcon
} from '@material-ui/icons';


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

export default class MediaLibrary extends React.Component {
  	constructor(props) {
    	super(props);

	   this.state = { 
	      selected_media_tab:(this.props.showLibrary ? 'my_library':'airbook_library'),
	      selected_sort_col:'',
	      selected_sort_type:'',
	      galleryModal:false,
	      user_media:[],
	      airbook_media:[],
		   loading: false,
	      meta_name:'',
		  cropModal: false,
		  cropImageUrl: null,
		  cropImageName: null,
		  crop: {
			  unit: 'px',
			  width: 400,
			  aspect: 4 / 3
		  },
		  showMessage:false,
		  messageType:'error',
		  message:'Error occured while uploading image'
	    };

	   if(this.props.modal === false){
	   	this.getMedia('App\\User');
	   	this.getMedia('Global');
	   }
	}

	galleryModalOpener() {
		this.setState({ galleryModal: true });
		if(this.props.showLibrary) {
			if(!this.state.user_media.length)
			  this.getMedia('App\\User');
			else 
				this.makeGallery(this.state.user_media);
		}

		if(!this.state.airbook_media.length)
			this.getMedia('Global');
		else 
			this.makeGallery(this.state.airbook_media);

	}

	getMedia(media_type, search=null) {
	    let filter = {mediable_type:media_type, mediableId:this.props.user}
	    if(search != null)
	      filter = {...filter, ...search }

	    list('medias', filter).then(
	        (response) => {
	        	let media_type = 'user';
	        	if(filter.mediable_type === 'Global')
	        		media_type = 'airbook';

	          	this.setState({[media_type+'_media'] : this.makeGallery(response.data) ,})
	    		this.isAnyImageSelected();
	    });
	}

	makeGallery(data) {
		let selected_images = this.props.selected_images;
		let selected_img_names = [];
		selected_images.map((val, i ) => {
		    selected_img_names.push(val.original_file_name);
		})
		data.map((val, i) => {
			const searchFor = val.path+'/';
			const fileName = val.original_file_name.replace(searchFor,val.path+'/thumb_');
			var imageDummy = new Image();
			try{
				imageDummy.onload = () => {
					data[i].thumbnail = MEDIA_URL+fileName;
				}
				imageDummy.onerror = () => {
					data[i].thumbnail = MEDIA_URL+val.original_file_name;
				}
				imageDummy.src = MEDIA_URL+fileName;
			}catch (e) {

			}
		  data[i].src = MEDIA_URL+val.original_file_name;
		  data[i].thumbnailWidth = 150;
		  data[i].thumbnailHeight = 150;
		  if(val.path !== 'global')
		  	data[i].customOverlay= <div><div className="none-crop-area" onClick={() => this.selectImage(i,'user')}></div><div className="card-crop-overlay" onClick={() => this.onImageClick(val)}>Crop Image</div></div>;
		  else if(val.path !== 'App\\User')
		  	data[i].customOverlay= <div className="image-area" onClick={() => this.selectImage(i,'airbook')}></div>;
		  else if(selected_img_names.indexOf(data[i].original_file_name) > -1) 
		    data[i].isSelected = true;
		  else
		    data[i].isSelected = false;
		})
		return data
	}

	searchMedia(val=null) {
	    if(val === null)
	      val = this.state.search;
	    let selected_sort_type = this.state.selected_sort_type;
	    let selected_sort_col = this.state.selected_sort_col;
	    let media_type = this.state.selected_media_tab === 'my_library' ? 'App\\User' : 'Global';
	    let filters = {search:val};
	    if(selected_sort_col !== '') {
	      if(selected_sort_type === '-')
	        filters.ordering = selected_sort_type.value+selected_sort_col.value;
	      else
	        filters.ordering = selected_sort_col.value;
	    }
	    this.getMedia(media_type, filters);
	}

	selectImage(index, type) {
		let images = this.state[type+'_media'];
			images[index].isSelected = !images[index].isSelected;
			this.setState({[type+'_media']:images});
			this.isAnyImageSelected();
			this.insertSelectedImages();
	}

	isAnyImageSelected() {
	    let isAnySelected = false;
	    let images = this.state.user_media;
	    images.map((val, i) => { 
	      if(val.isSelected === true){
	        isAnySelected = true;
	      }
	    })
	    images = this.state.airbook_media;
	    images.map((val, i) => { 
	      if(val.isSelected === true){
	        isAnySelected = true;
	      }
	    })
	    this.setState({isAnySelected:isAnySelected});
	}

	isUserSelectedImages(){
  		let isAnySelected = false;
	    let images = this.state.user_media;
	    images.map((val, i) => {
	      if(val.isSelected === true){
	        isAnySelected = true;
	      }
	    })
		return isAnySelected;
	}

	deletePhotos(type) {
	    let media = this.state[type+'_media'];
	    let selected_images = this.props.selected_images;
	    let selected_img_ids = [];
	    let selected_img_names = [];
	    media = media.filter((val) => {
	      if(val.isSelected) {
	        selected_img_ids.push(val.id);
	        selected_img_names.push(val.original_file_name);
	        return false
	      } else return true
	    })
	    selected_images = selected_images.filter((val) => {
	      if(selected_img_names.indexOf(val.original_file_name) > -1) 
	        return false;
	      else return true;
	    })
	    del('medias/'+selected_img_ids[0]+'/', {ids:selected_img_ids}).then(
	        (response) => {
	          	this.setState({[type+'_media']:media, isAnySelected:false})
	          	if(this.props.showLibrary)
	    			this.props.insertImages(selected_images)
	    });
	}

	cancelSelection() {
	    let selected_img_names = [];
	    this.props.selected_images.map((val, i) => {
	        selected_img_names.push(val.original_file_name);
	    })
	    let user_media = this.state.user_media;
	    user_media.map((val, i) => {
	      if(selected_img_names.indexOf(val.original_file_name) > -1) 
	        user_media[i].isSelected = true;
	      else 
	        user_media[i].isSelected = false;
	    })

	    this.setState({user_media:user_media, galleryModal:false});
	}

	insertSelectedImages() {
	    let user_media = this.state.user_media;
	    let selected_images = [];
	    user_media.map((value, index ) => {
	      if(value.isSelected) {
	        let image = {};
	        Object.keys(value).map((val, i) => {
	          image[val] = value[val];
	        })
	        image.customOverlay= <Grid item xs={8}><DeleteForeverOutlinedIcon /></Grid>;
	        image.isSelected = false;
	        selected_images.push(image);
	      }
	    })

	    let airbook_media = this.state.airbook_media;
	    airbook_media.map((value, index ) => {
	      if(value.isSelected) {
	        let image = {};
	        Object.keys(value).map((val, i) => {
	          image[val] = value[val];
	        })
	        image.customOverlay= <Grid item xs={8}><DeleteForeverOutlinedIcon /></Grid>;
	        image.isSelected = false;
	        selected_images.push(image);
	      }
	    })
	    this.setState({galleryModal:false});
	    if(this.props.showLibrary)
	    	this.props.insertImages(selected_images)
	}

	onImageClick(image) {
  		const searchFor = image.path+'/';
  		const fileName = image?.original_file_name?.replace(searchFor,'');
  		this.setState({cropModal: true, cropImageUrl: MEDIA_URL+image.original_file_name, cropImageName: fileName});
	}

	onImageUpload(image) {
		if(this.props.showLibrary) {
    		this.getMedia('App\\User');
    		document.getElementById('gallery-tabs-tab-my_library').click();
		}
    	else {
    		document.getElementById('gallery-tabs-tab-airbook_library').click();
    		this.getMedia('Global');
    	}
	}

	// If you setState the crop in here you should return false.
	  onImageLoaded = image => {
		this.imageRef = image;
	  };

	  onCropComplete = crop => {
		this.makeClientCrop(crop);
	  };

	  onCropChange = (crop, percentCrop) => {
		// You could also use percentCrop:
		// this.setState({ crop: percentCrop });
		this.setState({ crop });
	  };

	  async makeClientCrop(crop) {
		if (this.imageRef && crop.width && crop.height) {
		  const croppedImageUrl = await this.getCroppedImg(
			this.imageRef,
			crop,
			'thumb_'+this.state.cropImageName
		  );
		  this.setState({ croppedImageUrl });
		}
	  }

	  getCroppedImg(image, crop, fileName) {
		const canvas = document.createElement('canvas');
		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;
		canvas.width = crop.width;
		canvas.height = crop.height;
		const ctx = canvas.getContext('2d');

		ctx.drawImage(
		  image,
		  crop.x * scaleX,
		  crop.y * scaleY,
		  crop.width * scaleX,
		  crop.height * scaleY,
		  0,
		  0,
		  crop.width,
		  crop.height
		);

		const base64Image = canvas.toDataURL("image/jpeg");
    	return base64Image;

		/*return new Promise((resolve, reject) => {
		  canvas.toBlob(blob => {
			if (!blob) {
			  //reject(new Error('Canvas is empty'));
			  console.error('Canvas is empty');
			  return;
			}
			blob.name = fileName;
			window.URL.revokeObjectURL(this.fileUrl);
			this.fileUrl = window.URL.createObjectURL(blob);
			resolve(this.fileUrl);
		  }, 'image/jpeg');
		});*/
	  }

	  uploadCroppedImage(){
	  	this.setState({loading: true});
	  	if(this.state.croppedImageUrl){
	  		let data = {
	  			meta_name:this.state.meta_name,
				gallery : this.props.showLibrary ? 'user':'airbook',
				user:this.props.user,
				file: 'data-orig:'+this.state.cropImageName+';'+this.state.croppedImageUrl,
				upload_type: "crop"
	  		};
            post('medias', data).then(
                (response) => {
                    document.getElementById('gallery-tabs-tab-airbook_library').click();
                    this.setState({user_media:[]})
                    this.onImageUpload(response);
                    this.setState({loading: false, cropModal: false, cropImageUrl: null, cropImageName: null, croppedImageUrl: null});
                }).catch(error => {

				});
		}
	  }

	render() {
		const { selected_images, selected_media_tab, selected_sort_col, selected_sort_type, crop, croppedImageUrl, cropImageUrl, loading} = this.state;
		return (
		<div>
			{this.props.modal ?
            <Modal
              size="xl"
              show={this.state.galleryModal}
              onHide={() => this.setState({ galleryModal: false })}
              aria-labelledby="example-modal-sizes-title-lg"
            >
              <Modal.Header closeButton>
                <Modal.Title id="example-modal-sizes-title-lg">Media</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                  <Navbar bg="light" style={{marginBottom:0}}>
                    <Tab.Container id="gallery-tabs" defaultActiveKey={selected_media_tab}>
                      <Form.Row style={{display:'block', width:'100%'}}>
                        <Col sm={12}>
                          <Nav variant="pills">
                            <Nav.Item>
                              <Nav.Link onClick={() => this.setState({selected_media_tab:'upload'})} eventKey="upload">Upload</Nav.Link>
                            </Nav.Item>
                            { this.props.showLibrary ?
                            <Nav.Item>
                              <Nav.Link onClick={() => this.setState({selected_media_tab:'my_library'})} eventKey="my_library">My Library</Nav.Link>
                            </Nav.Item> : ''}
                            <Nav.Item>
                              <Nav.Link onClick={() => this.setState({selected_media_tab:'airbook_library'})} eventKey="airbook_library">Airbook Gallery</Nav.Link>
                            </Nav.Item>
                          </Nav>
                          <Tab.Content>
                            <Tab.Pane eventKey="upload">
                            	{!this.props.showLibrary ?
            					<Form.Row>
	              					<Form.Group as={Col} xs="12">
	                            	 <Form.Control
						                  required
						                  type="text"
						                  placeholder="add suffix"
						                  onChange={(e) => this.setState({meta_name:e.target.value})}
						                />
						            </Form.Group>    
						            <br/>
            					</Form.Row>	
					            :''}
					            {this.props.showLibrary || this.state.meta_name !== '' ?
                              <RUG
                                  action={API_URL+"medias"}
                                  headers={{'Authorization': 'Token '+getToken()}}
                                  send={
                                  	this.props.user !== undefined && this.props.user != '' ?
                                  	{meta_name:this.state.meta_name, gallery : this.props.showLibrary ? 'user':'airbook', user:this.props.user}
                                  	:
                                  	{meta_name:this.state.meta_name, gallery : this.props.showLibrary ? 'user':'airbook'}
                                  }
                                  source={response => MEDIA_URL+response.original_file_name}
                                  onSuccess={(image) => this.onImageUpload(image)}
                                  onClick={(image) => this.onImageClick(image)}
	                              onError={(status, response, image) => {
	                              	console.log(status);
	                              	if(status.image.file.size / (1000*1000) > 20) {
	                              		this.setState({
	                              			message:'Image should not be greater than 20 MB',
	                              			showMessage:true
	                              		});
	                              	} else 
	                              		this.setState({showMessage:true});

	                              }}
                                />: '' }
                            </Tab.Pane>
                            { this.props.showLibrary ?
                            <Tab.Pane eventKey="my_library">
                              <Form.Row>
                                <Col xl={9} md={8} sm={8} xs={12}>
                                  <Gallery 
                                    enableImageSelection={true} images={this.state.user_media}
                                    onSelectImage={(e)=>this.selectImage(e, 'user')}  enableLightbox={false}
                                    rowHeight={150}
                                    />
                                </Col>
                                <Col xl={3} md={4} sm={4} xs={12}>
                                  <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                      <Select
                                        value={selected_sort_col}
                                        onChange={(val) =>{this.setState({selected_sort_col:val}); this.searchMedia()}}
                                        options={[
                                          {'label':'','value':''},
                                          {'label':'Name','value':'meta_name'},
                                          {'label':'Created At','value':'created_at'},
                                        ]}
                                      />
                                  </Form.Group>
                                  <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                      <Select
                                        value={selected_sort_type}
                                        onChange={(val) => {this.setState({selected_sort_type:val}); this.searchMedia()}}
                                        options={[
                                          {'label':'','value':''},
                                          {'label':'Ascending','value':'+'},
                                          {'label':'Descending','value':'-'},
                                        ]}
                                      />
                                  </Form.Group>
                                  {this.state.isAnySelected ? 
                                   <Button className="btn btn-danger btn-sm" onClick={(e) => this.deletePhotos('user')} >Delete Photo</Button>: '' }
                                </Col>
                              </Form.Row>
                            </Tab.Pane>:''}
                            <Tab.Pane eventKey="airbook_library">
                              <Form.Row>
                                <Col xl={9} md={8} sm={8} xs={12}>
                                  <Gallery 
                                    enableImageSelection={true} images={this.state.airbook_media}
                                    onSelectImage={(e)=>this.selectImage(e, 'airbook')} enableLightbox={false}
                                    rowHeight={150}
                                    />
                                </Col>
                                <Col xl={3} md={4} sm={4} xs={12}>
                                  <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                      <Select
                                        value={selected_sort_col}
                                        onChange={(val) =>{this.setState({selected_sort_col:val}); this.searchMedia()}}
                                        options={[
                                          {'label':'','value':''},
                                          {'label':'Name','value':'meta_name'},
                                          {'label':'Created At','value':'created_at'},
                                        ]}
                                      />
                                  </Form.Group>
                                  <Form.Group>
                                    <Form.Label>Sort By</Form.Label>
                                      <Select
                                        value={selected_sort_type}
                                        onChange={(val) => {this.setState({selected_sort_type:val}); this.searchMedia()}}
                                        options={[
                                          {'label':'','value':''},
                                          {'label':'Ascending','value':'+'},
                                          {'label':'Descending','value':'-'},
                                        ]}
                                      />
                                  </Form.Group>
                                  {this.state.isAnySelected && !this.props.showLibrary ? 
                                   <Button className="btn btn-danger btn-sm" onClick={(e) => this.deletePhotos('airbook')} >Delete Photo</Button>: '' }
                                </Col>
                              </Form.Row>
                            </Tab.Pane>
                            {selected_media_tab !== 'upload' ?
                              <Form.Row>
                                <Col xs={12}>
                                  <Button onClick={(e)=>this.insertSelectedImages()} className="btn btn-primary btn-sm">Insert</Button>
                                  &nbsp;&nbsp;&nbsp;
                                  <Button onClick={()=>this.cancelSelection()} className="btn btn-danger btn-sm">Cancel</Button>
                                </Col>
                              </Form.Row>
                              :''
                            }

                          </Tab.Content>
                        </Col>
                      </Form.Row>
                    </Tab.Container>
                  </Navbar>

              </Modal.Body>
            </Modal>:
              <Navbar style={{marginBottom:0, padding:0}}>
                <Tab.Container id="gallery-tabs" defaultActiveKey={selected_media_tab}>
                  <Form.Row style={{display:'block', width:'100%', border: '4px solid #f3f6f9', padding: '5px'}}>
                    <Col sm={12}>
                      <Nav variant="pills" className="media-gal-nav">
                        <Nav.Item>
                          <Nav.Link onClick={() => this.setState({selected_media_tab:'upload'})} eventKey="upload">Upload</Nav.Link>
                        </Nav.Item>
                        { this.props.showLibrary ?
                        <Nav.Item>
                          <Nav.Link onClick={() => this.setState({selected_media_tab:'my_library'})} eventKey="my_library">My Library</Nav.Link>
                        </Nav.Item> : ''}
                        <Nav.Item>
                          <Nav.Link onClick={() => this.setState({selected_media_tab:'airbook_library'})} eventKey="airbook_library">Airbook Gallery</Nav.Link>
                        </Nav.Item>
                      </Nav>
                      <Tab.Content>
                        <Tab.Pane eventKey="upload">
                        	{!this.props.showLibrary ?
        					<Form.Row>
              					<Form.Group as={Col} xs="12">
                            	 <Form.Control
					                  required
					                  type="text"
					                  placeholder="add suffix"
					                  onChange={(e) => this.setState({meta_name:e.target.value})}
					                />
					            </Form.Group>    
					            <br/>
        					</Form.Row>	
				            :''}
				            {this.props.showLibrary || this.state.meta_name !== '' ?
                          <RUG sorting={false}
                              action={API_URL+"medias"}
                              headers={{'Authorization': 'Token '+getToken()}}
                              send={
                              	this.props.user !== undefined &&
								this.props.user != ''
								?
									{meta_name:this.state.meta_name, gallery : this.props.showLibrary ? 'user':'airbook', user:this.props.user}
								:
                              	{meta_name:this.state.meta_name, gallery : this.props.showLibrary ? 'user':'airbook'}
                              }
                              source={response => MEDIA_URL+response.original_file_name}
                              onSuccess={(image) => this.onImageUpload(image)}
							  onClick={(image) => this.onImageClick(image)}
                              onError={(status, response, image) => {
                              	console.log(status);
                              	if(status.image.file.size / (1000*1000) > 20) {
                              		this.setState({
                              			message:'Image should not be greater than 20 MB',
                              			showMessage:true
                              		});
                              	} else 
                              		this.setState({showMessage:true});

                              }}
                            >
							  {/*<DragArea className="rug-items __card __sorting">
							  {
								(image) => (
								  <div className="rug-item">
									<Card image={image} />
									<div className="card-crop-overlay" onClick={() => this.onImageClick(image)}>Crop Image</div>
								  </div>
								)
							  }
							  </DragArea>*/}
                          </RUG>: '' }
                        </Tab.Pane>
                        { this.props.showLibrary ?
                        <Tab.Pane eventKey="my_library">
                          <Form.Row>
                            <Col xl={12} md={12} sm={12} xs={12}>
                              <Gallery 
                                enableImageSelection={true} images={this.state.user_media}
                                onSelectImage={(e)=>this.selectImage(e, 'user')}
								enableLightbox={false}
                                rowHeight={150}
                                />
                            </Col>
                          </Form.Row>
                        </Tab.Pane>:''}
                        <Tab.Pane eventKey="airbook_library">
                          <Form.Row>
                            <Col xl={12} md={12} sm={12} xs={12}>
                              <Gallery 
                                enableImageSelection={true} images={this.state.airbook_media}
                                onSelectImage={(e)=>this.selectImage(e, 'airbook')} enableLightbox={false}
                                rowHeight={150}
                                />
                            </Col>
                          </Form.Row>
                        </Tab.Pane>
						  {selected_media_tab === 'my_library' && this.state.isAnySelected && this.isUserSelectedImages() === true ?
                              <Form.Row className="mt-3">
								  <br/>
                                <Col xs={12}>
									<Button className="ml-2 btn btn-danger btn-sm" onClick={(e) => this.deletePhotos('user')} >Delete Photo</Button>
                                </Col>
                              </Form.Row>
                              :''
                            }
                      </Tab.Content>
                    </Col>
                  </Form.Row>
                </Tab.Container>
              </Navbar> 
              }
            {/*Crop Image Modal*/}
			<Modal
              size="xl"
              show={this.state.cropModal}
              onHide={() => this.setState({ cropModal: false })}
              aria-labelledby="example-modal-sizes-title-lg"
            >
              <Modal.Header closeButton>
				  <Button onClick={(e)=>this.uploadCroppedImage()} className={`btn btn-primary btn-sm ${clsx(
                      {
                        "kt-spinner kt-spinner--right kt-spinner--md kt-spinner--light": loading
                      }
                    )}`}>Crop and Save</Button>
              </Modal.Header>
              <Modal.Body>
				  <div className="row">
				  {cropImageUrl && (
					  <ReactCrop
						src={cropImageUrl}
						crop={crop}
						ruleOfThirds
						maxWidth="600"
						onImageLoaded={this.onImageLoaded}
						onComplete={this.onCropComplete}
						onChange={this.onCropChange}
						crossorigin="Anonymous"
						className="col-8"
					  />
					)}
					{croppedImageUrl && (
						<div className="col-4">
					  		<img crossOrigin="anonymous" alt="Crop" style={{ maxWidth: '100%' }} src={croppedImageUrl} />
						</div>
					)}
				  </div>
              </Modal.Body>
            </Modal>
 		<Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={this.state.showMessage}
          autoHideDuration={5000}
          onClose={() => this.setState({showMessage:false})}
        >
          <SnackbarContentWrapper
            onClose={() => this.setState({showMessage:false})}
            variant={this.state.messageType}
            message={this.state.message}
          />
      	</Snackbar>
            </div>
		)
	}
}