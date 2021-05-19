import { USER_URL } from "../../app/crud/api";

export default {
  header: {
    self: {},
    items: [
      {
        title: "Quick Add",
        root: true,
        alignment: "left",
        toggle: "click",
        "custom-class": "quick-add-btn",
        icon: "flaticon-add-circular-button",
        submenu: [
          {
            title: "Aircraft",
            parent_title: "Quick Add",
            root: true,
            bullet: "dot",
            page: USER_URL+'/aircraft/asset/create',
          },
          {
            title: "Engines",
            parent_title: "Quick Add",
            root: true,
            bullet: "dot",
            page: USER_URL+'/engine/asset/create',
          },
          {
            title: "APU",
            parent_title: "Quick Add",
            root: true,
            bullet: "dot",
            page: USER_URL+'/apu/asset/create',
          },
          {
            title: "Parts",
            parent_title: "Quick Add",
            root: true,
            bullet: "dot",
            page: USER_URL+'/part/asset/create',
          },
          {
            title: "Wanted",
            parent_title: "Quick Add",
            root: true,
            bullet: "dot",
            page: USER_URL+'/wanted/asset/create',
          },
        ]
      },
    ]
  },
  aside: {
    self: {},
    items: [
      {
        title: "Dashboard",
        root: true,
        icon: "flaticon2-architecture-and-city",
        page: USER_URL+"/dashboard",
        translate: "MENU.DASHBOARD",
        bullet: "dot"
      },
      {
        title: "Assets",
        root: true,
        bullet: "dot",
        icon: "flaticon2-layers-2",
        submenu: [
          {
            title: "Aircraft",
            parent_title: "Assets",
            root: true,
            bullet: "dot",
            page: USER_URL+'/aircraft/asset',
          },
          {
            title: "Engines",
            parent_title: "Assets",
            root: true,
            bullet: "dot",
            page: USER_URL+'/engine/asset',
          },
          {
            title: "APU",
            parent_title: "Assets",
            root: true,
            bullet: "dot",
            page: USER_URL+'/apu/asset',
          },
          {
            title: "Parts",
            parent_title: "Assets",
            root: true,
            bullet: "dot",
            page: USER_URL+'/part/asset',
          },
          {
            title: "Wanted",
            parent_title: "Assets",
            root: true,
            bullet: "dot",
            page: USER_URL+'/wanted/asset',
          },
        ]
      },
      {
        title: "Leads",
        root: true,
        bullet: "dot",
        icon: "flaticon-network",
        page: USER_URL+'/lead',
      },
      {
        title: "Connections",
        root: true,
        bullet: "dot",
        icon: "flaticon-attachment",
        page: USER_URL+'/connection',
      },
      {
        title: "Favourites",
        root: true,
        bullet: "dot",
        icon: "flaticon-black",
        page: USER_URL+'/favourite',
      },
      {
        title: "Contacts",
        root: true,
        icon: "flaticon-avatar",
        page: USER_URL+'/contacts',
      },
      {
        title: "Invoices",
        root: true,
        icon: "flaticon-notepad",
        page: USER_URL+'/invoices',
      },/*
      {
        title: "Layout Builder",
        root: true,
        icon: "flaticon2-expand",
        page: "builder"
      },*/
      {
        title: "My Company",
        root: true,
        bullet: "dot",
        icon: "flaticon-buildings",
        page: USER_URL+'/company/edit',
      },
      {
        title: "Cart",
        root: true,
        skin: "light",
        icon: "flaticon2-shopping-cart-1",
        page: USER_URL+'/cart',
      },
    ]
  }
};
