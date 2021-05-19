import React from "react";
import Notice from "../../../partials/content/Notice";
import CustomHead from "../../../partials/content/CustomHeader.js";
import {Button, Form, Col} from "react-bootstrap";
import {
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl, Button as ButtonCore,
} from "@material-ui/core";
import {Link, withRouter} from 'react-router-dom'
import {list, patch, MEDIA_URL, post} from "../../../crud/api";
import Select from 'react-select';
import {CloudUpload as CloudUploadIcon} from "@material-ui/icons";


class Edit extends React.Component {
    constructor(props) {
        super(props);

        const {country_id} = this.props.data.match.params
        this.state = {
            validated: false,
            country: {id: country_id},
            continents: [],
            continent: {},
            regions: [],
            region: {},
            selectedFile: null,
            previewFile: null,
            fields: {},
            errorsf: {}
        };

        this.getCountry(country_id);

    }

    getCountry(country_id) {
        list('countries/' + country_id + '/').then(
            (response) => {
                delete response.data.country;
                /*let continent = this.state.continent;
                let region = this.state.region;
                this.state.continents.map((index) => {
                    if (index.id === response.data.continent_id) {
                        continent = {id: index.id, label: index.name};
                        response.data.continent = index.id;
                    }
                });
                this.state.regions.map((index) => {
                    if (index.id === response.data.region_id) {
                        region = {id: index.id, label: index.name};
                        response.data.region = index.id;
                    }
                })*/
                this.setState({
                    country: response.data,
                    //continent: continent,
                    //region: region,
                    previewFile: response.data.media ? MEDIA_URL + response.data.media.original_file_name : null
                })
                this.setSelectfile();
                this.loadModels();
            });
    }

    loadModels() {
        let country_data = this.state.country;
        let models = {
            'AbContinents': {},
            'AbRegions': {continent_id: country_data.continent && country_data.continent.id ? country_data.continent.id : 0},
        }

        let state_endpoints = {
            AbContinents: ['continent'],
            AbRegions: ['region'],
        }

        post('abmodels', {models: models}).then(function (response) {
            let newStates = {};
            for (let opt in response.data) {
                response.data[opt].map((row, i) => {
                    response.data[opt][i].label = row.name;
                    response.data[opt][i].value = row.id;

                    Object.keys(state_endpoints).map((key, i) => {
                        state_endpoints[key].map((state, index) => {
                            if (opt === key && country_data[state] !== null && country_data[state].id !== undefined && country_data[state].id === row.id)
                                newStates[state] = row;
                        })
                    })
                })
            }
            newStates['continents'] = response.data.AbContinents;
            newStates['regions'] = response.data.AbRegions;
            this.setState(newStates);
        }.bind(this))
    }

    selectChange(value, key) {
		let country = this.state.country;
		country[key] = value && value.value ? value.value : '';
		this.setState({ [key]: value ? value : '', country: country});
		if(['continent'].indexOf(key) > -1 && value)  {
		  let endpoint = '', params={}, key_to_update = '', list_to_update = '';
		  let models = {};
		  if(key === 'continent'){
			models = {
				AbRegions : {continent_id: value.id}
			}
			key_to_update = 'region';
			list_to_update = 'regions';
		  }

		  post('abmodels', {models:models}).then(function(response){
			  let selected = {};
			  for(let opt in response.data){
				response.data[opt].map((row, i) => {
					response.data[opt][i].label = row.name;
					response.data[opt][i].value = row.id;

					if(this.state.country[list_to_update] != undefined && row.id === this.state.country[list_to_update].id)
						selected = row;
				})

				this.setState({
					[list_to_update]:response.data[opt], [key_to_update]:selected
				})
			  }
		  }.bind(this));
		}
	}

    handleChange(event) {
        var country = this.state.country;
        var attr = event.target.name;
        var val = event.target.value;
        if (attr === 'is_active')
            val = parseInt(val);

        country[attr] = val;
        this.setState({country: country})

        let fields = this.state.fields;
        fields[attr] = val;
        this.setState({fields});
    }

