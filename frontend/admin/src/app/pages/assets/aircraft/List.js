import React from 'react';
import ReactDOM from 'react-dom'
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {lighten, makeStyles} from '@material-ui/core/styles';
import {
    Delete as DeleteIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Info as InfoIcon,
    Warning as WarningIcon
} from '@material-ui/icons';
import {amber, green} from '@material-ui/core/colors';
import {
    IconButton, Paper, FormControlLabel, Switch, Snackbar, Checkbox, Toolbar, Tooltip, Typography, SnackbarContent
} from '@material-ui/core';
import {list, patch, post, del, userHasPermission, API_URL, STATUSES} from "../../../crud/api";
import {Button, Dropdown, Modal, Form} from "react-bootstrap";
import {useHistory} from "react-router-dom";
import "datatables.net-bs4/css/dataTables.bootstrap4.css";
import "datatables.net-responsive-bs4/css/responsive.bootstrap4.css";
import {Link} from "react-router-dom";
import Notice from "../../../partials/content/Notice";
import {ReactComponent as SortNum1Icon} from "../../../../_metronic/layout/assets/layout-svg-icons/SortNum1.svg";
import {setPageNum, getPageNum, getDateWithFormat} from "../../../helpers/listing";
import Select from 'react-select';
import {CSVLink} from "react-csv";

const QuickActionsDropdownToggle = React.forwardRef(({children, onClick}, ref) => (
    <button
        ref={ref}
        onClick={e => {
            e.preventDefault();
            onClick(e);
        }}
        className="btn kt-header__btn-primary"
    >
        Actions
        <SortNum1Icon className="kt-svg-icon kt-svg-icon--sm"/>
    </button>
));

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
    const {className, message, onClose, variant, ...other} = props;
    const Icon = variantIcon[variant];

    return (
        <SnackbarContent
            className={clsx(classes[variant], className)}
            aria-describedby="client-snackbar"
            message={
                <span id="client-snackbar" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)}/>
                    {message}
        </span>
            }
            action={[
                <IconButton key="close" aria-label="close" color="inherit" onClick={onClose}>
                    <CloseIcon className={classes.icon}/>
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

const useToolbarStyles = makeStyles(theme => ({
    root: {
        paddingLeft: theme.spacing(0),
        paddingRight: theme.spacing(0),
        display: 'block',
    },
    highlight:
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
}));

const EnhancedTableToolbar = props => {
    const classes = useToolbarStyles();
    const {exportSpinner, setExpSpin, csvData, setCsvData, numSelected, type, selected, setSelected, setSelectedMany, setRowsData, rows, setTemp} = props;

    function handleDelAll(event) {
        if (selected.length) {
            let data = {ids: selected}
            del('aircrafts/' + selected[0] + '/', data).then(function (response) {
                // here removing rows from dt-table that are deleted from database
                for (let i in rows) {
                    if (selected.indexOf(rows[i].id) > -1) {
                        delete rows[i];
                    }
                }
                setRowsData(rows);
                selected.length = 0;
                setSelected(selected);
                setSelectedMany(false);

                // no use as such - just to trigger state udpate :(
                const newArr = [];
                newArr.push(1);
                setTemp(newArr);

                updateTable(type);
            })
        }
    }

    function fetchCSVData() {
        setExpSpin('');
        list('aircrafts', {records: 'all'}).then(response => {
            let related_models = ['type', 'user', 'model', 'manufacturer', 'category', 'owner', 'registration_country',
                'current_operator', 'previous_operator', 'manager', 'seller',
                'current_location', 'configuration', 'engine_type', 'engine_model', 'engine_manufacturer']

            setExpSpin('d-none');
            let responseData = response.data.map((v, i) => {
                related_models.map((model) => {
                    v[model] = v[model] ? v[model].name : v[model];
                })
                v.primary_contact = v.primary_contact ? v.primary_contact.first_name + ' ' + v.primary_contact.last_name : v.primary_contact
                return v;
            })
            setCsvData(responseData);
            document.getElementById('aircraft-csv-btn').click();
        })
    }

    return (
        <Toolbar
            className={clsx(classes.root, {
                [classes.highlight]: numSelected > 0,
            })}
        >
            <div className="kt-portlet__head kt-portlet__head--lg">
                <div className="kt-portlet__head-label">
              <span className="kt-portlet__head-icon">
                <i className="kt-font-brand fa fa-ticket-alt"/>
              </span>
                    {numSelected > 0 ? (
                        <Typography color="inherit" variant="subtitle1">
                            {numSelected} selected
                        </Typography>
                    ) : (
                        <h3 className="kt-portlet__head-title">
                            Aircraft Assets
                        </h3>
                    )}
                </div>
                <div className="kt-portlet__head-toolbar">
                    <div className="kt-portlet__head-wrapper">
                        <div className="kt-portlet__head-actions">
                            {numSelected > 0 ? (
                                <Tooltip title="Delete">
                                    <IconButton onClick={(e) => handleDelAll(e)} aria-label="Delete">
                                        <DeleteIcon/>
                                    </IconButton>
                                </Tooltip>
                            ) : (
                                <div className="btn-group">
                                    <Link to={"/admin/aircraft/asset/create"}
                                          className="btn btn-sm btn-brand btn-elevate btn-icon-sm new-record">
                                        <i className="la la-plus"></i>
                                        New Record
                                    </Link>
                                    <Dropdown className="dropdown-inline" drop="down" alignRight>
                                        <Dropdown.Toggle as={QuickActionsDropdownToggle}
                                                         id="dropdown-toggle-quick-actions-subheader"
                                        />

                                        <Dropdown.Menu
                                            className="dropdown-menu-fit dropdown-menu-md dropdown-menu-right">
                                            <ul className="kt-nav">
                                                <li className="kt-nav__item">
                                                    <a onClick={fetchCSVData} className="kt-nav__link">
                                                        <i className="kt-nav__link-icon la la-upload"/>
                                                        <span className="kt-nav__link-text">Export</span>
                                                        <div className={'spinner-grow ' + exportSpinner}></div>
                                                    </a>
                                                    <CSVLink
                                                        data={csvData}
                                                        filename="aircrafts.csv"
                                                        className="d-none"
                                                        id="aircraft-csv-btn"
                                                        target="_blank"
                                                    />
                                                </li>
                                                {/*<li className="kt-nav__item">
                                      <a href="#" className="kt-nav__link">
                                        <i className="kt-nav__link-icon la la-download" />
                                        <span className="kt-nav__link-text">Import</span>
                                      </a>
                                    </li>*/}
                                            </ul>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Toolbar>
    );
};

EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
    selected: PropTypes.array.isRequired,
};

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing(1),
    },
    paper: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    table: {
        minWidth: 750,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
    close: {
        padding: theme.spacing(0.5),
    },
}));

