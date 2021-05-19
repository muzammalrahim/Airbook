import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Form, Col, Tab, Tabs} from "react-bootstrap";
import {Link, withRouter} from 'react-router-dom'
import {list, patch, DROPDOWN_WAIT, getToken, loadOptions, MEDIA_URL, API_URL, ENGINE_STATUSES, ENGINE_OFFER, post} from "../../../crud/api";
import Select from 'react-select';
import Gallery from 'react-grid-gallery';
import DeleteForeverOutlinedIcon from '@material-ui/icons/DeleteForeverOutlined';
import MediaLibrary from '../../../library/media'
import Grid from "@material-ui/core/Grid";
import DateFnsUtils from '@date-io/date-fns';
import {MuiPickersUtilsProvider, DatePicker} from "@material-ui/pickers";
import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
import moment from "moment";
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
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


class Edit extends React.Component {

    constructor(props) {
        super(props);
        const {apu_id, type} = this.props.data.match.params
        this.medialibraryAsset = React.createRef();

        this.state = {
            validated: false,
            apu: {},
            selectedFile: null,
            category: [],
            manufacturer: [],
            countries: [],
            type: [],
            contacts: [],
            model: [],
            companies: [],
            users: [],
            selected_primary_contact: {value: ''},
            selected_category: {value: ''},
            selected_type: {value: ''},
            selected_manufacturer: {value: ''},
            selected_current_location: {value: ''},
            selected_model: {value: ''},
            selected_owner: {value: ''},
            selected_seller: {value: ''},
            selected_user: {value: ''},
            selected_status: {value: ''},
            selected_offer_for: {value: ''},
            selected_images: [],
            attachments: [],
            initialFiles: [],
            modelsLoaded:false
        };
        this.getApu(apu_id);
    }

    getApu(apu_id) {
        list('apus/' + apu_id + '/').then(
            (response) => {
                this.setState({
                  apu: response.data,
                  availability: response.data.availability,
                })
                // this.getDropdownsListing();
                this.loadModels();

                if (response.data.manufacturer.id != undefined && response.data.manufacturer.id != "")
                    this.setDynamicDropdowns(response.data.manufacturer.id, 'manufacturer');

                if (response.data.type.id != undefined && response.data.type.id != "")
                    this.setDynamicDropdowns(response.data.type.id, 'type');

                this.loadSelectedImages(response.data.media);
                this.loadInitialFields();
            });
    }