    handleSubmit(event) {
        const form = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        if (this.handleValidation()) {
            this.setState({validated: true});
            this.checkDataFormat(); // this is done to convert foregin table objects into pk
            patch('countries/' + this.state.country.id + '/', this.state.country).then(
                (response) => {
                    this.setState({country: response.data});
                    this.props.data.history.push("/admin/countries");
                }).catch(error => {
                this.props.sendError(error.response.data);
            });
        }
    }

    checkDataFormat() {
      let country = this.state.country;
      let related_data = ['continent','region'];
      related_data.map((val, i) => {
        country[val] = this.state[val].value;
      })
      this.setState({country:country});
    }

    handleValidation() {
        let fields = this.state.fields;
        let errors = {};
        let formIsValid = true;

        let alphabets = {
            name: 'name',
            capital: 'capital',
        }
        let alphabets_only_keys = Object.keys(alphabets);

        for (let key in alphabets_only_keys) {
            if (typeof fields[alphabets_only_keys[key]] !== "undefined" && fields[alphabets_only_keys[key]] !== '') {
                if (!fields[alphabets_only_keys[key]].match(/^([a-z]+\s)*[a-z]+$/i)) {
                    formIsValid = false;
                    errors[alphabets_only_keys[key]] = ["Only alphabets are allowed."];
                }
            }
        }

        this.setState({errorsf: errors}, function () {
            this.props.sendError(this.state.errorsf)
        }.bind(this));
        return formIsValid;
    }

    setSelectfile() {
        if (this.state.country.media) {
            let file = {};
            let filename_pieces = this.state.country.media.original_file_name.split('/');
            file.name_c = filename_pieces[filename_pieces.length - 1];
            this.setState({selectedFile: file});
        }
    }

    fileChangedHandler = (event) => {
        let file = event.target.files[0];
        this.setState({
            previewFile: URL.createObjectURL(file)
        });
        if (file != undefined) {
            file.name_c = file.name;
            let country = this.state.country;
            file.size_c = file.size / 1024;

            if ((file.size_c) / 1024 > 2) {
                file.size_c = (file.size_c / 1024).toFixed(2) + ' MB';
                file.error = "Error: File is too big";
                country.file = {};
                this.setState({selectedFile: file});
            } else {
                file.error = null;
                file.size_c = file.size_c.toFixed(2) + ' KB';
                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = () => {
                    country.file = reader.result;
                    this.setState({selectedFile: file, country: country});
                };
            }
        }
    }

    handleFileRemove = (event) => {
        let country = this.state.country;
        delete country.file
        this.setState({selectedFile: null, country: country, previewFile: null})
        document.getElementById('country-image-upload').value = '';
    }

