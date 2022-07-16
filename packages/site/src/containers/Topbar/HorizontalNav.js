import React from "react";
import {useSelector} from "react-redux";
import {Menu} from "antd";
import {Link} from "react-router-dom";
import IntlMessages from "../../util/IntlMessages";
import {
  NAV_STYLE_ABOVE_HEADER,
  NAV_STYLE_BELOW_HEADER,
  NAV_STYLE_DEFAULT_HORIZONTAL,
  NAV_STYLE_INSIDE_HEADER_HORIZONTAL,
  THEME_TYPE_LITE
} from "../../constants/ThemeSetting";

const SubMenu = Menu.SubMenu;
const MenuItemGroup = Menu.ItemGroup;

const HorizontalNav = () => {
  const {navStyle , themeType} = useSelector(({settings}) => settings);
  const pathname = useSelector(({common}) => common.pathname);

  const getNavStyleSubMenuClass = (navStyle) => {
    switch (navStyle) {
      case NAV_STYLE_DEFAULT_HORIZONTAL:
        return "gx-menu-horizontal gx-submenu-popup-curve";
      case NAV_STYLE_INSIDE_HEADER_HORIZONTAL:
        return "gx-menu-horizontal gx-submenu-popup-curve gx-inside-submenu-popup-curve";
      case NAV_STYLE_BELOW_HEADER:
        return "gx-menu-horizontal gx-submenu-popup-curve gx-below-submenu-popup-curve";
      case NAV_STYLE_ABOVE_HEADER:
        return "gx-menu-horizontal gx-submenu-popup-curve gx-above-submenu-popup-curve";
      default:
        return "gx-menu-horizontal";
    }
  };

  const selectedKeys = pathname.substr(1).split('/')[0];
  const defaultOpenKeys = selectedKeys.split('/')[1];
  //console.log("Menu", selectedKeys, defaultOpenKeys );
  return (
    <Menu
      defaultOpenKeys={[defaultOpenKeys]}
      selectedKeys={[selectedKeys]}
      theme={themeType === THEME_TYPE_LITE ? 'lite' : 'dark'}
      mode="horizontal">

      <Menu.Item className="gx-menu-horizontal-flex gx-submenu-popup-curve"  key="mint">
          <Link to="/mint">
            <i className="icon icon-culture-calendar"/>
            <IntlMessages id="sidebar.samplePage"/>
          </Link>
      </Menu.Item>
      <Menu.Item  className="gx-menu-horizontal-flex gx-submenu-popup-curve" key="marketplace">
            <Link to="/marketplace"><i className="icon icon-shopping-cart "/>
            <IntlMessages id="sidebar.algolia"/></Link>
      </Menu.Item>
      <Menu.Item className="gx-menu-horizontal-flex gx-submenu-popup-curve"  key="settings">
          <Link to="/settings">
            <i className="icon icon-components"/>
            <IntlMessages id="sidebar.settings"/>
          </Link>
        </Menu.Item>


    </Menu>
  );
};

HorizontalNav.propTypes = {};

export default HorizontalNav;

