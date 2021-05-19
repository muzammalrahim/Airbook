import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Form, Col, Tab, Tabs} from "react-bootstrap";
import {
    Checkbox,
    FormControlLabel, FormGroup,
    FormControl, Button as ButtonCore,
} from "@material-ui/core";
import {CloudUpload as CloudUploadIcon} from "@material-ui/icons";
import {Link, withRouter} from 'react-router-dom'
import {list, post, API_URL,DROPDOWN_WAIT, getToken, loadOptions, MEDIA_URL, ENGINE_STATUSES, ENGINE_OFFER} from "../../../crud/api";
import Select from 'react-select';
import MediaLibrary from '../../../library/media'
import Gallery from 'react-grid-gallery';
import Grid from "@material-ui/core/Grid";
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider, DatePicker} from "@material-ui/pickers";
import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import moment from "moment";
import AsyncPaginate from "react-select-async-paginate";

const defaultMaterialTheme = createMuiTheme({
    props: {
        MuiInput: {
            disableUnderline: true,
        },
        MuiTextField: {
            style: {
                display: "block",
            },
        },
        MuiInputBase: {
            style: {
                display: "block",
            },
            disableUnderline: true,
            inputProps: {
                style: {
                    display: "block",
                    height: "calc(1.5em + 1.3rem + 2px)",
                    padding: "0.65rem 1rem",
                    fontSize: "1rem",
                    fontWeight: "400",
                    lineHeight: "1.5",
                    color: "#495057",
                    backgroundColor: "#fff",
                    backgroundClip: "padding-box",
                    border: "1px solid #e2e5ec",
                    borderRadius: "4px",
                    transition: "border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
                    boxSizing: "border-box",
                }
            }
        },
    },
});


class Create extends React.Component {

    constructor(props) {
        super(props);
        this.medialibraryAsset = React.createRef();
        this.state = {
            validated: false,
            engine: {},
            selectedFile: null,
            category: [],
            manufacturer: [],
            countries: [],
            type: [],
            contacts: [],
            model: [],
            companies: [],
            users: [],
            selected_primary_contact: {label: 'Select..', value: ''},
            selected_category: {label: 'Select..', value: ''},
            selected_type: {label: 'Select..', value: ''},
            selected_manufacturer: {label: 'Select..', value: ''},
            selected_current_location: {label: 'Select..', value: ''},
            selected_model: {label: 'Select..', value: ''},
            selected_owner: {label: 'Select..', value: ''},
            selected_seller: {label: 'Select..', value: ''},
            selected_user: {label: 'Select..', value: ''},
            selected_status: {label: 'Select..', value: ''},
            selected_offer_for: {label: 'Select..', value: ''},
            selected_images: [],
            attachments: [],
            initialFiles: [],
            modelsLoaded: false
        };
        // this.getDropdownsListing();
        this.loadModels();
    }

    handleChange(event, type) {
        var engine = this.state.engine;
        if (type !== 'availability') {
            var attr = event.target.name;
            var val = event.target.value;
        } else {
            var attr = type;
            var val = moment(event).format();
            this.setState({availability: event})
        }
        if (attr === 'is_active')
            val = parseInt(val);
        engine[attr] = val;
        this.setState({engine: engine})
    }

