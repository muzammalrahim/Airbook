import React from 'react';
import ReactDOM from 'react-dom'
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { lighten, makeStyles } from '@material-ui/core/styles';
import {
    Delete as DeleteIcon, Close as CloseIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon, Info as InfoIcon,
    Warning as WarningIcon
} from '@material-ui/icons';
import { amber, green } from '@material-ui/core/colors';
import {
    IconButton, Paper, FormControlLabel, Switch, Snackbar, Checkbox, Toolbar, Tooltip, Typography, SnackbarContent, Grid, List, ListItem, ListItemText, Divider
} from '@material-ui/core';
import { list, patch, del, USER_URL, API_URL, LOCAL_STORAGE} from "../../crud/api";
import {Button, Dropdown, Modal} from "react-bootstrap";
import { useHistory } from "react-router-dom";
import "datatables.net-bs4/css/dataTables.bootstrap4.css";
import "datatables.net-responsive-bs4/css/responsive.bootstrap4.css";
import {Link} from "react-router-dom";
import Notice from "../../partials/content/Notice";
import {ReactComponent as SortNum1Icon} from "../../../_metronic/layout/assets/layout-svg-icons/SortNum1.svg";
import moment from "moment";
import {getPageNum, setPageNum} from "../../helpers/listing";

const QuickActionsDropdownToggle = React.forwardRef(({ children, onClick }, ref) => (
    <button
        ref={ref}
        onClick={e => {
          e.preventDefault();
          onClick(e);
        }}
        className="btn kt-header__btn-primary"
    >
      Actions
      <SortNum1Icon className="kt-svg-icon kt-svg-icon--sm" />
    </button>
));

