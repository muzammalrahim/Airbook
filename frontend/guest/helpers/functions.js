import { list, post, MEDIA_URL } from "./api";
import axios from "axios";

export function showFilters(filters, $class, requiredFor) {
  let { selected_filters } = $class.state;
  let data =
    filters &&
    filters.map((filter, i) => {
      let filter_key = filter.name.replace(/\s+/g, "_").toLowerCase();
      let filterValues = filter.value;
      if(filter.name === 'YOM')
        filterValues = filter.value.map(v => v.split('-')[0])

      if(['YOM', 'ENGINE CYCLES', 'APU CYCLES'].indexOf(filter.name) > -1)
        filterValues = filterValues.filter( onlyUnique );

      return (
        <div className="filter-cat-block" key={filter.name + "-" + i}>
          <div className="filter-cat-name">
            <div className="filter-cat-title">{filter.name}</div>
            <div className="down-arrow w-embed">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M0 7.33l2.829-2.83 9.175 9.339 9.167-9.339 2.829 2.83-11.996 12.17z"
                ></path>
              </svg>
            </div>
          </div>
          {filter.value && !(['YOM', 'ENGINE CYCLES', 'APU CYCLES'].indexOf(filter.name) > -1) && 
            filter.value.map((val, index) => {
              let selected = selected_filters[filter_key] && selected_filters[filter_key].includes(val.value);
              return val.type !== "checkbox" && val.type !== "select" ? (
                    <input
                      key={index}
                      type={val.type}
                      className="filter-search-field w-input"
                      maxLength="256"
                      name={val.name}
                      value={$class.state[val.name]}
                      data-name={val.name}
                      placeholder={val.placeholder}
                      onChange={(e) => searchByAttr(e, $class, requiredFor)}
                      id={val.name}
                    />
                  ):'';
            })}
          <div className="checkbox-scroll-block">
          {filter.value &&
            filter.value.map((val, index) => {
              let selected = selected_filters[filter_key] && selected_filters[filter_key].includes(val.value);
              return val.type == "checkbox" ? (
                <label className="w-checkbox checkbox-block" key={val.name + "-" + index}>
                  <div className={"w-checkbox-input w-checkbox-input--inputType-custom checkbox " + (selected === true && "w--redirected-checked")}></div>
                  <input
                    type={val.type}
                    id={val.name.replace(/\s+/g, "-").toLowerCase() + index}
                    name={"checkbox-" + index}
                    data-name={"Checkbox " + index}
                    style={{ opacity: 0, position: "absolute", zIndex: -1 }}
                    onChange={() => {
                      filteredValues(
                        val.value,
                        filter.name.replace(/\s+/g, "_").toLowerCase(),
                        $class,
                        requiredFor
                      );
                    }}
                  />
                  <span className="checkbox-label w-form-label">
                    {val.name}
                  </span>
                </label>
              ) : '';
            })}

            {['YOM', 'ENGINE CYCLES', 'APU CYCLES'].indexOf(filter.name) > -1 ? 
              <div className="filter-yom">
                  <select
                    id={filter_key+'_start'}
                    name={filter_key+'_start'}
                    data-name={filter_key+'start'}
                    className="filter-select-field left-select w-select"
                    onChange={(e) => selectFilter(e, $class, requiredFor)}
                    value={$class.state.selected_filters[filter_key+'_start']}
                  >
                  {filterValues.map((v,i) => <option value={v} key={i}>{v}</option>)}
                  </select>
                  <select
                    id={filter_key+'_end'}
                    name={filter_key+'_end'}
                    data-name={filter_key+'end'}
                    className="filter-select-field left-select w-select"
                    onChange={(e) => selectFilter(e, $class, requiredFor)}
                    value={$class.state.selected_filters[filter_key+'_end']}
                  >
                  {filterValues.slice(0).reverse().map((v,i) => {
                    if($class.state.selected_filters[filter_key+'_start']) {
                      if(v >= $class.state.selected_filters[filter_key+'_start'])
                        return <option value={v} key={i}>{v}</option>;
                    } else 
                      return <option value={v} key={i}>{v}</option>;
                  })}
                  </select>
              </div>:''
            }
          </div>
        </div>
      );
    });
  return data;
}


