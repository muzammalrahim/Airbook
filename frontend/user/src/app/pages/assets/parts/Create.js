import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Form, Col, Row} from "react-bootstrap";
import {
    FormControl, Select as SelectCore, IconButton, createMuiTheme,
} from "@material-ui/core";
import {Link, withRouter} from 'react-router-dom'
import {list, post, loadOptions, USER_URL, UNIT_MEASURES, PARTS_EXTRA_FIELDS} from "../../../crud/api";
import Select from 'react-select';
import DeleteIcon from '@material-ui/icons/Delete';
import AsyncPaginate from "react-select-async-paginate";
import {ThemeProvider} from "@material-ui/styles";

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

class Create extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            validated: false,
            part: {user:props.data.extra_data.user.id,primary_contact:props.data.extra_data.user.contact.id},
            selectedFile: null,
            countries: [],
            contacts: [],
            companies: [],
            users: [],
            conditions: [],
            releases: [],
            selected_primary_contact: {
                id:props.data.extra_data.user.contact.id,
                label:props.data.extra_data.user.contact.first_name+' '+props.data.extra_data.user.contact.last_name,
                value:true
            },
            selected_owner: {value: ''},
            selected_seller: {value: ''},
            selected_user: {value: this.props.data.extra_data.user ? this.props.data.extra_data.user.id : null},
            selected_release: {value: ''},
            selected_unit_measure: {value: ''},
            selected_condition: {value: ''},
            partsExtraFields: PARTS_EXTRA_FIELDS,
            selectedExtraFieldsParts: [],
            modelsLoaded: false
        };
        //this.getDropdownsListing();
        this.loadModels();
    }

    handleChange(event) {
        var part = this.state.part;
        var attr = event.target.name;
        var val = event.target.value;
        if (attr === 'is_active')
            val = parseInt(val);

        part[attr] = val;
        this.setState({part: part})
    }

    handleSubmit(event) {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        this.setState({validated: true});
        if (!this.state.selectedFile)
            delete this.state.part.file;
        post('parts', this.state.part).then(
            (response) => {
                this.setState({part: response.data});
                this.props.data.history.push(this.state.action == 'save_new' ? this.clearForm("parts-form") : "/" + USER_URL + "/part/asset");
            }).catch(error => {
            this.props.sendError(error.response.data);
        });
    }

    loadModels() {
        let models = {
            'AbUsers': {},
            'AbContacts': {},
            'AbConditions': {},
            'AbReleases': {},
            'AbCountries': {},
            'AbCompanies': {},
        }
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
                contacts: response.data.AbContacts,
                conditions: response.data.AbConditions,
                releases: response.data.AbReleases,
                countries: response.data.AbCountries,
                companies: response.data.AbCompanies,
                modelsLoaded: true
            })
        }.bind(this))
    }

    getDropdownsListing() {
        let dropdowns = {// when you have database dropdown like departments just put here
            // dbcolumn: api_endpoint
            primary_contact: 'contacts',
            location: 'countries',
            owner: 'companies',
            user: 'users',
            condition: 'conditions',
            release: 'releases'
        }

        let duplicating_dropdowns = {
            companies: ['seller'],
        }

        let dropdown_keys = Object.keys(dropdowns);
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

                    if (this.state.part[dropdown_keys[key]] != undefined && data[opt].id === this.state.part[dropdown_keys[key]].id)
                        selected = data[opt]

                    if (duplicating_dropdowns[dropdowns[dropdown_keys[key]]] != undefined) {
                        for (let index in duplicating_dropdowns[dropdowns[dropdown_keys[key]]]) {
                            let duplicated_el = duplicating_dropdowns[dropdowns[dropdown_keys[key]]][index];
                            if (this.state.part[duplicated_el] != undefined && data[opt].id === this.state.part[duplicated_el].id)
                                this.setState({['selected_' + duplicated_el]: selected});
                        }
                    }
                }
                this.setState({[dropdowns[dropdown_keys[key]]]: data, ['selected_' + dropdown_keys[key]]: selected});

            }.bind(this));
        }
    }

    selectChange(value, key) {
        let part = this.state.part;
        part[key] = value && value.value ? value.value : '';
        this.setState({['selected_' + key]: value ? value : '', part: part});
    }

    setTab(event, tab) {
        document.getElementById('part-tabs-tab-' + tab).click();
    }

    clearForm = (id) => {
        this.props.data.history.replace("/" + USER_URL + "/part/asset");
        this.props.data.history.replace("/" + USER_URL + "/part/asset/create");
    }

    selectMoreFields(event, key) {
        let partsExtraFields = [...this.state.partsExtraFields];
        partsExtraFields.splice(event.target.selectedIndex - 1, 1);
        this.setState({partsExtraFields: partsExtraFields});
        this.setState(state => {
            const selectedExtraFieldsParts = [...state.selectedExtraFieldsParts, key];
            return {
                selectedExtraFieldsParts,
            };
        });
    }

    removeExtraField(event, key, label) {
        let partsExtraFields = [...this.state.partsExtraFields, {label: label, value: key}];
        this.setState({partsExtraFields: partsExtraFields});
        let selectedExtraFieldsParts = this.state.selectedExtraFieldsParts;
        selectedExtraFieldsParts = selectedExtraFieldsParts.filter((val, i) => {
            return key !== val;
        })
        this.setState({selectedExtraFieldsParts: selectedExtraFieldsParts});
    }

    render() {
        const {
            validated, part, selectedFile, selected_location, countries, selected_primary_contact,
            contacts, selected_owner, companies, selected_seller, selected_user, users, conditions,
            selected_condition, releases, selected_release, selected_unit_measure, modelsLoaded
        } = this.state;
        return (
            <Form
                noValidate
                id="parts-form"
                onSubmit={e => this.handleSubmit(e)}
            >
                <Form.Row>
                    <Form.Group as={Col} md="4" xs="12">
                        <Form.Label>Part Number</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder=""
                            model="part"
                            name="part_number"
                            defaultValue={part ? part.part_number : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4" xs="12">
                        <Form.Label>Alternate Part Number</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder=""
                            model="part"
                            name="alternate_part_number"
                            defaultValue={part ? part.alternate_part_number : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4" xs="12">
                        <Form.Label>Condition</Form.Label>
                        <Select
                            value={selected_condition.value?selected_condition:'select...'}
                            model="condition"
                            name="name"
                            isClearable={true}
                            escapeClearsValue={true}
                            onChange={e => this.selectChange(e, 'condition')}
                            options={conditions}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4" xs="12">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                            required
                            type="number"
                            placeholder=""
                            model="part"
                            name="quantity"
                            defaultValue={part ? part.quantity : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4" xs="12">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          required
                          type="text"
                          placeholder=""
                          model="part"
                          name="description"
                          defaultValue={part ? part.description : ''}
                          onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                </Form.Row>
                <Form.Row>
                    {this.state.selectedExtraFieldsParts.includes("primary_contact") &&
                    <Col sm="6">
                        <Form.Group as={Row}>
                            <Form.Label>Primary Contact</Form.Label>
                            <Col sm="9" lg="8">
                                <AsyncPaginate
                                    value={selected_primary_contact.value?selected_primary_contact:'select...'}
                                    model="primary_contact"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'primary_contact')}
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, contacts, modelsLoaded)}
                                />
                            </Col>
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                        onClick={(e) => this.removeExtraField(e, 'primary_contact', 'Primary Contact')}>
                                <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                    {this.state.selectedExtraFieldsParts.includes("release") &&
                    <Col sm="6">
                        <Form.Group as={Row}>
                            <Form.Label column sm="2" className="text-left">Release</Form.Label>
                            <Col sm="9" lg="8">
                                <Select
                                    value={selected_release.value?selected_release:'select...'}
                                    model="release"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'release')}
                                    options={releases}
                                />
                            </Col>
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                            onClick={(e) => this.removeExtraField(e, 'release', 'Release')}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                    {this.state.selectedExtraFieldsParts.includes("location") &&
                    <Col sm="6">
                        <Form.Group as={Row}>
                            <Form.Label column sm="2" className="text-left">Location</Form.Label>
                            <Col sm="9" lg="8">
                                <AsyncPaginate
                                    value={selected_location?selected_location:'select...'}
                                    model="location"
                                    name="name"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'location')}
                                    loadOptions={(search, prevOptions) => loadOptions(search, prevOptions, countries, modelsLoaded)}
                                />
                            </Col>
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                            onClick={(e) => this.removeExtraField(e, 'location', 'Location')}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                    {this.state.selectedExtraFieldsParts.includes("unit_measure") &&
                    <Col sm="6">
                        <Form.Group as={Row}>
                            <Form.Label column sm="2" className="text-left">Unit Measure</Form.Label>
                            <Col sm="9" lg="8">
                                <Select
                                    value={selected_unit_measure.value?selected_unit_measure:'select...'}
                                    model="part"
                                    name="unit_measure"
                                    isClearable={true}
                                    escapeClearsValue={true}
                                    onChange={e => this.selectChange(e, 'unit_measure')}
                                    options={UNIT_MEASURES}
                                />
                            </Col>
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                            onClick={(e) => this.removeExtraField(e, 'unit_measure', 'Unit Measure')}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                    {this.state.selectedExtraFieldsParts.includes("price") &&
                    <Col sm="6">
                        <Form.Group as={Row}>
                            <Form.Label column sm="2" className="text-left">Price</Form.Label>
                            <Col sm="9" lg="8">
                                <Form.Control
                                    required
                                    type="text"
                                    placeholder="USD"
                                    model="part"
                                    name="price"
                                    defaultValue={part ? part.price : ''}
                                    onChange={e => this.handleChange(e)}
                                />
                            </Col>
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                            onClick={(e) => this.removeExtraField(e, 'price', 'Price')}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                </Form.Row>
                <Form.Row>
                    {this.state.selectedExtraFieldsParts.includes("owner") &&
                    <Col sm="6">
                        <Form.Group as={Row}>
                            <Form.Label column sm="2" className="text-left">Owner</Form.Label>
                            <Col sm="9" lg="8">
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
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                            onClick={(e) => this.removeExtraField(e, 'owner', 'Owner')}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                    {this.state.selectedExtraFieldsParts.includes("seller") &&
                    <Col sm="6">
                    <Form.Group as={Row}>
                        <Form.Label column sm="2" className="text-left">Seller</Form.Label>
                        <Col sm="9" lg="8">
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
                            <Col sm="2">
                                <IconButton aria-label="delete"
                                            onClick={(e) => this.removeExtraField(e, 'seller', 'Seller')}>
                                    <DeleteIcon/>
                                </IconButton>
                            </Col>
                        </Form.Group>
                    </Col>
                    }
                </Form.Row>
                {this.state.partsExtraFields.length>0 && <Form.Group as={Row}>
                    <Col sm="2" lg="2">
                        <FormControl variant="outlined" fullWidth={true}>
                            <ThemeProvider theme={addMoreSelect}>
                            <SelectCore
                                native
                                value=""
                                onChange={(e) => this.selectMoreFields(e, e.target.value)}
                            >
                                <option value="" disabled>Add more details</option>
                                {this.state.partsExtraFields.map(item => (
                                    <option value={item.value} data-label={item.label}>{item.label}</option>
                                ))}
                            </SelectCore>
                            </ThemeProvider>
                        </FormControl>
                    </Col>
                </Form.Group>}
                <Button type="submit" onClick={(e) => this.setState({action: 'save'})} className="btn btn-primary">
                    <i className="la la-save"/>
                    Save & Close
                </Button>
                &nbsp;&nbsp;

                <Button type="submit" onClick={(e) => this.setState({action: 'save_new'})} className="btn btn-success">
                    <i className="la la-save"/>
                    Save & New
                </Button>
                &nbsp;&nbsp;

                <Link to={"/" + USER_URL + "/part/asset"} className="btn btn-danger">
                    <i className="la la-remove"/>
                    Cancel
                </Link>
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
                                return <li key={index + i}>{key.charAt(0).toUpperCase() + key.slice(1)} : {error}</li>
                            });
                        })
                    }
                </Notice>

                <div className="row">
                    <div className="col-md-12">
                        <CustomHead
                            beforeCodeTitle={"Part"}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            <Link to={"/" + USER_URL + "/part/asset"}
                                                  className="btn btn-clean btn-icon-sm">
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