function createDataArray(  id, name, action, type ) {
  return [ id, name, action, type];
}

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
  const { numSelected, type, selected, setSelected, setSelectedMany, setRowsData, rows, setTemp } = props;


  function handleDelAll(event) {
    if(selected.length) {
      let data = {ids:selected}
      del('favourites/'+selected[0]+'/', data).then(function (response) {
        // here removing rows from dt-table that are deleted from database
        for(let i in rows){
          if(selected.indexOf(rows[i].id) > -1) {
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
      })
    }
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
                <i className="kt-font-brand flaticon-black" />
              </span>
                {numSelected > 0 ? (
                  <Typography color="inherit" variant="subtitle1">
                    {numSelected} selected
                  </Typography>
                ) : (
                  <h3 className="kt-portlet__head-title">
                   Favourites
                  </h3>
                )}
            </div>
            <div className="kt-portlet__head-toolbar">
              <div className="kt-portlet__head-wrapper">
                <div className="kt-portlet__head-actions">
                      {numSelected > 0 ? (
                          <Tooltip title="Delete">
                            <IconButton onClick={(e) => handleDelAll(e)} aria-label="Delete">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                      ) : (
                          <div className="btn-group">
                            {/*<Link to={"/lead/create"} className="btn btn-sm btn-brand btn-elevate btn-icon-sm new-record">
                                <i className="la la-plus"></i>
                                New Record
                            </Link>*/}
                              <Dropdown className="dropdown-inline" drop="down" alignRight>
                                <Dropdown.Toggle as={QuickActionsDropdownToggle}
                                  id="dropdown-toggle-quick-actions-subheader"
                                />

                                <Dropdown.Menu className="dropdown-menu-fit dropdown-menu-md dropdown-menu-right">
                                  <ul className="kt-nav">
                                    <li className="kt-nav__item">
                                      <a href="#" className="kt-nav__link">
                                        <i className="kt-nav__link-icon la la-upload" />
                                        <span className="kt-nav__link-text">Export</span>
                                      </a>
                                    </li>
                                    <li className="kt-nav__item">
                                      <a href="#" className="kt-nav__link">
                                        <i className="kt-nav__link-icon la la-download" />
                                        <span className="kt-nav__link-text">Import</span>
                                      </a>
                                    </li>
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
    const table = $('#favourite').DataTable();
    table.ajax.reload(null, false);
}

function parseRowData(rowData) {
    const JsonArray = [];

    if( Array.isArray(rowData) && rowData.length > 0){
      rowData.forEach(function(item, index){
        JsonArray.push(createDataArray(
            item.favouritable_id,
            (item.favouritable && item.favouritable_name) ? item.favouritable_name : ' --- ' ,
            false,
            (item.favouritable && item.favouritable_type) ? item.favouritable_type : ' --- ' ,
            ));
      });
    }
    return JsonArray;
}

const ActionsDropdownToggle = React.forwardRef(({ children, onClick }, ref) => (
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
  const [message, setMessage] = React.useState('Changes applied successfully!'); // set Message
  const [csvData, setCsvData] = React.useState([]);
  const [table, setTable] = React.useState(false); // selected action
  const [exportSpinner, setExpSpin] = React.useState('d-none'); // selected action
  let history = useHistory();
  let type = props.match.params.type;
  //  call some function only on page load

  React.useEffect(() => {
      if($.fn.dataTable.isDataTable( '#favourite' )) {
      let table = $('#favourite').DataTable();
      table.destroy();
      setTable(true);
    }
  }, []);

  React.useEffect(() => {
    if (table && $.fn.dataTable.isDataTable( '#favourite' ) ) {
        if(JSON.stringify(rows) !== JSON.stringify(window.prevRows)){
          window.prevRows = rows;
        }
      } else {
        setTable(true);
        loadDatatable();
      }
    }, [rows]);


  function loadDatatable() {
    let url = API_URL+'favourites?format=datatables';
      let columnDefs = [
          { "bVisible": false, "aTargets": [0] },
          {
              targets: 1,
              "createdCell": function (td, cellData, rowData, row, col) {
                  let view_name = rowData[3]?rowData[3].replace("App\\",'').toLowerCase():'';
                  let view_slug = rowData[1]?rowData[1].replace(/\s+/g, '-').toLowerCase():'';
//                    switch(view_name){
//                        case 'Aircraft':
//                            view_name='aircraft';
//                            break;
//                        case 'Airport':
//                            view_name='airport';
//                            break;
//
//                    }
                  let favName = cellData.toLowerCase();
                  if(favName.includes('-yom-')){
                      favName = favName.split('-yom-')[0].replace(/-/g,' ')
                  }else{
                      favName = favName.replace(/-/g,' ')
                  }
                  ReactDOM.render(
                      <a style={{textTransform: 'capitalize'}} href={"/"+view_name+"/"+rowData[0]+"-"+view_slug} target="_blank">
                          {favName}</a>
                      , td
                  );
              }
          },
          {
              targets: 2,
              "createdCell": function (td, cellData, rowData, row, col) {
                  let view_name = rowData[3]?rowData[3].replace("App\\",''):'';
                  ReactDOM.render(
                      <span>{view_name}</span>
                      , td
                  );
              }
          },
      ];
      columnDefs.push(
          {
              targets: 3,
              title: 'Actions',
              orderable: false,
              "createdCell": function (td, cellData, rowData, row, col) {
                  ReactDOM.render(
                      <>
                      <IconButton aria-label="Delete" onClick={(e) => handleModalShow(e, row, 'delete')}>
                          <DeleteIcon />
                      </IconButton>
                      </>
                      , td
                  );
              }
          },);
    $('#favourite').DataTable({
      responsive: {
        details: {
          renderer: $.fn.dataTable.Responsive.renderer.listHiddenNodes()
        }
      },
      serverSide:true,
      displayStart : getPageNum('favourite', props),
      ajax: {
        url:url ,
        method: "GET",
        headers: {'Content-Type': 'application/json', 'Authorization': 'Token '+JSON.parse(localStorage.getItem(LOCAL_STORAGE)).authToken.replace(/['"]+/g, '')},
        "dataFilter": function(data) {
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
        order: [[3, 'desc']],
      columnDefs:columnDefs ,
    });
    $('#favourite').on( 'page.dt', function () {
      setPageNum($('#favourite'), 'favourite', props);
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
    }else{
        selected.length = 0;
        setSelected(selected);
    }
    if(isSelectedMany)
      setSelectedMany(false);
    else
      setSelectedMany(true);

    updateTable(type);

  }

  function handleClick(event, id, td, idx) {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    const sel =selected;

    if(selectedIndex === -1){
        sel.push(id);
    }else{
        sel.splice(selectedIndex, 1);
    }
    setSelected(sel);
    const newArr = [...temp];
    newArr.push(1);
    setTemp(newArr);
      updateTable(type);
  }

  function handleSearch(event) {
      const table = $('#favourite').DataTable();
      table.search( event.target.value ).draw();
  }

  function handleModalClose(event) {
    setModalDisplay(false);
  }

  function handleModalShow(event, index, act) {
      setAction(act)
      setUser(index)
      setModalDisplay(true);
  }

  function confirm(event) {
      del('likes/'+rows[userIndex][0]+'/').then(function (response) {
          let rowsData = rows.filter((v,i) => i !== userIndex);
          setRowsData(rowsData);
          setModalDisplay(false);
          updateTable();
          setOpen(true);
          setMessage('Record successfully deleted');
      })
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
            <EnhancedTableToolbar setTemp={setTemp} setRowsData={setRowsData} rows={rows} setSelectedMany={setSelectedMany} setSelected={setSelected} selected={selected} numSelected={selected.length} />
          <div className="kt-portlet__body">

            <div className="kt-form kt-form--label-right kt-margin-t-20 kt-margin-b-10">
              <div className="row align-items-center">
                <div className="col-xl-12 order-2 order-xl-1">
                  <div className="row align-items-center">
                    <div className="col-md-4 kt-margin-b-20-tablet-and-mobile">
                      <div className="kt-input-icon kt-input-icon--left">
                        <input onKeyUp={handleSearch}  type="text" className="form-control" placeholder="Search..." id="generalSearch" />
                        <span className="kt-input-icon__icon kt-input-icon__icon--left">
                          <span><i className="la la-search" /></span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="kt-section">
                <div>
                  <table className="table table-striped- table-bordered table-hover table-checkable" id={"favourite"}>
                      <thead>
                      <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Entity</th>
                          <th>Action</th>
                      </tr>
                      </thead>
                  </table>
                </div>
            </div>
          </div>
        </div>
        </div>
      </Paper>
        <Modal show={show} onHide={handleModalClose}>
            <Modal.Header closeButton>
                    <Modal.Title>Confirm</Modal.Title>
            </Modal.Header>
          <Modal.Footer>
              <Button variant="danger" onClick={confirm}>
                  Yes
              </Button>
              <Button variant="success" onClick={handleModalClose}>
                  No
              </Button>
          </Modal.Footer>
        </Modal>
      <Snackbar
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
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
    </div>
  );
}