    handleSubmit(event) {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        this.setState({validated: true});
        if (!this.state.selectedFile)
            delete this.state.engine.file;
        let engine = this.state.engine;
        engine.images = this.state.selected_images;
        engine.attachments = this.state.attachments;
        post('engines', engine).then(
            (response) => {
                this.setState({engine: response.data});
                this.state.action == 'save_new' ? this.clearForm("parts-form") : this.props.data.history.push("/admin/engine/asset");
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }

    loadModels() {
        let models = {
            'AbUsers': {},
            'AbCategories': {type: 'engine'},
            'AbContacts': {},
            'AbCountries': {},
            'AbCompanies': {},
        }
        post('abmodels', {models: models}).then(function (response) {
            let AbEngineManufactures = [];
            for (let opt in response.data) {

                response.data[opt].map((row, i) => {
                    if (opt === 'AbContacts' || opt === 'AbUsers')
                        row.name = row.first_name + ' ' + row.last_name;

                    if (opt === 'AbUsers')
                        row.id = row.user_id;

                    response.data[opt][i].label = row.name;
                    response.data[opt][i].value = row.id;
                })
            }
            this.setState({
                users: response.data.AbUsers,
                category: response.data.AbCategories,
                contacts: response.data.AbContacts,
                countries: response.data.AbCountries,
                companies: response.data.AbCompanies,
                modelsLoaded: true
            })
        }.bind(this))
    }

    fileChangedHandler = (event) => {
        let engine = this.state.engine;
        let file = event.target.files[0];
        this.setState({
            previewFile: URL.createObjectURL(file)
        });
        if (file != undefined) {
            file.size_c = file.size / 1024;

            if ((file.size_c) / 1024 > 2) {
                file.size_c = (file.size_c / 1024).toFixed(2) + ' MB';
                file.error = "Error: File is too big";
                engine.file = {};
                this.setState({selectedFile: file});
            } else {
                file.error = null;
                file.size_c = file.size_c.toFixed(2) + ' KB';
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    engine.file = reader.result;
                    this.setState({selectedFile: file, engine: engine});
                };
            }
        }
    }

    getDropdownsListing() {
        let dropdowns = {// when you have database dropdown like departments just put here
            category: 'category',
            primary_contact: 'contacts',
            manufacturer: 'manufacturer',
            current_location: 'countries',
            // type:'type',
            // model:'model',
            owner: 'companies',
            user: 'users'
        }

        let duplicating_dropdowns = {
            companies: ['seller'],
        }

        let dropdown_keys = Object.keys(dropdowns);
        for (let key in dropdown_keys) {
            let params = {records: 'all', is_active: 1}
            // if(dropdowns[dropdown_keys[key]] === 'manufacturer')
            //   params.type = 'engine';
            if (dropdown_keys[key] === 'category')
                params.type = 'engine';
            else if (dropdown_keys[key] === 'manufacturer')
                params.type = 'engine';

            list(dropdowns[dropdown_keys[key]], params).then(function (response) {
                let data = response.data;
                let selected = {};
                for (let opt in data) {
                    // special case for contacts
                    if (dropdowns[dropdown_keys[key]] === 'contacts')
                        data[opt].name = data[opt].first_name + ' ' + data[opt].last_name;
                    else if (dropdowns[dropdown_keys[key]] === 'users')
                        data[opt].name = data[opt].contact.first_name + ' ' + data[opt].contact.last_name;

                    data[opt].label = data[opt].name;
                    data[opt].value = data[opt].id;

                    if (this.state.engine[dropdown_keys[key]] != undefined && data[opt].id === this.state.engine[dropdown_keys[key]].id)
                        selected = data[opt]

                    if (duplicating_dropdowns[dropdowns[dropdown_keys[key]]] != undefined) {
                        for (let index in duplicating_dropdowns[dropdowns[dropdown_keys[key]]]) {
                            let duplicated_el = duplicating_dropdowns[dropdowns[dropdown_keys[key]]][index];
                            if (this.state.engine[duplicated_el] != undefined && data[opt].id === this.state.engine[duplicated_el].id)
                                this.setState({['selected_' + duplicated_el]: selected});
                        }
                    }
                }
                this.setState({[dropdowns[dropdown_keys[key]]]: data, ['selected_' + dropdown_keys[key]]: selected});

            }.bind(this));
        }
    }

    handleFileRemove = (event) => {
        let category = this.state.category;
        category.file = {}
        this.setState({selectedFile: null, category: category})
        document.getElementById('category-image-upload').value = '';
    }

    selectChange(value, key) {
        let engine = this.state.engine;
        engine[key] = value && value.value ? value.value : '';
        this.setState({['selected_' + key]: value ? value : '', engine: engine});
        if (['category', 'manufacturer', 'type'].indexOf(key) > -1 && value) {
            let endpoint = '', params = {}, key_to_update = '', models = {};
            if (key === 'category') {
                models = {
                    AbManufacturers: {categories__id: value.id, type: 'engine'}
                }
                key_to_update = 'manufacturer';
            } else if (key === 'manufacturer') {
                models = {
                    AbTypes: {manufacturer_id: value.id, type: 'engine'}
                }
                key_to_update = 'type';
            } else if (key === 'type') {
                models = {
                    AbModels: {type_0: value.id, type: 'engine'}
                }
                key_to_update = 'model';
            }

            post('abmodels', {models: models}).then(function (response) {
                let selected = {};
                for (let opt in response.data) {
                    response.data[opt].map((row, i) => {
                        response.data[opt][i].label = row.name;
                        response.data[opt][i].value = row.id;

                        if (this.state.engine[key_to_update] != undefined && row.id === this.state.engine[key_to_update].id)
                            selected = row;
                    })

                    this.setState({
                        [key_to_update]: response.data[opt], ['selected_' + key_to_update]: selected
                    })
                }
            }.bind(this));
        }
    }

    setTab(event, tab) {
        document.getElementById('engine-tabs-tab-' + tab).click();
    }

    removeImage(index) {
        let selected_images = this.state.selected_images;
        selected_images = selected_images.filter((val, i) => {
            return index !== i;
        })
        this.setState({selected_images: selected_images});
    }

    onClickThumbnail(index) {
        let selected_images = this.state.selected_images;
        selected_images.map((val, i) => {
            if (i === index) {
                selected_images[i].is_featured = 1;
                selected_images[i].isSelected = true;
                selected_images[i].tags = [{value: "Featured", title: "Featured"}];
            } else {
                selected_images[i].is_featured = 0;
                selected_images[i].isSelected = false;
                delete selected_images[i].tags;
            }
        })
        this.setState({selected_images: selected_images});
    }

    getUploadParams(data) {
        const body = new FormData()
        body.append('original_file_name', data.file)
        body.append('user', this.state.selected_user ? this.state.selected_user.value : '');
        body.append('attachable_type', 'Engine');

        if ('existing' in data.file)
            body.append('existing_id', data.file.id);

        return {url: API_URL + 'attaches', dataType: 'json', body, headers: {'Authorization': 'Token ' + getToken()}}
    }

    onAttachmentUpload(data, status) {
        if (status === 'done') {
            let attachment = JSON.parse(data.xhr.response);
            this.setState({attachments: [...this.state.attachments, attachment]});
        } else if (status === 'removed') {
            let attachment = JSON.parse(data.xhr.response);
            let attachments = this.state.attachments.filter((val, i) => {
                return val.id !== attachment.id
            })
            this.setState({attachments: attachments})
        }
    }

    clearForm = (id) => {
        this.props.data.history.replace("/admin/engine/asset");
        this.props.data.history.replace("/admin/engine/asset/create");
    }

    render() {
        const {modelsLoaded,
            availability, engine, selectedFile, selected_manufacturer, manufacturer,
            selected_category, category, selected_current_location, countries, selected_type, type,
            selected_primary_contact, contacts, model, selected_model, selected_owner, companies,
            selected_seller, selected_user, users, selected_status, selected_offer_for, initialFiles
        } = this.state;
        return (
            <Form
                noValidate
                id="create-engine-form"
                onSubmit={e => this.handleSubmit(e)}
            >
                <Tabs defaultActiveKey="engine" id="engine-tabs">
                    <Tab eventKey="engine" title="Engines">
                        <Form.Row>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>User *</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    model="user"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_user ? selected_user : ''}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, users, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'user')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Category *</Form.Label>
                                <Select
                                    value={selected_category}
                                    model="category"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'category')}
                                    options={category}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Manfacturer *</Form.Label>
                                <Select
                                    value={selected_manufacturer}
                                    model="manufacturer"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'manufacturer')}
                                    options={manufacturer}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Type *</Form.Label>
                                <Select
                                    value={selected_type}
                                    model="type"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'type')}
                                    options={type}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Model</Form.Label>
                                <Select
                                    value={selected_model}
                                    model="model"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'model')}
                                    options={model}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>ESN</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="engine"
                                    name="esn"
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Cycles Reamining (CR)</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="engine"
                                    name="cycle_remaining"
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Status</Form.Label>
                                <Select
                                    value={selected_status}
                                    model="engine"
                                    name="status"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'status')}
                                    options={ENGINE_STATUSES}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>TSO</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="engine"
                                    name="tso"
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Thrust Rating</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="engine"
                                    name="thrust_rating"
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>LSV Description</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="engine"
                                    name="lsv_description"
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Button onClick={(e) => this.setTab(e, 'commercial')} className="btn btn-primary">
                            Next
                        </Button>
                    </Tab>
                    <Tab eventKey="commercial" title="Commerical">
                        <Form.Row>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Offered For *</Form.Label>
                                <Select
                                    value={selected_offer_for}
                                    model="engine"
                                    name="offer_for"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'offer_for')}
                                    options={ENGINE_OFFER}
                                />
                            </Form.Group>
                            {this.state.engine['offer_for'] === 'Sale' &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Asking Price</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="engine"
                                    name="price"
                                    defaultValue={engine ? engine.price : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            }
                            {(
                                this.state.engine['offer_for'] === 'Lease' ||
                                this.state.engine['offer_for'] === 'Lease Purchase'
                            )
                            &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>{this.state.engine['offer_for']} terms</Form.Label>
                                <Form.Control
                                    as="textarea" rows="5"
                                    model="engine"
                                    name="lease_terms"
                                    defaultValue={engine ? engine.lease_terms : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            }
                            {this.state.engine['offer_for'] === 'Exchange' &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>{this.state.engine['offer_for']} terms</Form.Label>
                                <Form.Control
                                    as="textarea" rows="5"
                                    model="engine"
                                    name="exchange_terms"
                                    defaultValue={engine ? engine.exchange_terms : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            }
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Availability</Form.Label>
                                <ThemeProvider theme={defaultMaterialTheme}>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <DatePicker
                                            required
                                            minDate={new Date()}
                                            disablePast={true}
                                            value={availability}
                                            format="dd/MM/yyyy"
                                            onChange={e => this.handleChange(e, 'availability')}
                                            animateYearScrolling
                                        />
                                    </MuiPickersUtilsProvider>
                                </ThemeProvider>
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Current Location *</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    model="current_location"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_current_location}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, countries, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'current_location')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Primary Contact *</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    model="primary_contact"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_primary_contact}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, contacts, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'primary_contact')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Owner</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    model="owner"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_owner}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'owner')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Seller</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    model="seller"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_seller}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'seller')}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Button onClick={(e) => this.setTab(e, 'files_photos')} className="btn btn-primary">
                            Next
                        </Button>
                    </Tab>
                    <Tab eventKey="files_photos" title="Files & Photos">
                        <Form.Row>

                            <Form.Group as={Col} xs="12" md="6">
                                <Button onClick={() => this.medialibraryAsset.current.galleryModalOpener()}
                                        className="btn btn-primary">
                                    <i className="fa fa-upload"></i> Select or Upload Images
                                </Button>
                                <MediaLibrary modal={true} ref={this.medialibraryAsset}
                                              user={selected_user ? selected_user.value : ''}
                                              showLibrary={selected_user ? selected_user.value === "" ? false : true : false}
                                              selected_images={this.state.selected_images}
                                              insertImages={(images) => this.setState({selected_images: images})}/>

                                <Gallery enableLightbox={false} id="readonlygallery" rowHeight={150} margin={5}
                                         enableImageSelection={true} onSelectImage={(e) => this.removeImage(e)}
                                         images={this.state.selected_images}
                                         onClickThumbnail={(e) => this.onClickThumbnail(e)}/>
                            </Form.Group>

                            <Form.Group as={Col} xs="12" md="6">
                                <Dropzone
                                    inputContent="Drop a PDF file here, or click to select a file to upload."
                                    accept=".pdf"
                                    styles={{dropzone: {height: 250}}}
                                    getUploadParams={(data) => this.getUploadParams(data)}
                                    onChangeStatus={(data, status) => this.onAttachmentUpload(data, status)}
                                    maxSizeBytes={(1024 * 1024 * 2)}
                                    initialFiles={initialFiles}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Form.Row>
                            <Form.Group as={Col} xs="12">
                                <Button onClick={(e) => this.setTab(e, 'custom_info')} className="btn btn-primary">
                                    Next
                                </Button>
                            </Form.Group>
                        </Form.Row>
                    </Tab>
                    <Tab eventKey="custom_info" title="Custom Info">
                        <Form.Row>
                            <Form.Group as={Col} xs="12">
                                <Form.Label>Additional details</Form.Label>
                                <Form.Control as="textarea" rows="5"
                                              required
                                              type="text"
                                              placeholder=""
                                              model="engine"
                                              name="description"
                                              onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Button type="submit" onClick={(e) => this.setState({action: 'save'})}
                                className="btn btn-primary">
                            <i className="la la-save"/>
                            Save & Close
                        </Button>
                        &nbsp;&nbsp;

                        <Button type="submit" onClick={(e) => this.setState({action: 'save_new'})}
                                className="btn btn-success">
                            <i className="la la-save"/>
                            Save & New
                        </Button>
                        &nbsp;&nbsp;

                        <Link to={"/admin/engine/asset"} className="btn btn-danger">
                            <i className="la la-remove"/>
                            Cancel
                        </Link>
                    </Tab>
                </Tabs>
            </Form>
        );
    }
}

class CreatePage extends React.Component {
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
                            beforeCodeTitle={"Engine"}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <Link to={"/admin/engine/asset"} className="btn btn-clean btn-icon-sm">
                                                <i className="la la-long-arrow-left"></i>
                                                Back
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            }>
                            <div className="kt-section">
                                <Create data={this.props} sendError={this.sendError}/>
                            </div>
                        </CustomHead>
                    </div>
                </div>
            </>
        );
    }
}

export default withRouter(CreatePage);