export function selectFilter(event, $class) {
  if (event.target.value !== null) {
    let key = event.target.name;
    let { selected_filters } = $class.state;
    selected_filters[key] = event.target.value;
    $class.setState({ selected_filters });
    $class.getListings();
  }
}

export function filteredValues(value, key, $class) {
  
  let { selected_filters } = $class.state;
  if (selected_filters[key] && selected_filters[key].length > 0) {
    if (selected_filters[key].includes(value)) {
      selected_filters[key].map((val, index) => {
        if (val === value) {
          selected_filters[key].splice(index, 1);
        }
      });
    } else {
      selected_filters[key].push(value);
    }
  } else {
    selected_filters[key] = [value];
  }
  $class.setState({ selected_filters });
  $class.loadModels();
  $class.getListings();
}

export function formatDate(date, key) {
  if (date != null && date != "") {
    let timestamp = Date.parse(date);
    let data = new Date();
    if(isNaN(timestamp) == false)
      data = new Date(timestamp);
    const dateTimeFormat = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    const [
      { value: month },
      ,
      { value: day },
      ,
      { value: year },
    ] = dateTimeFormat.formatToParts(data);
    return key == "yom"
      ? `${year}`
      : key == "availability"
        ? `${month} ${year}`
        : key === 'differance' ? `${month}/${day}/${year}` : `${month} ${day}, ${year}`;
  }
  return "";
}

export function checkValue(value) {
  if (value !== null && value !== "") return value;
  return "";
}

export function next_link(next, $class) {
  if(next !== null){
    next = typeof next == "string" && (next.includes("?")) ? next.split('?') : next;
    next = Array.isArray (next) ? next[1].split('&') : next;
    let link = {}
      let page = "";
    Array.isArray (next) && next.map((data, index)=>{
      let key = data.split('=');
      if(key[0]!=='frontend'){
        if(key[0] !=='page')
          link[key[0]] = `${key[0]}=${key[1]}`;
        else{
          page = key[1];
        }
      }
    })

    let link_final = '';
    Object.keys(link).map((key, index)=>{
        link_final = index ===0 ? link[key] : `${link[key]}&${link_final}`;
    })
    if(link_final !== ''){
      if(page !== ''){
        return `${page}?${link_final}`
      }
      else {
        return `1?${link_final}`
      }
    } else{
        return page !== '' ? page : 1;
      }
  }
  else{
    return null
  }
}

export function previous_link(previous) {
  if(previous !== null){
    previous = typeof previous == "string" && (previous.includes("?")) ? previous.split('?') : previous;
    previous = Array.isArray (previous) ? previous[1].split('&') : previous;
    let link = {}
      let page = "";
    Array.isArray (previous) && previous.map((data, index)=>{
      let key = data.split('=');
      if(key[0]!=='frontend'){
        if(key[0] !=='page')
          link[key[0]] = `${key[0]}=${key[1]}`;
        else{
          page = key[1];
        }
      }
    })

    let link_final = '';
    Object.keys(link).map((key, index)=>{
        link_final = index ===0 ? link[key] : `${link[key]}&${link_final}`;
    })
    if(link_final !== ''){
      if(page !== ''){
        return `${page}?${link_final}`
      }
      else {

        return `1?${link_final}`
      }
    } else{

        return page !== '' ? page : 1;
      }
  }
  else{
    return null
  }
}

export function likes(id, path) {
  let data = {
    "id": id,
    "path": path
  }
  return post('liked', data);
}

export function getData($class, data){
  data && data.map((dat)=>{
    let key = dat.key;
    list(dat.api, dat.params).then((response)=>{
        $class.setState({[key]:response.data})
    })
  })
}

export function ucwords(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}


