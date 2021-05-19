import React from "react";
import Swal from 'sweetalert2';
import Link from 'next/link';
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import LoginPartial from '../../components/LoginPartial';
import LoginHeader from '../../components/LoginHeader';
import Head from 'next/head'
import moment from "moment";
import DateFnsUtils from '@date-io/date-fns'; // choose your lib
import {
  DatePicker,
  MuiPickersUtilsProvider,
} from '@material-ui/pickers';
import { post } from "../../helpers/api";
import msg from "../../helpers/notifications";
import Select from 'react-select';
import Route from 'next/router';
import CreatableSelect from 'react-select/creatable';

const RegistrationSchema = Yup.object().shape({
  fname: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "First Name is required"
    ),
  lname: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "Last Name is required"
    ),
  email: Yup.string()
    .email("Wrong email format")
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "Email is required"
    ),
  password: Yup.string()
    .min(3, "Minimum 3 symbols")
    .max(50, "Maximum 50 symbols")
    .required(
      "Password is required"
    ),
  company: Yup.string()
    .required(
      "Company field is required"
    )
});

class Signup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formSubmitting:false,
      account: { fname: '', address: '', lname: '', email: '', password: '', gender: "male", phone: '', mobile: '', dob: moment(new Date()).format("YYYY-MM-DD") },
      first: 'current',
      between: 'pending',
      last: 'pending',
      selectedFile: null,
      previewFile: '/static/auth/images/Airbook-User-Icon.svg',
      dob: new Date(),
      companies: [],
      company: { label: 'Select company', value: 0 },
      countries: [],
      country: { label: 'Select country', value: 0 },
      states: [],
      cities: [],
      state: { label: 'Select state', value: '' },
      city: { label: 'Select city', value: '' },
      jobtitles: [],
      jobtitle: { label: 'Select Job Title', value: 0 }
    };
    this.loadModels();
  }
  handleChange(newValue, actionMeta)  {
    console.group('Value Changed');
    console.groupEnd();
  }
  handleInputChange(inputValue, actionMeta) {
    console.group('Input Changed');
    console.groupEnd();
  }
  loadModels() {
    let models = {
      'AbCompanies': {},
      'AbTitles': {},
      'AbCountries': {},
    }
    post('abmodels', { models: models }).then(function (response) {
      for (let opt in response.data) {
        response.data[opt].map((row, i) => {
          response.data[opt][i].label = row.name;
          response.data[opt][i].value = row.id;
        })
      }
      // let companies = response.data.AbCompanies.map(company=>{
      //   let comp = ''
      //   if(company.name !== 'na' || company.name !== 'NA' || company.name !== 'Nil' || company.name !== 'N/A'){
      //     return company
      //   }
      // })
      let companies = response.data.AbCompanies.filter(company=> company.name !== 'na' && company.name !== 'NA' && company.name !== 'Nil' && company.name !== 'N/A')
      this.setState({
        companies:companies,
        jobtitles: response.data.AbTitles,
        countries: response.data.AbCountries,
      })
    }.bind(this))
  }


  componentDidMount() {
    document.querySelector("body").classList.add('header-fixed', 'header-mobile-fixed', 'subheader-enabled', 'subheader-fixed', 'aside-enabled', 'aside-fixed', 'aside-minimize-hoverable');
    document.getElementById("__next").classList.add('d-flex', 'flex-column', 'flex-root');
  }

  handleChange(e, type) {
    var account = this.state.account;
    if (type === 'dob') {
      var attr = type;
      var val = moment(e).format("YYYY-MM-DD");
      account['dob'] = val;
      this.setState({ dob: e })
    }
    else {
      var attr = e.target.name;
      var val = e.target.value;
      account[attr] = val;
      this.setState({ account: account });
    }

  }

  selectChange(value, key) {
    console.log("value ", value);
    if(key === 'company' && !value.id) {
      let account = this.state.account;
      let last_company = this.state.companies[this.state.companies.length - 1];
      value.value = last_company.id;
      let companies_  = [...this.state.companies, {label:value.label, value:last_company.id}]
      this.setState({ [key]: value ? value : '', account: account, companies:companies_ });
      console.log("Last_company ", last_company);
      // post('companies', {name:value.value}).then(response => {
      //     let account = this.state.account;
      //     value.value = response.data.id;
      //     account[key] = value;
      //     let companies_  = [...this.state.companies, {label:value.label, value:response.data.id}]
      //     this.setState({ [key]: value ? value : '', account: account, companies:companies_ });
      //   })
    } else {
      let account = this.state.account;
      account[key] = value && value.value ? value.value : '';
      this.setState({ [key]: value ? value : '', account: account });
  
      if (['country', 'state'].indexOf(key) > -1 && value) {
        let endpoint = '', params = {}, key_to_update = '', models = {}, list_to_update = '';
        if (key === 'country') {
          models = {
            AbStates: { country_id: value.id }
          }
          key_to_update = 'state';
          list_to_update = 'states';
        } else {
          models = {
            AbCities: { state_id: value.id }
          }
          key_to_update = 'city';
          list_to_update = 'cities';
        }
  
        post('abmodels', { models: models }).then(function (response) {
          let selected = {};
          for (let opt in response.data) {
            response.data[opt].map((row, i) => {
              response.data[opt][i].label = row.name;
              response.data[opt][i].value = row.id;
  
              if (this.state.account[list_to_update] != undefined && row.id === this.state.account[list_to_update].id)
                selected = row;
            })
            this.setState({
              [list_to_update]: response.data[opt], [key_to_update]: selected
            })
          }
  
        }.bind(this));
      }
    }
  }

  next(event, touched, setTouched, validateField) {

    touched.fname = true;
    touched.lname = true;
    touched.email = true;
    touched.password = true;
    setTouched(touched);
    validateField('fname');
    validateField('lname');
    validateField('email');
    validateField('password');
    var account = this.state.account;
    if (account.fname === '' || account.lname === '' || account.email === '' || account.password === '') {
      Swal.fire({
        text: "Sorry, looks like there are some errors detected, please try again.",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok, got it!",
        customClass: {
          confirmButton: "btn font-weight-bold btn-light-primary"
        }
      })
    }
    else {
      if (this.state.first === 'current') {
        this.setState({ first: 'done', between: 'current' });
      }
      else if (this.state.between === 'current') {
        if (this.state.company.value === 0) {
          Swal.fire({
            text: "Company Field is required.",
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok, got it!",
            customClass: {
              confirmButton: "btn font-weight-bold btn-light-primary"
            }
          })
        }
        else {
          this.setState({ between: 'done', last: 'current' });
        }
      }
    }
  }
  previous() {
    if (this.state.between === 'current') {
      this.setState({ first: 'current', between: 'pending' });
    }
    else if (this.state.last === 'current') {
      this.setState({ between: 'current', last: 'pending' });
    }
  }

  handleSubmit(event) {
    this.setState({formSubmitting:true})
    let userdata = {
      email: this.state.account.email,
      password: this.state.account.password,
      user_permissions: [],
      contact: [{
        first_name: this.state.account.fname,
        last_name: this.state.account.lname,
        mobile_phone: this.state.account.mobile,
        business_phone: this.state.account.phone,
        gender: this.state.account.gender,
        address: this.state.account.address,
        country: this.state.country.value !== 0 ? this.state.country.value : null,
        state: this.state.state.value !== '' ? this.state.state.value : null,
        city: this.state.city.value !== '' ? this.state.city.value : null,
        job_title: this.state.jobtitle.value !== 0 ? this.state.jobtitle.value : null,
        company: this.state.company.value,
        file: this.state.account.file
      }],
    };
    post('users', userdata).then(
      (response) => {
        if (response.status === 201) {
          msg.success('You have been registerd successfully');
          Route.push('/login');
        }
      }).catch(error => {
        msg.error('Email already exist');
        this.setState({formSubmitting:false})
      });
  }

  emailCheck = (e) => {
    const email = this.state.account.email
    post("check-email", { email })
      .then((response) => {
        // msg.success("You have been registerd successfully");
      })
      .catch((error) => {
        msg.error(error.response.data.data);
      });
  }

  fileChangedHandler = (event) => {
    let account = this.state.account;
    let file = event.target.files[0];
    this.setState({
      previewFile: URL.createObjectURL(file)
    });
    if (file !== undefined) {
      file.size_c = file.size / 1024;

      if ((file.size_c) / 1024 > 2) {
        file.size_c = (file.size_c / 1024).toFixed(2) + ' MB';
        file.error = "Error: File is too big";
        account.file = {};
        this.setState({ selectedFile: file, previewFile: '/static/auth/images/Airbook-User-Icon.svg' });
      } else {
        file.error = null;
        file.size_c = file.size_c.toFixed(2) + ' KB';
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          account.file = reader.result;
          this.setState({ selectedFile: file, account: account });
        };
      }
    }
  }

  handleFileRemove = (event) => {
    let account = this.state.account;
    account.file = {}
    this.setState({ selectedFile: null, account: account, previewFile: '/static/auth/images/Airbook-User-Icon.svg' })
    document.getElementById('user-image-upload').value = '';
  }

  render() {
    const { formSubmitting, first, between, last, account, selectedFile, previewFile, companies, company, jobtitles, jobtitle, countries, country, states, state, cities, city } = this.state;
    return (
      <>
        <Head>Sign Up</Head>
        <Head>
          <link href="/static/auth/css/custom.css" rel="stylesheet" type="text/css" />

        </Head>
        <LoginHeader />
        <div className="login login-4 wizard d-flex flex-column flex-lg-row flex-column-fluid wizard">
          <div className="login-container d-flex flex-center flex-row flex-row-fluid order-2 order-lg-1 flex-row-fluid bg-white py-lg-0 pb-lg-0 pt-15 pb-12">
            <div className="login-content login-content-signup d-flex flex-column">
              <div className="d-flex flex-column-auto flex-column px-10">
                <a href="/" className="login-logo pb-xl-20 pb-15">
                  <img src="/static/images/Airbook.svg" className="max-h-70px max-w-200px" alt="" />
                </a>
                <div className="wizard-nav pt-5 pt-lg-15 pb-10">
                  <div className="wizard-steps d-flex flex-column flex-sm-row">
                    <div className="wizard-step flex-grow-1 flex-basis-0" data-wizard-type="step" data-wizard-state={first}>
                      <div className="wizard-wrapper pr-7">
                        <div className="wizard-icon">
                          <i className="wizard-check ki ki-check"></i>
                          <span className="wizard-number">1</span>
                        </div>
                        <div className="wizard-label">
                          <h3 className="wizard-title">Account</h3>
                          <div className="wizard-desc">Account details</div>
                        </div>
                        <span className="svg-icon pl-6">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" version="1.1" >
                            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                              <polygon points="0 0 24 0 24 24 0 24" />
                              <rect fill="#000000" opacity="0.3" transform="translate(8.500000, 12.000000) rotate(-90.000000) translate(-8.500000, -12.000000)" x="7.5" y="7.5" width="2" height="9" rx="1" />
                              <path d="M9.70710318,15.7071045 C9.31657888,16.0976288 8.68341391,16.0976288 8.29288961,15.7071045 C7.90236532,15.3165802 7.90236532,14.6834152 8.29288961,14.2928909 L14.2928896,8.29289093 C14.6714686,7.914312 15.281055,7.90106637 15.675721,8.26284357 L21.675721,13.7628436 C22.08284,14.136036 22.1103429,14.7686034 21.7371505,15.1757223 C21.3639581,15.5828413 20.7313908,15.6103443 20.3242718,15.2371519 L15.0300721,10.3841355 L9.70710318,15.7071045 Z" fill="#000000" fillRule="nonzero" transform="translate(14.999999, 11.999997) scale(1, -1) rotate(90.000000) translate(-14.999999, -11.999997)" />
                            </g>
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div className="wizard-step flex-grow-1 flex-basis-0" data-wizard-type="step" data-wizard-state={between}>
                      <div className="wizard-wrapper pr-7">
                        <div className="wizard-icon">
                          <i className="wizard-check ki ki-check"></i>
                          <span className="wizard-number">2</span>
                        </div>
                        <div className="wizard-label">
                          <h3 className="wizard-title">Profile</h3>
                          <div className="wizard-desc">Personal information</div>
                        </div>
                        <span className="svg-icon pl-6">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                              <polygon points="0 0 24 0 24 24 0 24" />
                              <rect fill="#000000" opacity="0.3" transform="translate(8.500000, 12.000000) rotate(-90.000000) translate(-8.500000, -12.000000)" x="7.5" y="7.5" width="2" height="9" rx="1" />
                              <path d="M9.70710318,15.7071045 C9.31657888,16.0976288 8.68341391,16.0976288 8.29288961,15.7071045 C7.90236532,15.3165802 7.90236532,14.6834152 8.29288961,14.2928909 L14.2928896,8.29289093 C14.6714686,7.914312 15.281055,7.90106637 15.675721,8.26284357 L21.675721,13.7628436 C22.08284,14.136036 22.1103429,14.7686034 21.7371505,15.1757223 C21.3639581,15.5828413 20.7313908,15.6103443 20.3242718,15.2371519 L15.0300721,10.3841355 L9.70710318,15.7071045 Z" fill="#000000" fillRule="nonzero" transform="translate(14.999999, 11.999997) scale(1, -1) rotate(90.000000) translate(-14.999999, -11.999997)" />
                            </g>
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div className="wizard-step flex-grow-1 flex-basis-0" data-wizard-type="step" data-wizard-state={last}>
                      <div className="wizard-wrapper">
                        <div className="wizard-icon">
                          <i className="wizard-check ki ki-check"></i>
                          <span className="wizard-number">3</span>
                        </div>
                        <div className="wizard-label">
                          <h3 className="wizard-title">Complete</h3>
                          <div className="wizard-desc">Submit form</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="login-form">
                <Formik
                  initialValues={{ fname: "", lname: "", email: "", password: "", company: "" }}
                  validationSchema={RegistrationSchema}
                  onSubmit={e => this.handleSubmit(e)}
                >
                  {({ touched, errors, isSubmitting, setTouched, isValid, setErrors, validateField, setFieldTouched }) => (
                    <Form className="form px-10" id="kt_login_signup_form">
                      <div className="" data-wizard-type="step-content" data-wizard-state={first}>
                        <div className="pb-10 pb-lg-12">
                          <h3 className="font-weight-bolder text-dark font-size-h2 font-size-h1-lg">Create Account</h3>
                          <div className="text-muted font-weight-bold font-size-h4">Already have an Account ?
                            <Link href="/login">
                              <a className="text-primary font-weight-bolder"> Sign In</a>
                            </Link>
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="font-size-h6 font-weight-bolder text-dark">First Name</label>
                          <Field
                            type="text"
                            name="fname"
                            className={`form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6 ${
                              touched.fname && errors.fname ? "is-invalid" : ""
                              }`}
                            onKeyUp={(e) => this.handleChange(e)}
                            placeholder="First Name"
                          />
                          <ErrorMessage
                            component="div"
                            name="fname"
                            className="invalid-feedback"
                          />
                        </div>
                        <div className="form-group">
                          <label className="font-size-h6 font-weight-bolder text-dark">Last Name</label>
                          <Field
                            type="text"
                            name="lname"
                            className={`form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6 ${
                              touched.lname && errors.lname ? "is-invalid" : ""
                              }`}
                            onKeyUp={(e) => this.handleChange(e)}
                            placeholder="Last Name"
                          />
                          <ErrorMessage
                            component="div"
                            name="lname"
                            className="invalid-feedback"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="email" className="font-size-h6 font-weight-bolder text-dark">Your Email</label>
                          <Field
                            type="email"
                            name="email"
                            className={`form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6 ${
                              touched.email && errors.email ? "is-invalid" : ""
                              }`}
                            onKeyUp={(e) => this.handleChange(e)}
                            placeholder="Your Email"
                            onBlur={()=>this.emailCheck()}
                          />
                          <ErrorMessage
                            component="div"
                            name="email"
                            className="invalid-feedback"
                          />
                        </div>
                        <div className="form-group">
                          <Field
                            type="password"
                            name="password"
                            className={`form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6 ${
                              touched.password && errors.password ? "is-invalid" : ""
                              }`}
                            onKeyUp={(e) => this.handleChange(e)}
                            placeholder="Password"
                          />
                          <ErrorMessage
                            component="div"
                            name="password"
                            className="invalid-feedback"
                          />
                        </div>
                      </div>
                      <div className="pb-5" data-wizard-type="step-content" data-wizard-state={between}>
                        <div className="pt-lg-0 pt-5">
                          <h3 className="font-weight-bolder text-dark font-size-h2 font-size-h1-lg">Hello, {account.fname} {account.lname}</h3>
                          <div className="text-muted font-weight-bold font-size-h4">Please take a minute to create your profile.
                          </div>
                        </div>
                        <div className="row">
                          <div className="margin-auto">
                            <a href="#" className="profile-image-upload" style={{ backgroundImage: "url(" + previewFile + ")" }}>
                            </a>
                          </div>
                        </div>
                        <div className="row">
                          <div className="margin-auto">
                            <label htmlFor="user-image-upload" className="btn btn-light-primary">Upload Image</label>
                            <input name="image" id="user-image-upload" style={{ display: "none" }} type="file" onChange={this.fileChangedHandler} />
                          </div>
                        </div>
                        <div className="row mb-8">
                          <div className="margin-auto">
                            <div className="dropzone dropzone-multi" id="kt_dropzone_5">
                              <div className="dropzone-items" style={{ display: selectedFile ? 'block' : 'none' }}>
                                <div className="dropzone-item">
                                  <div className="dropzone-file">
                                    <div className="dropzone-filename" title="some_image_file_name.jpg">
                                      <span
                                        data-dz-name>{selectedFile ? selectedFile.name : 'No file selected'}</span>
                                      <strong>(<span
                                        data-dz-size>{selectedFile && selectedFile.size_c ? selectedFile.size_c : ''}</span>)</strong>
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
                            <span className="form-text text-muted" style={{ textAlign: "center" }}>Max file size is 2MB.</span>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-xl-6">
                            <div className="form-group mt-7" onChange={(e) => this.handleChange(e)}>
                              <label className="font-size-h6 font-weight-bolder text-dark">I'm</label>
                              <span className="ml-3">
                                <label htmlFor="maleChecked" id="labelInfoFemale" ><img className={`radioimg ${account.gender === 'male' ? "rchecked" : ""}`} src="/static/auth/images/standing-up-man-.svg" />
                                </label>
                                <input name="gender" style={{ visibility: "hidden" }} value="male" type="radio" id="maleChecked" />
                              </span>
                              <span>
                                <label htmlFor="femaleChecked" id="labelInfoFemale" ><img className={`radioimg ${account.gender === 'female' ? "rchecked" : ""}`} src="/static/auth/images/girl.svg" /></label>
                                <input name="gender" value="female" style={{ visibility: "hidden" }} type="radio" id="femaleChecked" />
                              </span>
                            </div>
                          </div>
                          {/* <div className="col-xl-6">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Date of birth</label>
                              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                                <DatePicker className="form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6" value={this.state.dob} onChange={(e) => this.handleChange(e, 'dob')} format="dd/MM/yyyy" />
                              </MuiPickersUtilsProvider>
                            </div>
                          </div> */}
                        </div>
                        <div className="row">
                          <div className="col-xl-6">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Company *</label>
                              <p>(Please select or type to create a company)</p>
                              <CreatableSelect
                                value={company ? company : ''}
                                name="company"
                                isClearable={true}
                                escapeClearsValue={true}
                                className="form-control form-control-solid h-auto px-6 border-0 rounded-lg font-size-h6"
                                onBlur={() => setFieldTouched("company", true)}
                                onChange={e => this.selectChange(e, 'company')}
                                options={companies}
                                error={errors.company}
                                touched={touched.company}
                              />
                              <ErrorMessage
                                component="div"
                                name="company"
                                className="invalid-feedback"
                              />
                            </div>
                          </div>
                          <div className="col-xl-6">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Job title</label>
                              <Select
                                value={jobtitle ? jobtitle : ''}
                                model="jobtitle"
                                name="job"
                                isClearable={true}
                                escapeClearsValue={true}
                                className="mt-10 form-control form-control-solid h-auto px-6 border-0 rounded-lg font-size-h6"
                                onChange={e => this.selectChange(e, 'jobtitle')}
                                options={jobtitles}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-xl-6">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Business Phone</label>
                              <input type="number" className="form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6" name="phone" placeholder="Business Phone" onChange={(e) => this.handleChange(e)} />
                            </div>
                          </div>
                          <div className="col-xl-6">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Mobile Phone</label>
                              <input type="number" className="form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6" name="mobile" placeholder="Mobile Phone" onChange={(e) => this.handleChange(e)} />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-xl-12">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Address</label>
                              <input type="text" className="form-control form-control-solid h-auto py-7 px-6 border-0 rounded-lg font-size-h6" name="address" placeholder="" onChange={(e) => this.handleChange(e)} />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-xl-4">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">Country</label>
                              <Select
                                value={country ? country : ''}
                                model="country"
                                name="country"
                                filterOption={(option, filter, currentValues) => {
                                  if(option.label.toLowerCase().startsWith(filter.toLowerCase()))
                                  return option;
                                }}
                                isClearable={true}
                                escapeClearsValue={true}
                                className="form-control form-control-solid h-auto px-6 border-0 rounded-lg font-size-h6"
                                onChange={e => this.selectChange(e, 'country')}
                                options={countries}
                              />
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">State</label>
                              <Select
                                value={state ? state : ''}
                                model="country"
                                name="state"
                                isClearable={true}
                                escapeClearsValue={true}
                                className="form-control form-control-solid h-auto px-6 border-0 rounded-lg font-size-h6"
                                onChange={e => this.selectChange(e, 'state')}
                                options={states}
                              />
                            </div>
                          </div>
                          <div className="col-xl-4">
                            <div className="form-group">
                              <label className="font-size-h6 font-weight-bolder text-dark">City</label>
                              <Select
                                value={city ? city : ''}
                                model="city"
                                name="city"
                                isClearable={true}
                                escapeClearsValue={true}
                                className="form-control form-control-solid h-auto px-6 border-0 rounded-lg font-size-h6"
                                onChange={e => this.selectChange(e, 'city')}
                                options={cities}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pb-5" data-wizard-type="step-content" data-wizard-state={last}>
                        <div className="pt-lg-0 pt-5 pb-15">
                          <h3 className="font-weight-bolder text-dark font-size-h2 font-size-h1-lg">Complete</h3>
                          <div className="text-muted font-weight-bold font-size-h4">Complete Your Signup And Become A Member!</div>
                        </div>
                        <h4 className="font-weight-bolder mb-3">Accoun Settings:</h4>
                        <div className="text-dark-50 font-weight-bold line-height-lg mb-8">
                          <div className="text-capitalize">{account.fname} {account.lname}</div>
                          <div>{account.email}</div>
                        </div>
                        <h4 className="font-weight-bolder mb-3">Profile Details:</h4>
                        <div className="text-dark-50 line-height-lg mb-8">
                          <div className="text-capitalize">
                            <span className="font-weight-bolder">Gender: </span>{account.gender}
                          </div>
                          {/* <div>
                            <span className="font-weight-bolder">Date of birth: </span>{account.dob}
                          </div> */}
                          <div className="text-capitalize">
                            <span className="font-weight-bolder">Company: </span>{company.label}
                          </div>
                          {jobtitle.value !== 0 &&
                            <div className="text-capitalize">
                              <span className="font-weight-bolder">Job title: </span>{jobtitle.label}
                            </div>
                          }
                          {account.phone &&
                            <div>
                              <span className="font-weight-bolder">Business phone: </span>{account.phone}
                            </div>
                          }
                          {account.mobile &&
                            <div>
                              <span className="font-weight-bolder">Mobile: </span>{account.mobile}
                            </div>
                          }
                          {account.address &&
                            <div>
                              <span className="font-weight-bolder">Address: </span>{account.address}
                            </div>
                          }
                          {country.value !== 0 && state.value !== '' && city.value !== '' && <div className="font-weight-bold">{country.label}, {state.label}, {city.label}
                          </div>}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between pt-7">
                        <div className="mr-2">
                          {first !== 'current' ? <button type="button" className="btn btn-light-primary font-weight-bolder font-size-h6 pr-8 pl-6 py-4 my-3 mr-3" data-wizard-type="action-prev" onClick={e => this.previous()}>
                            <span className="svg-icon svg-icon-md mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                  <polygon points="0 0 24 0 24 24 0 24" />
                                  <rect fill="#000000" opacity="0.3" transform="translate(15.000000, 12.000000) scale(-1, 1) rotate(-90.000000) translate(-15.000000, -12.000000)" x="14" y="7" width="2" height="10" rx="1" />
                                  <path d="M3.7071045,15.7071045 C3.3165802,16.0976288 2.68341522,16.0976288 2.29289093,15.7071045 C1.90236664,15.3165802 1.90236664,14.6834152 2.29289093,14.2928909 L8.29289093,8.29289093 C8.67146987,7.914312 9.28105631,7.90106637 9.67572234,8.26284357 L15.6757223,13.7628436 C16.0828413,14.136036 16.1103443,14.7686034 15.7371519,15.1757223 C15.3639594,15.5828413 14.7313921,15.6103443 14.3242731,15.2371519 L9.03007346,10.3841355 L3.7071045,15.7071045 Z" fill="#000000" fillRule="nonzero" transform="translate(9.000001, 11.999997) scale(-1, -1) rotate(90.000000) translate(-9.000001, -11.999997)" />
                                </g>
                              </svg>
                            </span>Previous
                          </button> : ''}
                        </div>
                        <div>
                          {last === 'current' ? <button 
                          className={formSubmitting ? "btn btn-primary font-weight-bolder font-size-h6 pl-8 pr-4 py-4 my-3 spinner spinner-right spinner-white pr-15": "btn btn-primary font-weight-bolder font-size-h6 pl-8 pr-4 py-4 my-3 pr-7"}
                              disabled={formSubmitting} data-wizard-type="action-submit" onClick={(e)=>{this.handleSubmit(e)}} id="kt_login_signup_form_submit_button">{formSubmitting ? "Please wait " : "Submit"}
                          </button> : ''}
                          {last === 'pending' ? <button type="button" className="btn btn-primary font-weight-bolder font-size-h6 pl-8 pr-4 py-4 my-3" data-wizard-type="action-next" onClick={(e) => this.next(e, touched, setTouched, validateField, setErrors)}>Next
                            <span className="svg-icon svg-icon-md ml-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                  <polygon points="0 0 24 0 24 24 0 24" />
                                  <rect fill="#000000" opacity="0.3" transform="translate(8.500000, 12.000000) rotate(-90.000000) translate(-8.500000, -12.000000)" x="7.5" y="7.5" width="2" height="9" rx="1" />
                                  <path d="M9.70710318,15.7071045 C9.31657888,16.0976288 8.68341391,16.0976288 8.29288961,15.7071045 C7.90236532,15.3165802 7.90236532,14.6834152 8.29288961,14.2928909 L14.2928896,8.29289093 C14.6714686,7.914312 15.281055,7.90106637 15.675721,8.26284357 L21.675721,13.7628436 C22.08284,14.136036 22.1103429,14.7686034 21.7371505,15.1757223 C21.3639581,15.5828413 20.7313908,15.6103443 20.3242718,15.2371519 L15.0300721,10.3841355 L9.70710318,15.7071045 Z" fill="#000000" fillRule="nonzero" transform="translate(14.999999, 11.999997) scale(1, -1) rotate(90.000000) translate(-14.999999, -11.999997)" />
                                </g>
                              </svg>
                            </span>
                          </button> : ''}
                        </div>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
          <LoginPartial />
        </div>
      </>
    )
  }
}

export default Signup
