export const Static_Filters = {
  "offered_for": {
    name: 'OFFER FOR',
    value: [
      { name: 'Sale', value: 'Sale', type: 'checkbox' },
      { name: 'ACMI', value: 'ACMI', type: 'checkbox' },
      { name: 'Dry Lease', value: 'Dry Lease', type: 'checkbox' },
      { name: 'Wet Lease', value: 'Wet Lease', type: 'checkbox' },
      { name: 'Lease Purchase', value: 'Lease Purchase', type: 'checkbox' },
      { name: 'Exchange', value: 'Exchange', type: 'checkbox' },
      { name: 'Charter', value: 'Charter', type: 'checkbox' }
    ]
  },
  "date": {
    name: '',
    value: [
      {
        type: 'select', name: 'yom_start', options: [1975, 2020]
      },
      {
        type: 'select', name: 'yom_end', options: [2020, 1976]
      }
    ]
  },
  "status": {
    name: 'AIRCRAFT STATUS',
    value: [
      { name: 'Storage', value: 'Storage', type: 'checkbox' },
      { name: 'Parking', value: 'Parking', type: 'checkbox' },
      { name: 'Operational', value: 'Operational', type: 'checkbox' },
      { name: 'For Tear Down', value: 'For Tear Down', type: 'checkbox' }
    ]
  },
  "type": {
    name: 'TYPE',
    value: [
      { name: 'Aircraft', value: 'Aircraft', type: 'checkbox' },
      { name: 'Engine', value: 'Engine', type: 'checkbox' },
      { name: 'Apu', value: 'Apu', type: 'checkbox' },
      { name: 'Parts', value: 'Parts', type: 'checkbox' },
    ]
  },
  "terms": {
    name: 'WANTED TERMS',
    value: [
      { name: 'ACMI', value: 'ACMI', type: 'checkbox' },
      { name: 'Dry Lease', value: 'Dry Lease', type: 'checkbox' },
      { name: 'Outright Purchase', value: 'Outright Purchase', type: 'checkbox' },
      { name: 'Lease', value: 'Lease', type: 'checkbox' },
      { name: 'Cash', value: 'Cash', type: 'checkbox' },
    ]
  },
  "cycle": {
    name: '',
    value: [
      {
        type: 'select', name: 'cycle_remaining_from', options: [0, 7000]
      },
      {
        type: 'select', name: 'cycle_remaining_to', options: [7000, 0]
      }
    ]
  },

}

export let engineFilters = [
  {
    name: 'OFFERED FOR',
    value: [
      { name: 'Sale', type: 'checkbox' }, { name: 'Lease', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }
    ]
  },
  {
    name: 'CONDITION',
    value: [
      { name: 'Checkbox', type: 'text' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }
    ]
  },
  {
    name: 'CATEGORY',
    value: [
      { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }
    ]
  },
  {
    name: 'MANUFACTURER',
    value: [
      { name: 'Search Engine Manufacturer', type: 'text' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }
    ]
  },
  {
    name: 'TYPE',
    value: [
      { name: 'Search Engine Type', type: 'text' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }
    ]
  },
  {
    name: 'MODEL',
    value: [
      { name: 'Search Engine Model', type: 'text' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }, { name: 'Checkbox', type: 'checkbox' }
    ]
  },
  {
    name: 'ENGINE CYCLES',
    value: [
      {
        type: 'select', name: 'FromYom', options: [{ value: '1968', label: '1968' }, { value: '1985', label: '1985' }, { value: '2001', label: '2001' }]
      },
      {
        type: 'select', name: 'ToYom', options: [{ value: '2001', label: '2001' }, { value: '1968', label: '1968' }, { value: '1985', label: '1985' }]
      }
    ]
  }
]

export let FilterIcon = ()=>{ return (
  <div data-w-id="d353161d-7bf4-46c8-6cff-4f1d58f8c422" className="devicefilter">
    <div className="w-embed"><svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"><path fill="currentColor" d="M23 0l-8.412 15h-5.215l-8.373-15h22zm-13 17v7h4v-7h-4z" /></svg></div>
  </div>
  )
}

export let img_placeholder = "placeholder.svg"