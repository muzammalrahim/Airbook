import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Form, Col, Tab, Tabs, Row, Modal} from "react-bootstrap";
import {
    Checkbox,
    FormControlLabel, FormGroup,
    FormControl, Button as ButtonCore, IconButton, createMuiTheme, Select as SelectCore, Divider
} from "@material-ui/core";
import {CloudUpload as CloudUploadIcon} from "@material-ui/icons";
import {Link, withRouter} from 'react-router-dom'
import {
    list,
    patch,
    post,
    getToken,
    loadOptions,
    MEDIA_URL,
    API_URL,
    ENGINE_STATUSES,
    ENGINE_OFFER,
    ENGINE_EXTRA_FIELDS,
    ENGINE_COMMERCIAL_EXTRA_FIELDS,
    USER_URL
} from "../../../crud/api";
import Select from 'react-select';
import Gallery from 'react-grid-gallery';
import DeleteForeverOutlinedIcon from '@material-ui/icons/DeleteForeverOutlined';
import MediaLibrary from '../../../library/media'
import Grid from "@material-ui/core/Grid";
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider, DatePicker} from "@material-ui/pickers";
import {ThemeProvider} from "@material-ui/styles";
import moment from "moment";
import KTWizard from "../../../../_metronic/_assets/js/wizard";
import DeleteIcon from '@material-ui/icons/Delete';
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

const addMoreSelect = createMuiTheme({
  overrides: {
      MuiOutlinedInput:{
          root: {
            '&:hover': {
              "& $notchedOutline":{
                      borderColor: 'rgb(179, 179, 179)'
                }
            }
          },
          inputSelect: {
              padding: "13px",
              fontFamily: "Poppins, Helvetica, sans-serif",
              color: "#808080"
          }
      }
  },
});

class Edit extends React.Component {

    wizardRef = React.createRef();

