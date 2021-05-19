export function setPageNum(el, view, props){
    let info = el.DataTable().page.info();
    let extra_data = props.extra_data;
    if(extra_data[view] !== undefined)
      extra_data[view].page_no = info.page;
    else 
      extra_data[view] = {page_no : info.page};
    props.setExtraData(extra_data);
}

export function getPageNum(view, props) {
	let page = 0;
  if(props.extra_data !== undefined) {
    let lastPath = props.extra_data.lastPath;
    if(lastPath !== undefined && lastPath.indexOf(props.location.pathname) > -1 && lastPath.indexOf('edit') == -1 && lastPath.indexOf('create') == -1 ) {
      if(props.extra_data[view] !== undefined)
        page = props.extra_data[view].page_no * 10;
    }
  }
	return page;
}

export const getDateWithFormat = (date=null, format=null) => {
  let months = ['Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sep','Oct','Nov','Dec'];
  if(date === null)
    date = new Date();

  let dd = date.getDate();
  let mm = date.getMonth() + 1; //January is 0!

  var yyyy = date.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  if(format === 'YYYY-MM-DD')
    return yyyy+'-'+mm+'-'+dd;
  else if(format === 'DD-MM-YY')
    return dd+'-'+mm+'-'+yyyy.toString().substr(-2);
  else if(format === 'MMM DD, YYYY')
    return months[mm-1]+' '+dd+', '+yyyy;
 

  return dd + '.' + mm + '.' + yyyy;
}