    render() {
        const {country, continents, continent, regions, region, selectedFile} = this.state;
        return (
            <Form
                noValidate
                onSubmit={e => this.handleSubmit(e)}
            >
                <Form.Row>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Name *</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            placeholder=""
                            model="countries"
                            name="name"
                            value={country ? country.name : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Continent *</Form.Label>
                        <Select
                            required
                            value={continent.value ? continent :'select...'}
                            model="continents"
                            name="continent"
                            isClearable = {true}
                  			escapeClearsValue = {true}
                            onChange={e => this.selectChange(e, 'continent')}
                            options={continents}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Region *</Form.Label>
                        <Select
                            required
                            value={region.value ? region : 'select...'}
                            model="regions"
                            name="region"
                            isClearable = {true}
                  			escapeClearsValue = {true}
                            onChange={e => this.selectChange(e, 'region')}
                            options={regions}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Capital</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder=""
                            model="countries"
                            name="capital"
                            value={country ? country.capital : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Currency</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder=""
                            model="countries"
                            name="currency"
                            value={country ? country.currency : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>ISO 3116 Alpha-2 Code</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder=""
                            model="countries"
                            name="iso_3116_alpha_2"
                            value={country ? country.iso_3116_alpha_2 : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                    <Form.Group as={Col} md="4">
                        <Form.Label>Dialing Code</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder=""
                            model="countries"
                            name="dialing_code"
                            value={country ? country.dialing_code : ''}
                            onChange={e => this.handleChange(e)}
                        />
                    </Form.Group>
                </Form.Row>
                <Form.Row>
                    <Form.Group as={Col} md="12">
                        <input
                            accept="image/*"
                            style={{display: 'none'}}
                            type="file"
                            id="country-image-upload"
                            name="image"
                            onChange={this.fileChangedHandler}
                        />
                        <br/>
                        <label htmlFor="country-image-upload">
                            <ButtonCore variant="outlined" color="inherit" component="span">
                                Flag (SVG)
                                <CloudUploadIcon style={{marginLeft: '5px'}}/>
                            </ButtonCore>
                        </label>
                        <div className="form-group form-group-last row">
                            <div className="col-12 col-md-4">
                                <div className="dropzone dropzone-multi" id="kt_dropzone_5">
                                    <div className="dropzone-items" style={{display: selectedFile ? 'block' : 'none'}}>
                                        <div className="dropzone-item">
                                            <div className="dropzone-file">
                                                {this.state.previewFile &&
                                                <div style={{'max-width': '250px'}}><img style={{width: "100%"}}
                                                                                         src={this.state.previewFile}/>
                                                </div>
                                                }
                                                <div className="dropzone-filename" title="some_image_file_name.jpg">
                                                    <span
                                                        data-dz-name>{selectedFile ? selectedFile.name_c : 'No file selected'}</span>
                                                    <strong>{selectedFile && selectedFile.size_c ? '(' + selectedFile.size_c + ')' : ''}</strong>
                                                </div>
                                                <div className="dropzone-error"
                                                     data-dz-errormessage>{selectedFile && selectedFile.error ? selectedFile.error : ''}</div>
                                            </div>
                                            <div className="dropzone-toolbar">
                                                <span onClick={(e) => this.handleFileRemove(e)}
                                                      className="dropzone-delete" data-dz-remove><i
                                                    className="flaticon2-cross"></i></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span className="form-text text-muted">Max file size is 2MB.</span>
                            </div>
                        </div>
                    </Form.Group>
                </Form.Row>
                <Form.Row>
                    <Form.Group as={Col} md="12">
                        <FormControl component="fieldset" className="col-md-12">
                            <RadioGroup
                                aria-label="status"
                                name="is_active"
                                className="col-md-12"
                                value={country.is_active === 1 ? '1' : '0'}
                                onChange={e => this.handleChange(e)}
                            >
                                <FormControlLabel className="col-md-2" value="1" control={<Radio/>} label="Publish"/>
                                <FormControlLabel className="col-md-2" value="0" control={<Radio/>} label="Inactive"/>
                            </RadioGroup>
                        </FormControl>
                    </Form.Group>
                </Form.Row>
                <Button type="submit" className="btn btn-primary">
                    <i className="la la-save"/>
                    Update
                </Button>
                &nbsp;&nbsp;

                <Link to={"/admin/countries"} className="btn btn-danger">
                    <i className="la la-remove"/>
                    Cancel
                </Link>
            </Form>
        );
    }
}

class EditPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {errors: {}, showError: false};
        this.sendError = this.sendError.bind(this);
    }

    sendError(error) {
        if (Object.keys(error).length)
            this.setState({showError: true});

        this.setState({errors: error});
    }

    render() {

        // const { Formik } = formik;
        const buttons = <Link to={"/admin/countries"} className="btn btn-clean btn-icon-sm">
            <i className="la la-long-arrow-left"></i>
            Back
        </Link>
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
                            beforeCodeTitle={'Country'}
                            jsCode={<div className="kt-portlet__head-toolbar">
                                <div className="kt-portlet__head-wrapper">
                                    <div className="kt-portlet__head-actions">
                                        <div className="dropdown dropdown-inline">
                                            {buttons}
                                        </div>
                                    </div>
                                </div>
                            </div>}
                        >
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