    loadModels() {
        let apu_data = this.state.apu;

        // static dropdowns calculation here -

        let static_dropdowns = { // when you have static dropdown like gender just put here
            status: ENGINE_STATUSES,
            offer_for: ENGINE_OFFER
        }

        let dropdown_keys = Object.keys(static_dropdowns);
        for (let key in dropdown_keys) {
            for (let index in static_dropdowns[dropdown_keys[key]]) {
                if (static_dropdowns[dropdown_keys[key]][index].value === apu_data[dropdown_keys[key]]) {
                    this.setState({['selected_' + dropdown_keys[key]]: static_dropdowns[dropdown_keys[key]][index]});
                    break;
                }
            }
        }

        let models = {
            'AbUsers': {},
            'AbCategories': {type: 'apu'},
            'AbContacts': {},
            'AbCountries': {},
            'AbCompanies': {},
        }

        // lets do some mapping to avoid if else conditions
        let state_endpoints = {
            AbUsers: ['user'],
            AbContacts: ['primary_contact'],
            AbCategories: ['category'],
            AbManufacturers: ['manufacturer'],
            AbCountries: ['current_location'],
            AbCompanies: ['owner', 'seller']
        }

        if (apu_data.category !== null && apu_data.category.id !== undefined) {
            models['AbManufacturers'] = {type: 'apu', categories__id: apu_data.category.id}
            state_endpoints['AbManufacturers'] = ['manufacturer']
        }

        if (apu_data.manufacturer != null && apu_data.manufacturer.id != undefined) {
            models['AbTypes'] = {type: 'apu', manufacturer_id: apu_data.manufacturer.id}
            state_endpoints['AbTypes'] = ['type']
        }

        if (apu_data.type != null && apu_data.type.id != undefined) {
            models['AbModels'] = {type: 'apu', type_0: apu_data.type.id}
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
                            if (opt === key && apu_data[state] !== null && apu_data[state].id !== undefined && apu_data[state].id === row.id)
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

            if (apu_data.category !== null && apu_data.category.id !== undefined)
                newStates['manufacturer'] = response.data.AbManufacturers;

            if (apu_data.manufacturer != null && apu_data.manufacturer.id != undefined)
                newStates['type'] = response.data.AbTypes;

            if (apu_data.type != null && apu_data.type.id != undefined)
                newStates['model'] = response.data.AbModels;

            newStates['modelsLoaded'] = true;
            this.setState(newStates);
        }.bind(this))
    }


    handleChange(event, type) {
        var apu = this.state.apu;
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
        apu[attr] = val;
        this.setState({apu: apu})
    }

    formatDate(date, val) {
        var hours = date.getHours();
        hours = hours < 10 ? '0' + hours : hours;
        var minutes = date.getMinutes();
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ':00.000000Z';
        return val + "T" + strTime;
    }

    handleSubmit(event) {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        this.setState({validated: true});
        this.checkDataFormat(); // this is done to convert foregin table objects into pk
        if (!this.state.selectedFile)
            delete this.state.apu.file;
        patch('apus/' + this.state.apu.id + '/', this.state.apu).then(
            (response) => {
                this.setState({apu: response.data});
                this.props.data.history.push(this.state.action == 'save_new' ? "/admin/apu/asset/create" : "/admin/apu/asset");
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }

    checkDataFormat() {
        let apu = this.state.apu;
        let related_data = ['category', 'primary_contact', 'manufacturer', 'current_location',
            'type', 'model', 'owner', 'user', 'seller'];
        related_data.map((val, i) => {
            apu[val] = this.state['selected_' + val].value;
        })
        apu.images = this.state.selected_images;
        apu.attachments = this.state.attachments;
        this.setState({apu: apu});
    }

    getDropdownsListing() {
        let apu_data = this.state.apu;
        let dropdowns = {// when you have database dropdown like departments just put here
            category: 'category',
            primary_contact: 'contacts',
            manufacturer: 'manufacturer',
            current_location: 'countries',
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
                if (static_dropdowns[dropdown_keys[key]][index].value === apu_data[dropdown_keys[key]]) {
                    this.setState({['selected_' + dropdown_keys[key]]: static_dropdowns[dropdown_keys[key]][index]});
                    break;
                }
            }
        }

        dropdown_keys = Object.keys(dropdowns);
        for (let key in dropdown_keys) {
            let params = {records: 'all'}
            if (dropdowns[dropdown_keys[key]] === 'manufacturer')
                params.type = 'apu';
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

                    if (apu_data[dropdown_keys[key]] != undefined && data[opt].id === apu_data[dropdown_keys[key]].id)
                        selected = data[opt]

                    if (duplicating_dropdowns[dropdowns[dropdown_keys[key]]] != undefined) {
                        for (let index in duplicating_dropdowns[dropdowns[dropdown_keys[key]]]) {
                            let duplicated_el = duplicating_dropdowns[dropdowns[dropdown_keys[key]]][index];

                            if (apu_data[duplicated_el] != undefined && data[opt].id === apu_data[duplicated_el].id) {
                                this.setState({['selected_' + duplicated_el]: data[opt]});
                            }
                        }
                    }
                }
                this.setState({
                    [dropdowns[dropdown_keys[key]]]: data,
                    ['selected_' + dropdown_keys[key]]: selected,
                    apu: apu_data
                });

            }.bind(this));
        }
    }

    selectChange(value, key) {
        let apu = this.state.apu;
        apu[key] = value && value.value ? value.value : '';
        this.setState({['selected_' + key]: value ? value : '', apu: apu});
        this.setDynamicDropdowns(value && value.id ? value.id : '', key);
    }

    setDynamicDropdowns(id, key) {
        if (['category', 'manufacturer', 'type'].indexOf(key) > -1 && id !== '') {
            let endpoint = '', params = {}, key_to_update = '', models = {};
            if (key === 'category') {
                models = {
                    AbManufacturers: {categories__id: id, type: 'apu'}
                }
                key_to_update = 'manufacturer';
            } else if (key === 'manufacturer') {
                models = {
                    AbTypes: {manufacturer_id: id, type: 'apu'}
                }
                key_to_update = 'type';
            } else if (key === 'type') {
                models = {
                    AbModels: {type_0: id, type: 'apu'}
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
        document.getElementById('apu-tabs-tab-' + tab).click();
    }

    removeImage(index) {
        let selected_images = this.state.selected_images;
        selected_images = selected_images.filter((val, i) => {
            return index !== i;
        })
        this.setState({selected_images: selected_images});
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

    getUploadParams(data) {
        const body = new FormData()
        body.append('original_file_name', data.file)
        body.append('user', this.state.selected_user.value);
        body.append('attachable_type', 'Apu');

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

    loadInitialFields() {
        if (this.state.apu.attachments !== undefined) {
            let initialFiles = [];
            this.state.apu.attachments.map((val, i) => {
                let file = new File(['foo'], MEDIA_URL + val.original_file_name);
                file.id = val.id;
                file.existing = true;
                initialFiles.push(file);
            })
            this.setState({initialFiles: initialFiles});
        }
    }

    render() {
        const {modelsLoaded,
            availability, apu, selectedFile, selected_manufacturer, manufacturer,
            selected_category, category, selected_current_location, countries, selected_type, type,
            selected_primary_contact, contacts, model, selected_model, selected_owner, companies,
            selected_seller, selected_user, users, selected_status, selected_offer_for, initialFiles
        } = this.state;
        return (
            <Form
                noValidate
                onSubmit={e => this.handleSubmit(e)}
            >
                <Tabs defaultActiveKey="apu" id="apu-tabs">
                    <Tab eventKey="apu" title="Apus">
                        <Form.Row>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>User *</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                        model="user"
                                        isClearable = {true}
                                        escapeClearsValue = {true}
                                        value={selected_user.value ? selected_user :'select...'}
                                        name="name"
                                        loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, users, modelsLoaded)}
                                        onChange={e => this.selectChange(e, 'user')}
                                    />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Category *</Form.Label>
                                <Select
                                    value={selected_category.value ? selected_category :'select...'}
                                    model="category"
                                    name="name"
                                    isClearable = {true}
                                    escapeClearsValue = {true}
                                    onChange={e => this.selectChange(e, 'category')}
                                    options={category}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Manfacturer *</Form.Label>
                                <Select
                                    value={selected_manufacturer.value ? selected_manufacturer :'select...'}
                                    model="manufacturer"
                                    name="name"
                                    isClearable = {true}
                                    escapeClearsValue = {true}
                                    onChange={e => this.selectChange(e, 'manufacturer')}
                                    options={manufacturer}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Type *</Form.Label>
                                <Select
                                    value={selected_type.value ? selected_type :'select...'}
                                    model="type"
                                    name="name"
                                    isClearable = {true}
                                    escapeClearsValue = {true}
                                    onChange={e => this.selectChange(e, 'type')}
                                    options={type}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Model</Form.Label>
                                <Select
                                    value={selected_model.value ? selected_model :'select...'}
                                    model="model"
                                    name="name"
                                    isClearable = {true}
                                    escapeClearsValue = {true}
                                    onChange={e => this.selectChange(e, 'model')}
                                    options={model}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Serial Number *</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="apu"
                                    name="serial_number"
                                    defaultValue={apu ? apu.serial_number : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Part Number</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="apu"
                                    name="part_number"
                                    defaultValue={apu ? apu.part_number : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Cycles Reamining (CR)</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="apu"
                                    name="cycle_remaining"
                                    defaultValue={apu ? apu.cycle_remaining : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Current Status</Form.Label>
                                <Select
                                    value={selected_status.value ? selected_status :'select...'}
                                    model="apu"
                                    name="status"
                                    isClearable = {true}
                                    escapeClearsValue = {true}
                                    onChange={e => this.selectChange(e, 'status')}
                                    options={ENGINE_STATUSES}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Thrust Rating</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="apu"
                                    name="thrust_rating"
                                    defaultValue={apu ? apu.thrust_rating : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>LSV Description</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="apu"
                                    name="lsv_description"
                                    defaultValue={apu ? apu.lsv_description : ''}
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
                                    model="apu"
                                    name="offer_for"
                                    isClearable = {true}
                                    escapeClearsValue = {true}
                                    onChange={e => this.selectChange(e, 'offer_for')}
                                    options={ENGINE_OFFER}
                                />
                            </Form.Group>
                            {this.state.apu['offer_for'] === 'Sale' &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Asking Price</Form.Label>
                                    <Form.Control
                                        required
                                        type="text"
                                        placeholder=""
                                        model="apu"
                                        name="price"
                                        defaultValue={apu ? apu.price : ''}
                                        onBlur={e => this.handleChange(e)}
                                    />
                            </Form.Group>
                            }
                            {(
                                this.state.apu['offer_for'] === 'Lease' ||
                                this.state.apu['offer_for'] === 'Lease Purchase'
                            )
                            &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>{this.state.apu['offer_for']} terms</Form.Label>
                                    <Form.Control
                                        as="textarea" rows="5"
                                        model="apu"
                                        name="lease_terms"
                                        defaultValue={apu ? apu.lease_terms : ''}
                                        onBlur={e => this.handleChange(e)}
                                    />
                            </Form.Group>
                            }
                            {this.state.apu['offer_for'] === 'Exchange' &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>{this.state.apu['offer_for']} terms</Form.Label>

                                    <Form.Control
                                        as="textarea" rows="5"
                                        model="apu"
                                        name="exchange_terms"
                                        defaultValue={apu ? apu.exchange_terms : ''}
                                        onBlur={e => this.handleChange(e)}
                                    />
                            </Form.Group>
                            }
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Availability</Form.Label>
                                <ThemeProvider theme={defaultMaterialTheme}>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <DatePicker
                                            value={availability}
                                            minDate={availability}
                                            format="dd/MM/yyyy"
                                            onChange={e => this.handleChange(e, 'availability')}
                                            animateYearScrolling
                                        />
                                    </MuiPickersUtilsProvider>
                                </ThemeProvider>
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Current Location</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    model="current_location"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_current_location.value ? selected_current_location :'select...'}
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
                                    value={selected_primary_contact.value ? selected_primary_contact :'select...'}
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
                                    value={selected_owner.value ? selected_owner :'select...'}
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
                                    value={selected_seller.value ? selected_seller : 'select...'}
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
                            <MediaLibrary modal={true} ref={this.medialibraryAsset} user={selected_user.value}
                                          showLibrary={selected_user.value === "" ? false : true}
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
                                              model="apu"
                                              name="description"
                                              defaultValue={apu ? apu.description : ''}
                                              onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Button type="submit" onClick={(e) => this.setState({action: 'save'})}
                                className="btn btn-primary">
                            <i className="la la-save"/>
                            Update
                        </Button>
                        &nbsp;&nbsp;

                        <Link to={"/admin/apu/asset"} className="btn btn-danger">
                            <i className="la la-remove"/>
                            Cancel
                        </Link>
                    </Tab>
                </Tabs>
            </Form>
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
                                            <Link to={"/apu/asset"} className="btn btn-clean btn-icon-sm">
                                                <i className="la la-long-arrow-left"></i>
                                                Back
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            }>
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