const $ = require('jquery');
$.DataTable = require('datatables.net-responsive-bs4');

function updateTable(type) {
    const table = $('#aircraft').DataTable();
    table.ajax.reload(null, false);
}

function parseRowData(rowData) {
    if (Array.isArray(rowData) && rowData.length > 0) {
        rowData.forEach(function (item, index) {
            if (item.type !== null)
                rowData[index].type__name = item.type.name;
            else
                rowData[index].type__name = '';

            if (item.model !== null)
                rowData[index].model__name = item.model.name;
            else
                rowData[index].model__name = '';
            if (item.manufacturer !== null)
                rowData[index].manufacturer__name = item.manufacturer.name;
            else
                rowData[index].manufacturer__name = '';

            rowData[index]['actions'] = rowData[index]['checkbox'] = '';
        });
    }
    return rowData;
}

const ActionsDropdownToggle = React.forwardRef(({children, onClick}, ref) => (
    <a
        ref={ref}
        onClick={e => {
            e.preventDefault();
            onClick(e);
        }}
        id="kt_dashboard_daterangepicker"
        className="btn btn-sm btn-clean btn-icon btn-icon-md"
    >
        {" "}
        <i className="la la-ellipsis-h"></i>
    </a>
));

export default function EnhancedTable(props) {

    const classes = useStyles();
    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('calories');
    const [selected, setSelected] = React.useState([]);
    const [page, setPage] = React.useState(0);
    const [dense, setDense] = React.useState(false);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [rows, setRowsData] = React.useState([]);
    const [count, setCount] = React.useState(0); // set counter for onload functions
    const [show, setModalDisplay] = React.useState(false); // set modal to show/hide
    const [userIndex, setUser] = React.useState(0); //selected user to perform actions
    const [action, setAction] = React.useState({}); // selected action
    const [temp, setTemp] = React.useState([]); // selected action
    const [isSelectedMany, setSelectedMany] = React.useState(false);
    const [open, setOpen] = React.useState(false); // show/hide Snackbar
    const [showSpinner, setshowSpinner] = React.useState(false); // show/hide spinner
    const [message, setMessage] = React.useState('Changes applied successfully!'); // set Message
    const [showEmail, setEmailModalDisplay] = React.useState(false); // set email modal to show/hide
    const [csvData, setCsvData] = React.useState([]);
    const [table, setTable] = React.useState(false); // selected action
    const [statusData, setStatusData] = React.useState({});
    const [reason, setReason] = React.useState('');
    const [exportSpinner, setExpSpin] = React.useState('d-none');
    const [permission, setPermission] = React.useState({
        create: userHasPermission('add_abaircrafts'),
        edit: userHasPermission('change_abaircrafts'),
        delete: userHasPermission('delete_abaircrafts'),
        view: userHasPermission('view_abaircrafts'),
    });
    let history = useHistory();
    let type = props.match.params.type;

    let _statuses = [{value: '', label: 'All Assets'}]
    STATUSES.map((val, i) => {
        _statuses.push(val)
    })

    let _promote = [{value:1, label:"Active"},{value:0, label:"Inactive"}]

    React.useEffect(() => {
        if ($.fn.dataTable.isDataTable('#aircraft')) {
            let table = $('#aircraft').DataTable();
            table.destroy();
            setTable(true);
        }
        return () => {
          setRowsData([]);
          let dtable = $('#aircraft').DataTable();
          dtable.destroy(true);
          setTable(true);
        }
    }, []);

    React.useEffect(() => {

        if (table && $.fn.dataTable.isDataTable('#aircraft')) {
            if (JSON.stringify(rows) !== JSON.stringify(window.prevRows)) {
                window.prevRows = rows;
            }
        } else {
            setTable(true);
            try {
                loadDatatable();
              } catch(e) {
                console.log('ignore - dt destroy');
              }
        }
    }, [rows]);


    function loadDatatable() {
        let url = API_URL + 'aircrafts?format=datatables';
        let columnDefs = [
          { bVisible: false, aTargets: [1] },
          {
            targets: 0,
            width: "30px",
            orderable: false,
            searchable: false,
            createdCell: function(td, cellData, rowData, row, col) {
              ReactDOM.render(
                <Checkbox
                  checked={isSelected(rowData.id)}
                  onChange={(event) => handleClick(event, rowData.id, td, row)}
                  inputProps={{
                    "aria-labelledby": `enhanced-table-checkbox-${row}`,
                  }}
                />,
                td
              );
            },
          },
          {
            targets: 2,
            createdCell: function(td, cellData, rowData, row, col) {
              const name =
                rowData.model__name + " " + rowData.manufacturer__name;
              const aircraft_slug =
                rowData.id + "-" + name.replace(/\s+/g, "-").toLowerCase();
              ReactDOM.render(
                <a
                  target="_blank"
                  style={{ cursor: "pointer" }}
                  href={"/aircraft/" + aircraft_slug + "/"}
                >
                  {cellData}
                </a>,
                td
              );
            },
          },
          {
            targets: 7,
            orderable: true,
            createdCell: function(td, cellData, rowData, row, col) {
              ReactDOM.render(
                <span
                  onClick={(e) => handleModalShow(e, row, "is_featured")}
                  className={
                    cellData === 1
                      ? "kt-switch kt-switch--sm kt-switch--success"
                      : "kt-switch kt-switch--sm kt-switch--danger"
                  }
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={cellData === 1 ? "defaultChecked" : ""}
                      name="quick_panel_notifications_1"
                    />
                    <span />
                  </label>
                </span>,
                td
              );
            },
          },
          {
            targets: 8,
            title: "Created",
            createdCell: function(td, cellData, rowData, row, col) {
              ReactDOM.render(
                getDateWithFormat(new Date(cellData), "MMM DD, YYYY"),
                td
              );
            },
          },
          {
            targets: 9,
            title: "Status",
            orderable: false,
            createdCell: function(td, cellData, rowData, row, col) {
              let defaultValue = "";
              let disabledValue = "";
              ReactDOM.render(
                <Form.Control
                  onChange={(e) => changeStatus(e, row)}
                  as="select"
                >
                  {STATUSES.map((val, i) => {
                    if (val.value === cellData) defaultValue = "selected";
                    else defaultValue = "";
                    if (val.value === "Expired") disabledValue = "disabled";
                    else disabledValue = "";
                    return (
                      <option
                        disabled={disabledValue}
                        selected={defaultValue}
                        key={i}
                      >
                        {val.label}
                      </option>
                    );
                  })}
                </Form.Control>,
                td
              );
            },
          },
        ];
        if (permission.create || permission.edit) {
            columnDefs.push(
                {
                    targets: 10,
                    title: 'Actions',
                    orderable: false,
                    searchable: false,
                    "createdCell": function (td, cellData, rowData, row, col) {
                        ReactDOM.render(
                            <Dropdown className="kt-header__topbar-item" drop="down" alignLeft>
                                <Dropdown.Toggle as={ActionsDropdownToggle}/>
                                <Dropdown.Menu
                                    className="dropdown-menu-fit dropdown-menu-anim dropdown-menu-top-unround">
                                    <Dropdown.Item onClick={() => history.push("/admin/aircraft/asset/" + rowData.id, "_blank") }>
                                        <i className="flaticon-eye"></i> Views Details
                                    </Dropdown.Item>
                                    {permission.edit ? <Dropdown.Item
                                        onClick={() => history.push("/admin/aircraft/asset/" + rowData.id + "/edit")}><i
                                        className="flaticon2-edit"></i> Edit Details</Dropdown.Item> : ''}
                                    {permission.delete ?
                                        <Dropdown.Item onClick={(e) => handleModalShow(e, row, 'delete')}><i
                                            className="flaticon2-trash"></i> Remove</Dropdown.Item> : ''}
                                </Dropdown.Menu>
                            </Dropdown>
                            , td
                        );
                    }
                },);
        }
        $('#aircraft').DataTable({
            responsive: {
                details: {
                    renderer: $.fn.dataTable.Responsive.renderer.listHiddenNodes()
                }
            },
            serverSide: true,
            displayStart: getPageNum('aircrafts', props),
            ajax: {
                url: url,
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Token ' + JSON.parse(localStorage.getItem('persist:demo1-auth')).authToken.replace(/['"]+/g, '')
                },
                "dataFilter": function (data) {
                    let json = JSON.parse(data);
                    let rowData = parseRowData(json.data);
                    setRowsData(rowData);
                    json.data = rowData;
                    return JSON.stringify(json); // return JSON string
                },
            },

            // DOM Layout settings
            dom: `<'row'<'col-sm-12'tr>>
         <'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 dataTables_pager'lp>>`,

            lengthMenu: [5, 10, 25, 50],

            pageLength: 10,
            pagingType: 'numbers',
            recordsTotal: rows.recordsTotal, // The number in my test data set
            recordsFiltered: rows.recordsFiltered,

            language: {
                'lengthMenu': 'Display _MENU_',
            },

            // Order settings
            order: [[9, 'desc']],
            columnDefs: columnDefs,
        });
        $('#aircraft').on('page.dt', function () {
            setPageNum($('#aircraft'), 'aircrafts', props);
        });
    }

    function handleRequestSort(event, property) {
        const isDesc = orderBy === property && order === 'desc';
        setOrder(isDesc ? 'asc' : 'desc');
        setOrderBy(property);
    }

    function handleSelectAllClick(event) {

        if (event.target.checked) {
            const sel = selected;
            const newSelecteds = rows.map(n => n.id);
            newSelecteds.forEach(v => {
                sel.push(v)
            })
            setSelected(sel);
        } else {
            selected.length = 0;
            setSelected(selected);
        }
        if (isSelectedMany)
            setSelectedMany(false);
        else
            setSelectedMany(true);

        updateTable(type);

    }

    function handleClick(event, id, td, idx) {
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        const sel = selected;

        if (selectedIndex === -1) {
            sel.push(id);
        } else {
            sel.splice(selectedIndex, 1);
        }
        setSelected(sel);
        const newArr = [...temp];
        newArr.push(1);
        setTemp(newArr);
        //updateTable(type);
        const table = $('#aircraft').DataTable();
        table.cell( td ).render(ReactDOM.render(
              <Checkbox
              checked={isSelected(id)}
              onChange={event => handleClick(event, id, td, idx)}
              inputProps={{ 'aria-labelledby': `enhanced-table-checkbox-${idx}` }}
              />
              , td
        ));
    }

    function handleChangePage(event, newPage) {
        setPage(newPage);
    }

    function handleChangeRowsPerPage(event) {
        setRowsPerPage(+event.target.value);
    }

    function handleChangeDense(event) {
        setDense(event.target.checked);
    }

    function handleSearch(event) {
        const table = $('#aircraft').DataTable();
        table.search(event.target.value).draw();
    }

    function selectFilter(value) {
        const table = $('#aircraft').DataTable();
        table
            .columns(9)
            .search(value.value)
            .draw();
    }

    function selectPromote(value){
      const table = $('#aircraft').DataTable();
        table
            .columns(7)
            .search(value.value)
            .draw();
    }

    function handleModalClose(event) {
        setModalDisplay(false);
    }

    function handleEmailModalClose(event) {
        if (event === 'send') {
            let rowsData = [];
            if (rows.length)
                rowsData = rows;
            else
                rowsData = window.prevRows;

            let data = statusData;
            data['status_reason'] = reason;
            sendMail(statusData, userIndex, rowsData);
            setshowSpinner(true);
        }else{
            setEmailModalDisplay(false);
        }
    }

    function handleModalShow(event, index, act) {
        setUser(index);
        setAction(act)
        setModalDisplay(true);
    }

    function changeStatus(event, index) {
        let rowsData = [];
        if (rows.length)
            rowsData = rows;
        else
            rowsData = window.prevRows;
        let status = event.target.value;
        let data = {isactivestatus: event.target.value, model: 'AbAircrafts', id: rowsData[index].id};
        setUser(index);
        if (data.isactivestatus === 'Revise' || data.isactivestatus === 'Rejected') {
            setEmailModalDisplay(true);
            setStatusData(data);
        } else {
            sendMail(data, index, rowsData);
            setshowSpinner(true);
        }

    }

    function sendMail(data, index, rowsData) {
        post('assets/update_status', data).then(function (response) {
            let rows = rowsData.map((v, i) => {
                if (i === index)
                    v.isactivestatus = data['isactivestatus'];

                return v;
            });
            setRowsData(rows);
            setOpen(true);
            setEmailModalDisplay(false);
            setMessage('Status successfully updated');
            setshowSpinner(false);
            updateTable();
        })
    }

    function confirm(event) {
        if (action == 'status') {
            var data = {'is_active': rows[userIndex].is_active === 1 ? 0 : 1};
            patch('aircrafts/' + rows[userIndex].id + '/', data).then(function (response) {
                let rowsData = rows.filter((v, i) => i !== userIndex);
                setRowsData([...rowsData, response.data]);
                setModalDisplay(false);
                updateTable();
                setOpen(true);
                const statusType = response.data.is_active === 1 ? 'activated' : 'deactivated';
                setMessage('Record successfully ' + statusType);
            })
        } else if (action == 'delete') {
            del('aircrafts/' + rows[userIndex].id + '/').then(function (response) {
                let rowsData = rows.filter((v, i) => i !== userIndex);
                setRowsData(rowsData);
                setModalDisplay(false);
                updateTable();
                setOpen(true);
                setMessage('Record successfully deleted');
            })
        } else if (action === 'is_featured') {
                 var data = {
                   is_featured: rows[userIndex].is_featured === 1 ? 0 : 1,
                 };

                 post(
                   "aircrafts/" + rows[userIndex].id + "/promote/",
                   data
                 ).then(function(response) {
                   rows[userIndex] = response.data;
                   setRowsData(rows);
                   setModalDisplay(false);
                   updateTable();
                   setOpen(true);
                   setMessage(response.data.message);
                 });
        }
    }

    const handleCloseSnackbar = (event, reason) => {
        setOpen(false);
    };

    const isSelected = id => selected.indexOf(id) !== -1;

    return (
      <div className={classes.root}>
        <Paper className={classes.paper}>
          <div className={classes.tableWrapper}>
            <div className="kt-portlet kt-portlet--mobile">
              <EnhancedTableToolbar
                exportSpinner={exportSpinner}
                setExpSpin={setExpSpin}
                setTemp={setTemp}
                setRowsData={setRowsData}
                rows={rows}
                setSelectedMany={setSelectedMany}
                setSelected={setSelected}
                selected={selected}
                numSelected={selected.length}
                type={type}
                csvData={csvData}
                setCsvData={setCsvData}
              />
              <div className="kt-portlet__body">
                {permission.view ? (
                  <div className="kt-form kt-form--label-right kt-margin-t-20 kt-margin-b-10">
                    <div className="row align-items-center">
                      <div className="col-xl-12 order-2 order-xl-1">
                        <div className="row align-items-center">
                          <div className="col-md-4 kt-margin-b-20-tablet-and-mobile col-xs-12">
                            <div className="kt-input-icon kt-input-icon--left">
                              <input
                                onKeyUp={handleSearch}
                                type="text"
                                className="form-control"
                                placeholder="Search..."
                                id="generalSearch"
                              />
                              <span className="kt-input-icon__icon kt-input-icon__icon--left">
                                <span>
                                  <i className="la la-search" />
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="col-md-4 col-xs-12 kt-margin-b-20-tablet-and-mobile">
                            <Select
                              defaultValue={""}
                              name="status_"
                              onChange={selectFilter}
                              options={_statuses}
                            />
                          </div>

                          <div className="col-md-4 col-xs-12 kt-margin-b-20-tablet-and-mobile">
                            <Select
                              defaultValue={""}
                              placeholder="Promote..."
                              name="promote_"
                              onChange={selectPromote}
                              options={_promote}
                            ></Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  ""
                )}

                {permission.view ? (
                  <div className="kt-section">
                    <div>
                      <table
                        className="table table-striped- table-bordered table-hover table-checkable"
                        id={"aircraft"}
                      >
                        <thead>
                          <tr>
                            <th data-data="checkbox">
                              <Checkbox
                                checked={isSelectedMany}
                                onChange={handleSelectAllClick}
                                inputProps={{
                                  "aria-label": "primary checkbox",
                                }}
                              />
                            </th>
                            <th data-data="id">ID</th>
                            <th data-data="manufacturer__name">Manufacturer</th>
                            <th data-data="type__name">Type</th>
                            <th data-data="model__name">Model</th>
                            <th data-data="msn">MSN</th>
                            <th data-data="offer_for">Offer</th>
                            <th data-data="is_featured">Promote</th>
                            <th data-data="created_at">Created</th>
                            <th data-data="isactivestatus">Status</th>
                            <th data-data="actions">Actions</th>
                            {/* <th data-data="title">Title</th> */}
                          </tr>
                        </thead>
                      </table>
                    </div>
                  </div>
                ) : (
                  <Notice icon="flaticon-warning kt-font-primary">
                    Looks like that you don't have sufficient permission
                  </Notice>
                )}
              </div>
            </div>
          </div>
        </Paper>
        <Modal show={show} onHide={handleModalClose}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm</Modal.Title>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="success" onClick={confirm}>
              Yes
            </Button>
            <Button variant="danger" onClick={handleModalClose}>
              No
            </Button>
          </Modal.Footer>
        </Modal>
        <Snackbar
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={open}
          autoHideDuration={1600000}
          onClose={handleCloseSnackbar}
        >
          <SnackbarContentWrapper
            onClose={handleCloseSnackbar}
            variant="success"
            message={message}
          />
        </Snackbar>
        <Modal show={showEmail} onHide={handleEmailModalClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              Send mail to {statusData ? statusData.isactivestatus : ""}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <textarea
              rows="5"
              onChange={(e) => setReason(e.target.value)}
              style={{ display: "block", width: "100%" }}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="success"
              className={
                showSpinner === true
                  ? "kt-spinner kt-spinner--right kt-spinner--sm kt-spinner--light"
                  : ""
              }
              onClick={() => handleEmailModalClose("send")}
            >
              Send
            </Button>
            <Button variant="danger" onClick={handleEmailModalClose}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
}
