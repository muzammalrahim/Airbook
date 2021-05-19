import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Form, Col, Tab, Tabs} from "react-bootstrap";
import {Link, withRouter} from 'react-router-dom'
import {
    list, DROPDOWN_WAIT,
    post,
    loadOptions,
    API_URL,
    getToken,
    AIRCRAFT_STATUSES,
    AIRCRAFT_COMPLIANCE,
    AIRCRAFT_OFFER
} from "../../../crud/api";
import Select from 'react-select';
import DateFnsUtils from '@date-io/date-fns';
import Grid from "@material-ui/core/Grid";
import moment from "moment";
import MediaLibrary from '../../../library/media'
import Gallery from 'react-grid-gallery';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import {MuiPickersUtilsProvider, DatePicker} from "@material-ui/pickers";
import {createMuiTheme} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/styles";
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
            initialOptions: [],
            aircraft: {yom: new Date()},
            selectedFile: null,
            category: [],
            manufacturer: [],
            engine_manufacturer: [],
            countries: [],
            type: [],
            model: [],
            engine_type: [],
            engine_model: [],
            contacts: [],
            companies: [],
            configuration: [],
            users: [],
            selected_primary_contact: {value: ''},
            selected_category: {value: ''},
            selected_type: {value: ''},
            selected_engine_type: {value: ''},
            selected_manufacturer: {value: ''},
            selected_engine_manufacturer: {value: ''},
            selected_current_location: {value: ''},
            selected_model: {value: ''},
            selected_engine_model: {value: ''},
            selected_owner: {value: ''},
            selected_current_operator: {value: ''},
            selected_previous_operator: {value: ''},
            selected_manager: {value: ''},
            selected_seller: {value: ''},
            selected_configuration: {value: ''},
            selected_user: {value: 0},
            selected_status: {value: ''},
            selected_compliance: {value: ''},
            selected_offer_for: {value: ''},
            selected_registration_country: {value: ''},
            yom: new Date(),
            selected_images: [],
            attachments: [],
            initialFiles: [],
            fields: {},
            errorsf: {},
            modelsLoaded: false,
            last_c_check: null
        };
        // this.getDropdownsListing();
        this.loadModels();
    }

    handleChange(event, type) {
        var aircraft = this.state.aircraft;
        if (type !== 'yom' && type !== 'availability' && type !== 'last_c_check') {
            var attr = event.target.name;
            var val = event.target.value;
        } else if (type == 'yom') {
            var attr = type;
            var val = moment(event).format("YYYY");
            this.setState({yom: event})
        } else {
            var attr = type;
            var val = moment(event).format();
            this.setState({
                availability: (type === 'availability') ? event : this.state.availability,
                last_c_check: (type === 'last_c_check') ? event : this.state.last_c_check
            })
        }
        if (attr === 'is_active')
            val = parseInt(val);

        aircraft[attr] = val;
        this.setState({aircraft: aircraft})

        let fields = this.state.fields;
        fields[attr] = val;
        this.setState({fields});
    }

    handleSubmit(event) {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        this.setState({validated: true});
        if (!this.state.selectedFile)
            delete this.state.aircraft.file;
        let aircraft = this.state.aircraft;
        aircraft.images = this.state.selected_images;
        aircraft.attachments = this.state.attachments;
        if (this.handleValidation()) {
            post('aircrafts', aircraft).then(
                (response) => {
                    this.setState({aircraft: response.data});
                    this.state.action == 'save_new' ? this.clearForm("parts-form") : this.props.data.history.push("/admin/aircraft/asset");
                }).catch(error => {
                this.props.sendError(error.response.data);
            });
        }
    }

    loadModels() {
        let models = {
            'AbUsers': {},
            'AbCategories': {type: 'aircraft'},
            'AbContacts': {},
            'AbConfigurations': {},
            'AbManufacturers': {type: 'engine'},
            'AbCountries': {},
            'AbCompanies': {},
        }
        this.setState({cacheUnique:this.state.cacheUnique+1})
        post('abmodels', {models: models}).then(function (response) {
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
                configuration: response.data.AbConfigurations,
                engine_manufacturer: response.data.AbManufacturers,
                countries: response.data.AbCountries,
                companies: response.data.AbCompanies,
                modelsLoaded: true,
            })

        }.bind(this))
    }

    handleValidation() {
        let fields = this.state.fields;
        let errors = {};
        let formIsValid = true;

        let numbersOnly = {
            tsn: 'tsn',
            csn: 'csn',
        }
        let alphaNumberic = {
            msn: 'msn',
        }
        let numbers_only_keys = Object.keys(numbersOnly);
        let alpha_numeric_keys = Object.keys(alphaNumberic);

        for (let key in numbers_only_keys) {
            if (typeof fields[numbers_only_keys[key]] !== "undefined" && fields[numbers_only_keys[key]] !== '') {
                if (!fields[numbers_only_keys[key]].match(/^\d+$/)) {
                    formIsValid = false;
                    errors[numbers_only_keys[key]] = ["Only numbers are allowed."];
                }
            }
        }

        for (let key in alpha_numeric_keys) {
            if (typeof fields[alpha_numeric_keys[key]] !== "undefined" && fields[alpha_numeric_keys[key]] !== '') {
                if (!fields[alpha_numeric_keys[key]].match(/^([a-z0-9]+\s)*[a-z0-9]+$/i)) {
                    formIsValid = false;
                    errors[alpha_numeric_keys[key]] = ["Only alphabets and numbers are allowed."];
                }
            }
        }

        this.setState({errorsf: errors}, function () {
            this.props.sendError(this.state.errorsf)
        }.bind(this));
        return formIsValid;
    }

    fileChangedHandler = (event) => {
        let aircraft = this.state.aircraft;
        let file = event.target.files[0];
        this.setState({
            previewFile: URL.createObjectURL(file)
        });
        if (file != undefined) {
            file.size_c = file.size / 1024;

            if ((file.size_c) / 1024 > 2) {
                file.size_c = (file.size_c / 1024).toFixed(2) + ' MB';
                file.error = "Error: File is too big";
                aircraft.file = {};
                this.setState({selectedFile: file});
            } else {
                file.error = null;
                file.size_c = file.size_c.toFixed(2) + ' KB';
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    aircraft.file = reader.result;
                    this.setState({selectedFile: file, aircraft: aircraft});
                };
            }
        }
    }

    getDropdownsListing() {
        let dropdowns = {// when you have database dropdown like departments just put here
            category: 'category',
            primary_contact: 'contacts',
            configuration: 'configuration',
            manufacturer: 'manufacturer',
            current_location: 'countries',
            engine_manufacturer: 'engine_manufacturer',
            // type:'type',
            // model:'model',
            owner: 'companies',
            user: 'users'
        }

        let duplicating_dropdowns = {
            companies: ['current_operator', 'previous_operator', 'manager', 'seller'],
            countries: ['registration_country'],
            // type:['engine_type'],
            // model:['engine_model'],
        }

        let dropdown_keys = Object.keys(dropdowns);
        for (let key in dropdown_keys) {
            let params = {records: 'all', is_active: 1}, endpoint = dropdowns[dropdown_keys[key]];
            if (dropdown_keys[key] === 'category')
                params.type = 'aircraft';
            else if (dropdown_keys[key] === 'manufacturer')
                params.type = 'aircraft';
            else if (dropdown_keys[key] === 'engine_manufacturer') {
                endpoint = 'manufacturer';
                params.type = 'engine';
            }

            list(endpoint, params).then(function (response) {
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

                    if (this.state.aircraft[dropdown_keys[key]] != undefined && data[opt].id === this.state.aircraft[dropdown_keys[key]].id)
                        selected = data[opt]

                    if (duplicating_dropdowns[dropdowns[dropdown_keys[key]]] != undefined) {
                        for (let index in duplicating_dropdowns[dropdowns[dropdown_keys[key]]]) {
                            let duplicated_el = duplicating_dropdowns[dropdowns[dropdown_keys[key]]][index];
                            if (this.state.aircraft[duplicated_el] != undefined && data[opt].id === this.state.aircraft[duplicated_el].id)
                                this.setState({['selected_' + duplicated_el]: selected});
                        }
                    }
                }
                this.setState({[dropdowns[dropdown_keys[key]]]: data, ['selected_' + dropdown_keys[key]]: selected});

            }.bind(this));
        }
    }

    selectChange(value, key) {
        let aircraft = this.state.aircraft;
        aircraft[key] = value && value.value ? value.value : '';
        this.setState({['selected_' + key]: value ? value : '', aircraft: aircraft});

        if (['category', 'manufacturer', 'type', 'engine_manufacturer', 'engine_type'].indexOf(key) > -1 && value) {
            let key_to_update = '', models = {};
            if (key === 'category') {
                models = {
                    AbManufacturers: {categories__id: value.id, type: 'aircraft'}
                }
                key_to_update = 'manufacturer';
            } else if (key === 'manufacturer') {
                models = {
                    AbTypes: {manufacturer_id: value.id, type: 'aircraft'}
                }
                key_to_update = 'type';
            } else if (key === 'type') {
                models = {
                    AbModels: {type_0: value.id, type: 'aircraft'}
                }
                key_to_update = 'model';
            } else if (key === 'engine_manufacturer') {
                models = {
                    AbTypes: {manufacturer_id: value.id, type: 'engine'}
                }
                key_to_update = 'engine_type';
            } else if (key === 'engine_type') {
                models = {
                    AbModels: {type_0: value.id, type: 'engine'}
                }
                key_to_update = 'engine_model';
            }

            post('abmodels', {models: models}).then(function (response) {
                let selected = {};
                for (let opt in response.data) {
                    response.data[opt].map((row, i) => {
                        response.data[opt][i].label = row.name;
                        response.data[opt][i].value = row.id;

                        if (this.state.aircraft[key_to_update] != undefined && row.id === this.state.aircraft[key_to_update].id)
                            selected = row;
                    })
                    this.setState({
                        [key_to_update]: response.data[opt], ['selected_' + key_to_update]: selected
                    })
                }
            }.bind(this))

        }
    }

    setTab(event, tab) {
        document.getElementById('aircraft-tabs-tab-' + tab).click();
    }

    removeImage(index) {
        let selected_images = this.state.selected_images;
        selected_images = selected_images.filter((val, i) => {
            return index !== i;
        })
        this.setState({selected_images: selected_images});
    }

    clearForm = () => {
        this.props.data.history.replace("/admin/aircraft/asset");
        this.props.data.history.replace("/admin/aircraft/asset/create");
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
        body.append('attachable_type', 'Aircraft');

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

    onBlur() {
        // let blurHandler = this.props.onBlur;
        // if (blurHandler) {
        //     blurHandler({
        //         type: 'focus',
        //         target: {
        //             value: this.state.value
        //         }
        //     })
        // }
    }

    render() {
        const {modelsLoaded,
            initialOptions, value, availability, aircraft, last_c_check, selected_manufacturer, manufacturer,
            selected_category, category, selected_current_location, countries, selected_type, type,
            selected_primary_contact, contacts, model, engine_type, engine_model, selected_model, selected_registration_country,
            selected_owner, selected_current_operator, selected_previous_operator, companies,
            selected_seller, selected_manager, selected_configuration, configuration,
            selected_engine_model, selected_engine_type, selected_engine_manufacturer, selected_user,
            users, selected_status, selected_compliance, selected_offer_for, yom, initialFiles, engine_manufacturer
        } = this.state;
        return (
            <Form
                noValidate
                id="create-course-form"
                onSubmit={e => this.handleSubmit(e)}
            >
                <Tabs defaultActiveKey="basic" id="aircraft-tabs">

                    <Tab eventKey="basic" title="Basic">
                        <Form.Row>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>User *</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
                                    model="user"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_user.value ? selected_user : 'select...'}
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
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'category')}
                                    options={category}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Manufacturer *</Form.Label>
                                <Select
                                    value={selected_manufacturer.value ? selected_manufacturer :'select...'}
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
                                    value={selected_type.value ? selected_type :'select...'}
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
                                    value={selected_model.value ? selected_model :'select...'}
                                    model="model"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'model')}
                                    options={model}
                                />
                            </Form.Group>
                        </Form.Row>
                        <Button onClick={(e) => this.setTab(e, 'aircraft')} className="btn btn-primary">
                            Next
                        </Button>
                    </Tab>
                    <Tab eventKey="aircraft" title="Aircraft">
                        <Form.Row>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>MSN</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="msn"
                                    defaultValue={aircraft ? aircraft.msn : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>YOM</Form.Label>
                                <ThemeProvider theme={defaultMaterialTheme}>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <DatePicker
                                            views={["year"]}
                                            minDate={new Date('1980')}
                                            name="yom"
                                            value={yom}
                                            onChange={e => this.handleChange(e, 'yom')}
                                        />
                                    </MuiPickersUtilsProvider>
                                </ThemeProvider>
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Configuration</Form.Label>
                                <Select
                                    value={selected_configuration.value ? selected_configuration :'select...'}
                                    model="current_configuration"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'configuration')}
                                    options={configuration}
                                />
                            </Form.Group>
                            <Form.Group as={Col} xs="12" style={{marginBottom: 0}}>
                                <Form.Label>Seating</Form.Label>
                                <Form.Row>
                                    <Form.Group as={Col} md="4" xs="12">
                                        <Form.Control
                                            required
                                            type="text"
                                            placeholder="Y (Economy)"
                                            model="aircraft"
                                            name="seating_first_class"
                                            defaultValue={aircraft ? aircraft.seating_first_class : ''}
                                            onBlur={e => this.handleChange(e)}
                                        />
                                    </Form.Group>
                                    <Form.Group as={Col} md="4" xs="12">
                                        <Form.Control
                                            required
                                            type="text"
                                            placeholder="Y (Business)"
                                            model="aircraft"
                                            name="seating_business"
                                            defaultValue={aircraft ? aircraft.seating_business : ''}
                                            onBlur={e => this.handleChange(e)}
                                        />
                                    </Form.Group>
                                    <Form.Group as={Col} md="4" xs="12">
                                        <Form.Control
                                            required
                                            type="text"
                                            placeholder="Y (First Class)"
                                            model="aircraft"
                                            name="seating_economy"
                                            defaultValue={aircraft ? aircraft.seating_economy : ''}
                                            onBlur={e => this.handleChange(e)}
                                        />
                                    </Form.Group>
                                </Form.Row>
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Status</Form.Label>
                                <Select
                                    value={selected_status.value ? selected_status :'select...'}
                                    model="aircraft"
                                    name="status"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'status')}
                                    options={AIRCRAFT_STATUSES}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Compliance</Form.Label>
                                <Select
                                    value={selected_compliance.value ? selected_compliance :'select...'}
                                    model="aircraft"
                                    name="compliance"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'compliance')}
                                    options={AIRCRAFT_COMPLIANCE}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>TSN</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="tsn"
                                    defaultValue={aircraft ? aircraft.tsn : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>CSN</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="csn"
                                    defaultValue={aircraft ? aircraft.csn : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>MTOW Kg</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="mtow"
                                    defaultValue={aircraft ? aircraft.mtow : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>MLGW Kg</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="mlgw"
                                    defaultValue={aircraft ? aircraft.mlgw : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Last C Check</Form.Label>
                                <ThemeProvider theme={defaultMaterialTheme}>
                                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                        <DatePicker
                                            minDate={new Date('1990-01-01')}
                                            value={last_c_check}
                                            format="dd/MM/yyyy"
                                            onChange={e => this.handleChange(e, 'last_c_check')}
                                            animateYearScrolling
                                        />
                                    </MuiPickersUtilsProvider>
                                </ThemeProvider>
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Registration Number</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="registration_number"
                                    defaultValue={aircraft ? aircraft.registration_number : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Registration Country</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
                                    model="registration_country"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_registration_country.value ? selected_registration_country :'select...'}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, countries, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'registration_country')}
                                />
                            </Form.Group>
                        </Form.Row>

                        <Button onClick={(e) => this.setTab(e, 'engine')} className="btn btn-primary">
                            Next
                        </Button>
                    </Tab>
                    <Tab eventKey="engine" title="Engines">
                        <Form.Row>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Engine Manufacturer</Form.Label>
                                <Select
                                    value={selected_engine_manufacturer.value ? selected_engine_manufacturer :'select...'}
                                    model="engine_manufacturer"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'engine_manufacturer')}
                                    options={engine_manufacturer}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Engine Type</Form.Label>
                                <Select
                                    value={selected_engine_type.value ? selected_engine_type:'select...'}
                                    model="engine_type"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'engine_type')}
                                    options={engine_type}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Engine Model</Form.Label>
                                <Select
                                    value={selected_engine_model.value ? selected_engine_model :'select...'}
                                    model="engine_model"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'engine_model')}
                                    options={engine_model}
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
                                    value={selected_offer_for.value ? selected_offer_for :'select...'}
                                    model="aircraft"
                                    name="offer_for"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'offer_for')}
                                    options={AIRCRAFT_OFFER}
                                />
                            </Form.Group>
                            {this.state.aircraft['offer_for'] === 'Sale' &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Asking Price</Form.Label>
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="price"
                                    defaultValue={aircraft ? aircraft.price : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            }
                            {this.state.aircraft['offer_for'] === 'ACMI' &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>MGH / m</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder=""
                                    model="aircraft"
                                    name="mgh"
                                    defaultValue={aircraft ? aircraft.mgh : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            }
                            {(
                                this.state.aircraft['offer_for'] === 'Dry Lease' ||
                                this.state.aircraft['offer_for'] === 'Wet Lease' ||
                                this.state.aircraft['offer_for'] === 'Lease Purchase' ||
                                this.state.aircraft['offer_for'] === 'Exchange' ||
                                this.state.aircraft['offer_for'] === 'Charter'
                            )
                            &&
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>{this.state.aircraft['offer_for']} terms</Form.Label>
                                <Form.Control
                                    as="textarea" rows="5"
                                    model="aircraft"
                                    name="terms"
                                    defaultValue={aircraft ? aircraft.terms : ''}
                                    onBlur={e => this.handleChange(e)}
                                />
                            </Form.Group>
                            }
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Availablity</Form.Label>
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
                                <Form.Label>Current Location</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
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
                                <Form.Label>Primary Contact</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
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
                                    options={initialOptions}
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
                                    options={initialOptions}
                                    model="seller"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_seller.value ? selected_seller :'select...'}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'seller')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Manager</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
                                    model="selected_manager"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_manager.value ? selected_manager :'select...'}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'manager')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Previous Operator</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
                                    model="previous_operator"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_previous_operator.value ? selected_previous_operator :'select...'}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'previous_operator')}
                                />
                            </Form.Group>
                            <Form.Group as={Col} md="4" xs="12">
                                <Form.Label>Current Operator</Form.Label>
                                <AsyncPaginate
                                    debounceTimeout={!modelsLoaded ? DROPDOWN_WAIT : 0}
                                    options={initialOptions}
                                    model="current_operator"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    value={selected_current_operator.value ? selected_current_operator :'select...'}
                                    name="name"
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, companies, modelsLoaded)}
                                    onChange={e => this.selectChange(e, 'current_operator')}
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
                                              model="aircraft"
                                              name="description"
                                              defaultValue={aircraft ? aircraft.description : ''}
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

                        <Link to={"/admin/aircraft/asset"} className="btn btn-danger">
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
                                const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
                                return <li key={index + i}><span
                                    style={{'text-transform': 'capitalize'}}>{fieldName.replace(/_/g, " ")}</span> : {error}
                                </li>
                            });
                        })
                    }
                </Notice>

                <div className="row">
                    <div className="col-md-12">
                        <CustomHead
                            beforeCodeTitle={"Aircraft"}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <Link to={"/admin/aircraft/asset"} className="btn btn-clean btn-icon-sm">
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