function searchByAttr(e, $class, menu) {
  $class.setState({[e.target.name]:e.target.value});
  let itemKey = e.target.name.replace(menu, '')

  post('abmodels', { models: {
    [itemKey]:{ name__icontains:e.target.value}
  } }).then(function (response) {
      let values = [];
      values.push({
        name:`${menu+itemKey}`, 
        placeholder:`Search ${menu} ${ucwords($class.filter_keys[itemKey])}`, 
        type:'input'
      })
      response.data[itemKey].map((value) => {
        values.push({ name: value.name, value: value && value.id, type: 'checkbox' })
      })

      let filters = $class.state.filters;
      let newfilters = filters.map(filter => {
        if(filter.name === $class.filter_keys[itemKey])
          return { name: $class.filter_keys[itemKey], value: values };

        return filter;
      })
      $class.setState({filters:newfilters})
  })
}

export function availFor($class, key){
  let {selected_filters, search_str} = $class.state;
  let string = [];
  Object.keys(selected_filters).map((obj)=>{
      if(selected_filters[obj].length > 0 && obj === "offer_for"){
        selected_filters[obj].map((value)=>{
          string.push(value);
        })
      }else if(key=== 'wanted' && selected_filters[obj].length > 0 && obj === "type"){
        selected_filters[obj].map((value)=>{
          string.push(value);})
      }
  })
  let result = "";
  string.length > 0 && string.map((str, index)=>{
      if(string.length === 1 || index === 0){
        result = str;
      }else if(index+1 === string.length){
        result = result +  ' and ' + str;
      }else{
        result = result + ', ' +str;
      }
  })
   return  result;
}

export function graphValues(init_array, key){
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var today = new Date();
  var d;
  var selected_months=[], likes=[], views=[];

  for(var i = 10; i > 0; i -= 1) {
    d = new Date(today.getFullYear(), today.getMonth() - (i-1), 1);
    selected_months.push(months[d.getMonth()]);
    likes.push(0);
    views.push(0);
  }

  init_array.length > 0 && init_array.map((inner_array)=>{
    inner_array.length > 0 && inner_array.map((data)=>{
      selected_months.map((month, index)=>{
        if(month === months[data.month-1]){
          if(data['views']){
            views[index] = data.views;
          }
          else if(data['likes']){
            likes[index] = data.likes;
          }
        }
      })
    })   
  })
  return { ['monthsBy'+key]:selected_months, ['viewsBy'+key]:views, ['likesBy'+key]:likes }
}

function getDate(date){
  let timestamp = Date.parse(date);
    let data = new Date();
    if(isNaN(timestamp) == false)
      data = new Date(timestamp);
    const dateTimeFormat = new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "numeric",
      day: "2-digit",
    });
    const [
      { value: month },
      ,
      { value: day },
      ,
      { value: year },
    ] = dateTimeFormat.formatToParts(data);
    return `${month}/${day}/${year}`
}

export function find_date_differance(last_c, now) {
  let date1 = getDate(now);
  let date2 = getDate(last_c);
  let dt1 = new Date(date1);
  let dt2 = new Date(date2);
  return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) ) /(1000 * 60 * 60 * 24));
}

export function getMediaUrl(media) {
  if(media !== null && media.thumb !== null) 
    return `${MEDIA_URL+media.thumb}`
  else
    return null
}

export function renderMenus(){
  // if(typeof $ !== undefined && typeof $ !== 'undefined') {
  //   if(!$('.w-nav-overlay').length)
  //     $('.ab-container.w-container').after('<div class="w-nav-overlay" data-wf-ignore="" id="w-nav-overlay-10"></div>')
  // }
}

export function randomizeOrdering(model) {
  post(`randomize/${model}`)
}

export function getTitle(title, type=null) {
  try {
    if(type === 'wanted')
      return title.split('-wanted-for')[0].replace(/-/g, ' ')
    
    return title.split('-available-for')[0].replace(/-/g, ' ');
  } catch {
    return ''
  }
}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}


export function load_meta(path) {
    return axios
      .get(process.env.NEXT_PUBLIC_API_URL + `api/seos`, {
        params: { model_type: path, frontend:true },
      })
}