    constructor(props) {
        super(props);
        const {engine_id, type} = this.props.data.match.params
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
            selected_primary_contact: {
                id:props.data.extra_data.user.contact.id,
                label:props.data.extra_data.user.contact.first_name+' '+props.data.extra_data.user.contact.last_name,
                value:true
            },
            selected_category: {value: ''},
            selected_type: {value: ''},
            selected_manufacturer: {value: ''},
            selected_current_location: {value: ''},
            selected_model: {value: ''},
            selected_owner: {value: ''},
            selected_seller: {value: ''},
            selected_user: {value: this.props.data.extra_data.user ? this.props.data.extra_data.user.id : null},
            selected_status: {value: ''},
            selected_offer_for: {value: ''},
            selected_images: [],
            attachments: [],
            initialFiles: [],
            modalDisplay: false,
            modalType: '',
            engineExtraFields: ENGINE_EXTRA_FIELDS,
            selectedExtraFields: [],
            commercialExtraFields: ENGINE_COMMERCIAL_EXTRA_FIELDS,
            selectedExtraFieldsCommercial: [],
            modelsLoaded: false,
        };
        this.getEngine(engine_id);
        this.confirm=this.confirm.bind(this);
    }

    componentDidMount() {
        new KTWizard(this.wizardRef.current);
    }

    getEngine(engine_id) {
        list('engines/' + engine_id + '/').then(
            (response) => {
                let availability = response.data.availability;
                this.setState({
                    availability: availability
                })
                this.setState({engine: response.data})
                // this.getDropdownsListing();
                this.loadModels();

                /*if (response.data.manufacturer.id != undefined && response.data.manufacturer.id != "")
                    this.setDynamicDropdowns(response.data.manufacturer.id, 'manufacturer');

                if (response.data.type.id != undefined && response.data.type.id != "")
                    this.setDynamicDropdowns(response.data.type.id, 'type');*/

                this.loadSelectedImages(response.data.media);
                this.loadInitialFields();
                this.renderExtraFields();
            });
    }

    loadModels() {
        let engine_data = this.state.engine;

        // static dropdowns calculation here -

        let static_dropdowns = { // when you have static dropdown like gender just put here
            status: ENGINE_STATUSES,
            offer_for: ENGINE_OFFER
        }

        let dropdown_keys = Object.keys(static_dropdowns);
        for (let key in dropdown_keys) {
            for (let index in static_dropdowns[dropdown_keys[key]]) {
                if (static_dropdowns[dropdown_keys[key]][index].value === engine_data[dropdown_keys[key]]) {
                    this.setState({['selected_' + dropdown_keys[key]]: static_dropdowns[dropdown_keys[key]][index]});
                    break;
                }
            }
        }

        let models = {
            'AbCategories': {type: 'engine'},
            'AbContacts': {},
            'AbCountries': {},
            'AbCompanies': {},
            'AbUsers': {},
        }

        // lets do some mapping to avoid if else conditions
        let state_endpoints = {
            AbUsers:['user'],
            AbContacts: ['primary_contact'],
            AbCategories: ['category'],
            AbManufacturers: ['manufacturer'],
            AbCountries: ['current_location'],
            AbCompanies: ['owner', 'seller']
        }

        if (engine_data.category !== null && engine_data.category.id !== undefined) {
            models['AbManufacturers'] = {type: 'engine', categories__id: engine_data.category.id}
            state_endpoints['AbManufacturers'] = ['manufacturer']
        }

        if (engine_data.manufacturer != null && engine_data.manufacturer.id != undefined) {
            models['AbTypes'] = {type: 'engine', manufacturer_id: engine_data.manufacturer.id}
            state_endpoints['AbTypes'] = ['type']
        }

        if (engine_data.type != null && engine_data.type.id != undefined) {
            models['AbModels'] = {type: 'engine', type_0: engine_data.type.id}
            state_endpoints['AbModels'] = ['model']
        }

        post('abmodels', {models: models}).then(function (response) {
            let newStates = {};
            for (let opt in response.data) {

                response.data[opt].map((row, i) => {
                    if (opt === 'AbContacts' || opt === 'AbUsers')
                        row.name = row.first_name + ' ' + row.last_name;
                    if (opt === 'AbUsers')
                        row.id = row.user_id;

                    response.data[opt][i].label = row.name;
                    response.data[opt][i].value = row.id;

                    Object.keys(state_endpoints).map((key, i) => {
                        state_endpoints[key].map((state, index) => {
                            if (opt === key && engine_data[state] !== null && engine_data[state].id !== undefined && engine_data[state].id === row.id)
                                newStates['selected_' + state] = row;
                        })
                    })

                })
            }
            newStates['users'] = response.data.AbUsers;
            newStates['category'] = response.data.AbCategories;
            newStates['contacts'] = response.data.AbContacts;
            newStates['manufacturer'] = response.data.AbManufacturers;
            newStates['countries'] = response.data.AbCountries;
            newStates['companies'] = response.data.AbCompanies;

            if (engine_data.category !== null && engine_data.category.id !== undefined)
                newStates['manufacturer'] = response.data.AbManufacturers;

            if (engine_data.manufacturer != null && engine_data.manufacturer.id != undefined)
                newStates['type'] = response.data.AbTypes;

            if (engine_data.type != null && engine_data.type.id != undefined)
                newStates['model'] = response.data.AbModels;

            newStates['modelsLoaded'] = true;
            this.setState(newStates);
        }.bind(this))
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
        this.checkDataFormat(); // this is done to convert foregin table objects into pk
        if (!this.state.selectedFile)
            delete this.state.engine.file;
        patch('engines/' + this.state.engine.id + '/', this.state.engine).then(
            (response) => {
                this.setState({engine: response.data});
                this.props.data.history.push(this.state.action == 'save_new' ? "/" + USER_URL + "/engine/asset/create" : "/" + USER_URL + "/engine/asset");
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }

    checkDataFormat() {
        let engine = this.state.engine;
        let related_data = ['category', 'primary_contact', 'manufacturer', 'current_location',
            'type', 'model', 'owner', 'user', 'seller'];
        related_data.map((val, i) => {
            engine[val] = this.state['selected_' + val].value;
        })
        engine.images = this.state.selected_images;
        engine.attachments = this.state.attachments;
        this.setState({engine: engine});
    }

    getDropdownsListing() {
        let engine_data = this.state.engine;
        let dropdowns = {// when you have database dropdown like departments just put here
            category: 'category',
            primary_contact: 'contacts',
            manufacturer: 'manufacturer',
            current_location: 'countries',
            type: 'type',
            model: 'model',
            owner: 'companies',
            user: 'users'
        }

        let duplicating_dropdowns = {
            companies: ['seller'],
        }


        // static dropdowns calculation here -

        let static_dropdowns = { // when you have static dropdown like gender just put here
            status: ENGINE_STATUSES,
            offer_for: ENGINE_OFFER
        }

        let dropdown_keys = Object.keys(static_dropdowns);
        for (let key in dropdown_keys) {
            for (let index in static_dropdowns[dropdown_keys[key]]) {
                if (static_dropdowns[dropdown_keys[key]][index].value === engine_data[dropdown_keys[key]]) {
                    this.setState({['selected_' + dropdown_keys[key]]: static_dropdowns[dropdown_keys[key]][index]});
                    break;
                }
            }
        }

        dropdown_keys = Object.keys(dropdowns);
        for (let key in dropdown_keys) {
            let params = {}
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

                    if (engine_data[dropdown_keys[key]] != undefined && data[opt].id === engine_data[dropdown_keys[key]].id)
                        selected = data[opt]

                    if (duplicating_dropdowns[dropdowns[dropdown_keys[key]]] != undefined) {
                        for (let index in duplicating_dropdowns[dropdowns[dropdown_keys[key]]]) {
                            let duplicated_el = duplicating_dropdowns[dropdowns[dropdown_keys[key]]][index];

                            if (engine_data[duplicated_el] != undefined && data[opt].id === engine_data[duplicated_el].id) {
                                this.setState({['selected_' + duplicated_el]: data[opt]});
                            }
                        }
                    }
                }
                this.setState({
                    [dropdowns[dropdown_keys[key]]]: data,
                    ['selected_' + dropdown_keys[key]]: selected,
                    engine: engine_data
                });

            }.bind(this));
        }
    }

    removeImage(index) {
        let selected_images = this.state.selected_images;
        selected_images = selected_images.filter((val, i) => {
            return index !== i;
        })
        this.setState({selected_images: selected_images});
    }

    selectChange(value, key) {
        let engine = this.state.engine;
        engine[key] = value && value.value ? value.value : '';
        this.setState({['selected_' + key]: value ? value : '', engine: engine});
        this.setDynamicDropdowns(value && value.id ? value.id : '', key);
    }

    setDynamicDropdowns(id, key) {
        if (['category', 'manufacturer', 'type'].indexOf(key) > -1 && id) {
            let endpoint = '', params = {}, key_to_update = '', models = {};
            if (key === 'category') {
                models = {
                    AbManufacturers: {categories__id: id, type: 'engine'}
                }
                key_to_update = 'manufacturer';
            } else if (key === 'manufacturer') {
                models = {
                    AbTypes: {manufacturer_id: id, type: 'engine'}
                }
                key_to_update = 'type';
            } else if (key === 'type') {
                models = {
                    AbModels: {type_0: id, type: 'engine'}
                }
                key_to_update = 'model';
            }

            post('abmodels', {models: models}).then(function (response) {
                let selected = {};
                for (let opt in response.data) {
                    response.data[opt].map((row, i) => {
                        response.data[opt][i].label = row.name;
                        response.data[opt][i].value = row.id;
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

    getUploadParams(data) {
        const body = new FormData()
        body.append('original_file_name', data.file)
        body.append('user', this.state.selected_user.value);
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
            if(data.xhr){
                let attachment = JSON.parse(data.xhr.response);
                let attachments = this.state.attachments.filter((val, i) => {
                    return val.id !== attachment.id
                })
                this.setState({attachments: attachments})
            }
        }
    }

    loadInitialFields() {
        if (this.state.engine.attachments !== undefined) {
            let initialFiles = [];
            this.state.engine.attachments.map((val, i) => {
                let file = new File(['foo'], MEDIA_URL + val.original_file_name);
                file.id = val.id;
                file.existing = true;
                initialFiles.push(file);
            })
            this.setState({initialFiles: initialFiles});
        }
    }

    loadSelectedImages(data) {
        data.map((val, i) => {
            data[i].src = MEDIA_URL + val.original_file_name;
            data[i].thumbnail = MEDIA_URL + val.original_file_name;
            data[i].thumbnailWidth = 150;
            data[i].thumbnailHeight = 150;
            data[i].isSelected = true;
            if (data[i].is_featured) {
                data[i].isSelected = true;
                data[i].tags = [{value: "Featured", title: "Featured"}];
            } else
                data[i].isSelected = false;
            data[i].customOverlay = <Grid item xs={8}> <DeleteForeverOutlinedIcon/> </Grid>
        })
        this.setState({selected_images: data});
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

    renderExtraFields() {
        //first render engine extrafields
        let engineExtraFields = [...this.state.engineExtraFields];
        let engineExtra = [];
        ENGINE_EXTRA_FIELDS.map((val, i) => {
            if (this.state.engine[val.value])
                engineExtra.push('' + val.value + '')
        })

        this.setState({selectedExtraFields: engineExtra});
        this.setState(state => {
            const engineExtraFields = state.engineExtraFields.filter(item => !engineExtra.includes(item.value));
            return {
                engineExtraFields
            };
        });

        //then render commercial extrafields
        let commercialExtraFields = [...this.state.commercialExtraFields];
        let commercialExtra = [];
        ENGINE_COMMERCIAL_EXTRA_FIELDS.map((val, i) => {
            if (this.state.engine[val.value] && typeof this.state.engine[val.value].id !== "undefined")
                commercialExtra.push('' + val.value + '')
        })

        this.setState({selectedExtraFieldsCommercial: commercialExtra});
        this.setState(state => {
            const commercialExtraFields = state.commercialExtraFields.filter(item => !commercialExtra.includes(item.value));
            return {
                commercialExtraFields
            };
        });
    }

    selectMoreFields(event, key) {
        let engineExtraFields = [...this.state.engineExtraFields];
        engineExtraFields.splice(event.target.selectedIndex - 1, 1);
        this.setState({engineExtraFields: engineExtraFields});
        this.setState(state => {
            const selectedExtraFields = [...state.selectedExtraFields, key];
            return {
                selectedExtraFields,
            };
        });
    }

    removeExtraField(event, key, label) {
        let engineState = this.state.engine;
        let engineExtraFields = [...this.state.engineExtraFields, {label: label, value: key}];
        this.setState({engineExtraFields: engineExtraFields});
        let selectedExtraFields = this.state.selectedExtraFields;
        selectedExtraFields = selectedExtraFields.filter((val, i) => {
            return key !== val;
        })
        this.setState({selectedExtraFields: selectedExtraFields});
        engineState[key] = null;
        this.setState({engine: engineState})
        this.setState({['selected_' + key]: {value: ''}});
    }

    selectMoreFieldsCommercial(event, key) {
        let commercialExtraFields = [...this.state.commercialExtraFields];
        commercialExtraFields.splice(event.target.selectedIndex - 1, 1);
        this.setState({commercialExtraFields: commercialExtraFields});
        this.setState(state => {
            const selectedExtraFieldsCommercial = [...state.selectedExtraFieldsCommercial, key];
            return {
                selectedExtraFieldsCommercial,
            };
        });
    }

    removeExtraFieldCommercial(event, key, label) {
        let engineState = this.state.engine;
        let commercialExtraFields = [...this.state.commercialExtraFields, {label: label, value: key}];
        this.setState({commercialExtraFields: commercialExtraFields});
        let selectedExtraFieldsCommercial = this.state.selectedExtraFieldsCommercial;
        selectedExtraFieldsCommercial = selectedExtraFieldsCommercial.filter((val, i) => {
            return key !== val;
        })
        this.setState({selectedExtraFieldsCommercial: selectedExtraFieldsCommercial});
        engineState[key] = null;
        this.setState({engine: engineState})
        this.setState({['selected_' + key]: {value: ''}});
    }

    handleModalShow = () => {
        this.setState({
            modalDisplay: true,
        })
    }

    handleModalClose = () => {
        this.setState({modalDisplay: false})
    }
    confirm(){
        let data= {
            category: document.getElementById('modal-category-id').value,
            manufacturer: document.getElementById('modal-manufacture-id').value,
            type: document.getElementById('modal-type-id').value,
            model: document.getElementById('modal-model-id').value,
            entity_type: 'engine',
            user: this.props.data.extra_data.user.id
        }
        post('suggestions', data).then(
            (response) => {
                this.setState({
                    modalDisplay: false,
                })
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }
    render() {
        const {
            availability, engine, selectedFile, selected_manufacturer, manufacturer,
            selected_category, category, selected_current_location, countries, selected_type, type,
            selected_primary_contact, contacts, model, selected_model, selected_owner, companies,
            selected_seller, selected_user, users, selected_status, selected_offer_for, initialFiles, modelsLoaded
        } = this.state;
        return (
            <div className="kt-portlet">
                <div className="kt-portlet__head">
                    <div className="kt-portlet__head-label">
                        <h3 className="kt-portlet__head-title">
                            Engine
                        </h3>
                    </div>
                </div>
                <div className="kt-portlet__body kt-portlet__body--fit">
                    <div ref={this.wizardRef} className="kt-grid  kt-wizard-v1 kt-wizard-v1--white" id="kt_engine_add"
                         data-ktwizard-state="step-first">
                        <div className="kt-grid__item">

                            <div className="kt-wizard-v1__nav">
                                <div className="kt-wizard-v1__nav-items">

                                    <div className="kt-wizard-v1__nav-item" data-ktwizard-type="step"
                                         data-ktwizard-state="current">
                                        <div className="kt-wizard-v1__nav-body">
                                            <div className="kt-wizard-v1__nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                     xmlnsXlink="http://www.w3.org/1999/xlink" width="24px"
                                                     height="24px" viewBox="0 0 24 24" version="1.1"
                                                     className="kt-svg-icon kt-svg-icon--xl">
                                                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                        <rect x="0" y="0" width="24" height="24"/>
                                                        <path
                                                            d="M4.875,20.75 C4.63541667,20.75 4.39583333,20.6541667 4.20416667,20.4625 L2.2875,18.5458333 C1.90416667,18.1625 1.90416667,17.5875 2.2875,17.2041667 C2.67083333,16.8208333 3.29375,16.8208333 3.62916667,17.2041667 L4.875,18.45 L8.0375,15.2875 C8.42083333,14.9041667 8.99583333,14.9041667 9.37916667,15.2875 C9.7625,15.6708333 9.7625,16.2458333 9.37916667,16.6291667 L5.54583333,20.4625 C5.35416667,20.6541667 5.11458333,20.75 4.875,20.75 Z"
                                                            fill="#000000" fillRule="nonzero" opacity="0.3"/>
                                                        <path
                                                            d="M2,11.8650466 L2,6 C2,4.34314575 3.34314575,3 5,3 L19,3 C20.6568542,3 22,4.34314575 22,6 L22,15 C22,15.0032706 21.9999948,15.0065399 21.9999843,15.009808 L22.0249378,15 L22.0249378,19.5857864 C22.0249378,20.1380712 21.5772226,20.5857864 21.0249378,20.5857864 C20.7597213,20.5857864 20.5053674,20.4804296 20.317831,20.2928932 L18.0249378,18 L12.9835977,18 C12.7263047,14.0909841 9.47412135,11 5.5,11 C4.23590829,11 3.04485894,11.3127315 2,11.8650466 Z M6,7 C5.44771525,7 5,7.44771525 5,8 C5,8.55228475 5.44771525,9 6,9 L15,9 C15.5522847,9 16,8.55228475 16,8 C16,7.44771525 15.5522847,7 15,7 L6,7 Z"
                                                            fill="#000000"/>
                                                    </g>
                                                </svg>
                                            </div>
                                            <div className="kt-wizard-v1__nav-label">
                                                Engine
                                            </div>
                                        </div>
                                    </div>
                                    <div className="kt-wizard-v1__nav-item" data-ktwizard-type="step">
                                        <div className="kt-wizard-v1__nav-body">
                                            <div className="kt-wizard-v1__nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                     xmlnsXlink="http://www.w3.org/1999/xlink" width="24px"
                                                     height="24px" viewBox="0 0 24 24" version="1.1"
                                                     className="kt-svg-icon kt-svg-icon--xl">
                                                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                        <rect x="0" y="0" width="24" height="24"/>
                                                        <path
                                                            d="M13,18.9450712 L13,20 L14,20 C15.1045695,20 16,20.8954305 16,22 L8,22 C8,20.8954305 8.8954305,20 10,20 L11,20 L11,18.9448245 C9.02872877,18.7261967 7.20827378,17.866394 5.79372555,16.5182701 L4.73856106,17.6741866 C4.36621808,18.0820826 3.73370941,18.110904 3.32581341,17.7385611 C2.9179174,17.3662181 2.88909597,16.7337094 3.26143894,16.3258134 L5.04940685,14.367122 C5.46150313,13.9156769 6.17860937,13.9363085 6.56406875,14.4106998 C7.88623094,16.037907 9.86320756,17 12,17 C15.8659932,17 19,13.8659932 19,10 C19,7.73468744 17.9175842,5.65198725 16.1214335,4.34123851 C15.6753081,4.01567657 15.5775721,3.39010038 15.903134,2.94397499 C16.228696,2.49784959 16.8542722,2.4001136 17.3003976,2.72567554 C19.6071362,4.40902808 21,7.08906798 21,10 C21,14.6325537 17.4999505,18.4476269 13,18.9450712 Z"
                                                            fill="#000000" fillRule="nonzero"/>
                                                        <circle fill="#000000" opacity="0.3" cx="12" cy="10" r="6"/>
                                                    </g>
                                                </svg>
                                            </div>
                                            <div className="kt-wizard-v1__nav-label">
                                                Commercial
                                            </div>
                                        </div>
                                    </div>
                                    <div className="kt-wizard-v1__nav-item" data-ktwizard-type="step">
                                        <div className="kt-wizard-v1__nav-body">
                                            <div className="kt-wizard-v1__nav-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg"
                                                     xmlnsXlink="http://www.w3.org/1999/xlink" width="24px"
                                                     height="24px" viewBox="0 0 24 24" version="1.1"
                                                     className="kt-svg-icon kt-svg-icon--xl">
                                                    <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                                        <rect x="0" y="0" width="24" height="24"/>
                                                        <path
                                                            d="M13.2070325,4 C13.0721672,4.47683179 13,4.97998812 13,5.5 C13,8.53756612 15.4624339,11 18.5,11 C19.0200119,11 19.5231682,10.9278328 20,10.7929675 L20,17 C20,18.6568542 18.6568542,20 17,20 L7,20 C5.34314575,20 4,18.6568542 4,17 L4,7 C4,5.34314575 5.34314575,4 7,4 L13.2070325,4 Z"
                                                            fill="#000000"/>
                                                        <circle fill="#000000" opacity="0.3" cx="18.5" cy="5.5"
                                                                r="2.5"/>
                                                    </g>
                                                </svg>
                                            </div>
                                            <div className="kt-wizard-v1__nav-label">
                                                Complete
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className="kt-grid__item kt-grid__item--fluid kt-wizard-v1__wrapper">
                            <Form className="kt-form" noValidate id="create-engine-form"
                                  onSubmit={e => this.handleSubmit(e)}>
                                <div className="kt-wizard-v1__content" data-ktwizard-type="step-content"
                                     data-ktwizard-state="current">
                                    <div className="kt-heading kt-heading--md">Engine Info</div>
                                    <div className="kt-section kt-section--first">
                                        <div className="kt-wizard-v1__form">
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Category</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Select
                                                        value={selected_category.value?selected_category:'select...'}
                                                        model="category"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'category')}
                                                        options={category}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Manufacturer</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Select
                                                        value={selected_manufacturer.value?selected_manufacturer:'select...'}
                                                        model="manufacturer"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'manufacturer')}
                                                        options={manufacturer}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Type</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Select
                                                        value={selected_type.value?selected_type:'select...'}
                                                        model="type"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'type')}
                                                        options={type}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Model</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Select
                                                        value={selected_model.value?selected_model:'select...'}
                                                        model="model"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'model')}
                                                        options={model}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">ESN</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Form.Control
                                                        required
                                                        type="text"
                                                        placeholder=""
                                                        model="engine"
                                                        name="esn"
                                                        defaultValue={engine ? engine.esn : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Cycles Remaining (CR)</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Form.Control
                                                        required
                                                        type="text"
                                                        placeholder=""
                                                        model="engine"
                                                        name="cycle_remaining"
                                                        defaultValue={engine ? engine.cycle_remaining : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Status</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Select
                                                        value={selected_status.value?selected_status:'select...'}
                                                        model="engine"
                                                        name="status"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'status')}
                                                        options={ENGINE_STATUSES}
                                                    />
                                                </Col>
                                            </Form.Group>

                                            {this.state.selectedExtraFields.includes("tso") &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">TSO</Form.Label>
                                                <Col sm="6" lg="6">
                                                    <Form.Control
                                                        required
                                                        type="text"
                                                        placeholder=""
                                                        model="engine"
                                                        name="tso"
                                                        defaultValue={engine ? engine.tso : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                                <Col sm="3">
                                                    <IconButton aria-label="delete"
                                                                onClick={(e) => this.removeExtraField(e, 'tso', 'TSO')}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </Col>
                                            </Form.Group>
                                            }
                                            {this.state.selectedExtraFields.includes("thrust_rating") &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Thrust
                                                    Rating</Form.Label>
                                                <Col sm="6" lg="6">
                                                    <Form.Control
                                                        required
                                                        type="text"
                                                        placeholder=""
                                                        model="engine"
                                                        name="thrust_rating"
                                                        defaultValue={engine ? engine.thrust_rating : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                                <Col sm="3">
                                                    <IconButton aria-label="delete"
                                                                onClick={(e) => this.removeExtraField(e, 'thrust_rating', 'Thrust Rating')}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </Col>
                                            </Form.Group>
                                            }
                                            {this.state.selectedExtraFields.includes("lsv_description") &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">LSV
                                                    Description</Form.Label>
                                                <Col sm="6" lg="6">
                                                    <Form.Control
                                                        required
                                                        type="text"
                                                        placeholder=""
                                                        model="engine"
                                                        name="lsv_description"
                                                        defaultValue={engine ? engine.lsv_description : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                                <Col sm="3">
                                                    <IconButton aria-label="delete"
                                                                onClick={(e) => this.removeExtraField(e, 'lsv_description', 'LSV Description')}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </Col>
                                            </Form.Group>
                                            }
                                            {this.state.engineExtraFields.length>0 &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3"></Form.Label>
                                                <Col sm="6" lg="6">
                                                    <FormControl variant="outlined" fullWidth={true}>
                                                        <ThemeProvider theme={addMoreSelect}>
                                                        <SelectCore
                                                            native
                                                            value=""
                                                            onChange={(e) => this.selectMoreFields(e, e.target.value)}
                                                        >
                                                            <option value="" disabled>Add more details</option>
                                                            {this.state.engineExtraFields.map(item => (
                                                                <option value={item.value}
                                                                        data-label={item.label}>{item.label}</option>
                                                            ))}
                                                        </SelectCore>
                                                        </ThemeProvider>
                                                    </FormControl>
                                                </Col>
                                            </Form.Group>
                                            }
                                            <div className="kt-space-10"></div>
                                            <Divider variant="middle"/>
                                            <div className="kt-space-10"></div>
                                            <Form.Row>
                                                <Form.Group as={Col} xs="12">
                                                    <Form.Label>Additional details</Form.Label>
                                                    <Form.Control as="textarea" rows="5"
                                                                  required
                                                                  type="text"
                                                                  placeholder=""
                                                                  model="engine"
                                                                  name="description"
                                                                  defaultValue={engine ? engine.description : ''}
                                                                  onBlur={e => this.handleChange(e)}
                                                    />
                                                </Form.Group>
                                            </Form.Row>
                                            <div>
                                                <Link className="label label-light-info label-inline more-info" href="#" onClick={this.handleModalShow}>
                                                    <i className="flaticon2-information"></i> Didn't find basic info? Please click here to suggest.
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="kt-wizard-v1__content" data-ktwizard-type="step-content">
                                    <div className="kt-heading kt-heading--md">Commercial</div>
                                    <div className="kt-section kt-section--first">
                                        <div className="kt-wizard-v1__form">
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Offered
                                                    For</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Select
                                                        value={selected_offer_for}
                                                        model="engine"
                                                        name="offer_for"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'offer_for')}
                                                        options={ENGINE_OFFER}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            {this.state.engine['offer_for'] === 'Sale' &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Asking
                                                    Price</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Form.Control
                                                        required
                                                        type="text"
                                                        placeholder=""
                                                        model="engine"
                                                        name="price"
                                                        defaultValue={engine ? engine.price : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col><Form.Label column sm="3" className="text-sm-left text-left">USD</Form.Label>
                                            </Form.Group>
                                            }
                                            {(
                                                this.state.engine['offer_for'] === 'Lease' ||
                                                this.state.engine['offer_for'] === 'Lease Purchase'
                                            )
                                            &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3"
                                                            className="text-sm-right text-left">{this.state.engine['offer_for']} terms</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Form.Control
                                                        as="textarea" rows="5"
                                                        model="engine"
                                                        name="lease_terms"
                                                        defaultValue={engine ? engine.lease_terms : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            }
                                            {this.state.engine['offer_for'] === 'Exchange' &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3"
                                                            className="text-sm-right text-left">{this.state.engine['offer_for']} terms</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <Form.Control
                                                        as="textarea" rows="5"
                                                        model="engine"
                                                        name="exchange_terms"
                                                        defaultValue={engine ? engine.exchange_terms : ''}
                                                        onBlur={e => this.handleChange(e)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            }
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3"
                                                            className="text-sm-right text-left">Availablity</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <ThemeProvider theme={defaultMaterialTheme}>
                                                        <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                                            <DatePicker
                                                                required
                                                                minDate={new Date('1990-01-01')}
                                                                value={availability}
                                                                format="dd/MM/yyyy"
                                                                onChange={e => this.handleChange(e, 'availability')}
                                                                animateYearScrolling
                                                            />
                                                        </MuiPickersUtilsProvider>
                                                    </ThemeProvider>
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Current
                                                    Location</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <AsyncPaginate
                                                        value={selected_current_location}
                                                        model="current_location"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'current_location')}
                                                        loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, countries, modelsLoaded)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3" className="text-sm-right text-left">Primary
                                                    Contact</Form.Label>
                                                <Col sm="9" lg="6">
                                                    <AsyncPaginate
                                                        value={selected_primary_contact}
                                                        model="primary_contact"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'primary_contact')}
                                                        loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, contacts, modelsLoaded)}
                                                    />
                                                </Col>
                                            </Form.Group>
                                            {this.state.selectedExtraFieldsCommercial.includes("owner") &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3"
                                                            className="text-sm-right text-left">Owner</Form.Label>
                                                <Col sm="6" lg="6">
                                                    <AsyncPaginate
                                                        value={selected_owner.value?selected_owner:'select...'}
                                                        model="owner"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'owner')}
                                                        loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                                    />
                                                </Col>
                                                <Col sm="3">
                                                    <IconButton aria-label="delete"
                                                                onClick={(e) => this.removeExtraFieldCommercial(e, 'owner', 'Owner')}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </Col>
                                            </Form.Group>
                                            }
                                            {this.state.selectedExtraFieldsCommercial.includes("seller") &&
                                            <Form.Group as={Row}>
                                                <Form.Label column sm="3"
                                                            className="text-sm-right text-left">Seller</Form.Label>
                                                <Col sm="6" lg="6">
                                                    <AsyncPaginate
                                                        value={selected_seller.value?selected_seller:'select...'}
                                                        model="seller"
                                                        name="name"
                                                        isClearable={true}
                                                        escapeClearsValue={true}
                                                        onChange={e => this.selectChange(e, 'seller')}
                                                        loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                                    />
                                                </Col>
                                                <Col sm="3">
                                                    <IconButton aria-label="delete"
                                                                onClick={(e) => this.removeExtraFieldCommercial(e, 'seller', 'Seller')}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </Col>
                                            </Form.Group>
                                            }
                                            {this.state.commercialExtraFields.length>0 && <Form.Group as={Row}>
                                                <Form.Label column sm="3"></Form.Label>
                                                <Col sm="6" lg="6">
                                                    <FormControl variant="outlined" fullWidth={true}>
                                                        <ThemeProvider theme={addMoreSelect}>
                                                        <SelectCore
                                                            native
                                                            value=""
                                                            onChange={(e) => this.selectMoreFieldsCommercial(e, e.target.value)}
                                                        >
                                                            <option value="" disabled>Add more details</option>
                                                            {this.state.commercialExtraFields.map(item => (
                                                                <option value={item.value}
                                                                        data-label={item.label}>{item.label}</option>
                                                            ))}
                                                        </SelectCore>
                                                        </ThemeProvider>
                                                    </FormControl>
                                                </Col>
                                            </Form.Group>}
                                        </div>
                                    </div>
                                </div>

                                <div className="kt-wizard-v1__content" data-ktwizard-type="step-content">
                                    <div className="kt-form__section kt-form__section--first">
                                        <div className="kt-wizard-v1__form">
                                            <div className="kt-heading kt-heading--md">Select or Upload Photos</div>
                                            <div className="row mb-5">
                                                <div className="col-xs-12 col-md-12">
                                                    {/*<Button onClick={() => this.medialibraryAsset.current.galleryModalOpener()}
                                                            className="btn btn-primary">
                                                        <i className="fa fa-upload"></i> Select or Upload Images
                                                    </Button>*/}
                                                    <MediaLibrary modal={false} ref={this.medialibraryAsset}
                                                                  user={selected_user.value}
                                                                  showLibrary={selected_user.value === "" ? false : true}
                                                                  selected_images={this.state.selected_images}
                                                                  insertImages={(images) => this.setState({selected_images: images})}/>
                                                    <Form.Row>
                                                        {this.state.selected_images && this.state.selected_images.length > 0 &&
                                                        <FormGroup as={Col} xs="12">
                                                            <div className="kt-heading kt-heading--md">Selected Images</div>
                                                        </FormGroup>
                                                        }
                                                        <Form.Group as={Col} xs="12">
                                                            <Gallery enableLightbox={false} id="readonlygallery" rowHeight={150}
                                                                     margin={5}
                                                                     enableImageSelection={true}
                                                                     onSelectImage={(e) => this.removeImage(e)}
                                                                     images={this.state.selected_images}
                                                                     onClickThumbnail={(e) => this.onClickThumbnail(e)}/>
                                                        </Form.Group>
                                                    </Form.Row>
                                                </div>
                                            </div>
                                            <Divider />
                                            <div className="kt-heading kt-heading--md">Upload Files</div>
                                            <div className="row mt-5">
                                                <div className="col-xs-12 col-md-6">
                                                    <Dropzone
                                                        inputContent="Drop or click to select a file."
                                                        accept=".pdf"
                                                        styles={{dropzone: {minHeight: 50}, inputLabel: {fontSize:'14px', margin: '0px'}}}
                                                        getUploadParams={(data) => this.getUploadParams(data)}
                                                        onChangeStatus={(data, status) => this.onAttachmentUpload(data, status)}
                                                        maxSizeBytes={(1024 * 1024 * 2)}
                                                        initialFiles={initialFiles}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="kt-form__actions">
                                    <div
                                        className="btn btn-secondary btn-md btn-tall btn-wide kt-font-bold kt-font-transform-u mr-2">
                                        <Link to={"/" + USER_URL + "/engine/asset"}>
                                            <i className="la la-long-arrow-left"></i>
                                            Cancel
                                        </Link>
                                    </div>
                                    <div
                                        className="btn btn-secondary btn-md btn-tall btn-wide kt-font-bold kt-font-transform-u"
                                        data-ktwizard-type="action-prev">
                                        Previous
                                    </div>
                                    <Button type="submit" onClick={(e) => this.setState({action: 'save'})}
                                            className="btn btn-success btn-md btn-tall btn-wide kt-font-bold kt-font-transform-u"
                                            data-ktwizard-type="action-submit">
                                        Submit
                                    </Button>
                                    <div
                                        className="btn btn-brand btn-md btn-tall btn-wide kt-font-bold kt-font-transform-u"
                                        data-ktwizard-type="action-next">
                                        Next Step
                                    </div>
                                </div>
                            </Form>
                        </div>
                    </div>
                    <Modal show={this.state.modalDisplay} onHide={this.handleModalClose} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Suggest Engine Information</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form.Group as={Row}>
                                <Form.Label column sm="3">
                                    Category
                                </Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        id="modal-category-id"
                                        onBlur={(e) => this.setState({meta_name: e.target.value})}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column sm="3">
                                    Manufacture
                                </Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        id="modal-manufacture-id"
                                        onBlur={(e) => this.setState({meta_name: e.target.value})}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column sm="3">
                                    Type
                                </Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        id="modal-type-id"
                                        onBlur={(e) => this.setState({meta_name: e.target.value})}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column sm="3">
                                    Model
                                </Form.Label>
                                <Col sm="9">
                                    <Form.Control
                                        type="text"
                                        id="modal-model-id"
                                        onBlur={(e) => this.setState({meta_name: e.target.value})}
                                    />
                                </Col>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={this.handleModalClose}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={this.confirm}>
                                Submit
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
        );
    }
}

class EditPage extends React.Component {
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

                <Edit data={this.props} sendError={this.sendError}/>
            </>
        );
    }
}

export default withRouter(EditPage);
