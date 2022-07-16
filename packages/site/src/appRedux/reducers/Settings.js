import {SWITCH_LANGUAGE} from "../../constants/ActionTypes";
import {
  LAYOUT_TYPE,
  LAYOUT_TYPE_FULL,
  LAYOUT_TYPE_FRAMED,
  NAV_STYLE,
  NAV_STYLE_FIXED,
  NAV_STYLE_DEFAULT_HORIZONTAL,
  NAV_STYLE_BELOW_HEADER,
  NAV_STYLE_INSIDE_HEADER_HORIZONTAL,
  NAV_STYLE_DARK_HORIZONTAL,
  THEME_COLOR, ORANGE_SEC, DEEP_ORANGE,
  THEME_TYPE,
  THEME_TYPE_SEMI_DARK, THEME_TYPE_LITE, UPDATE_RTL_STATUS
} from "../../constants/ThemeSetting";

const initialSettings = {
  navStyle: NAV_STYLE_DEFAULT_HORIZONTAL,
  layoutType: LAYOUT_TYPE_FULL,
  themeType: THEME_TYPE_SEMI_DARK,
  themeColor: '',

  isDirectionRTL: false,
  locale: {
    languageId: 'english',
    locale: 'en',
    name: 'English',
    icon: 'us'
  }
};

const SettingsReducer = (state = initialSettings, action) => {
  switch (action.type) {

    case THEME_TYPE:
      return {
        ...state,
        themeType: action.themeType
      };
    case THEME_COLOR:
      return {
        ...state,
        themeColor: action.themeColor
      };

    case UPDATE_RTL_STATUS:
      return {
        ...state,
        isDirectionRTL: action.rtlStatus
      };

    case NAV_STYLE:
      return {
        ...state,
        navStyle: action.navStyle
      };
    case LAYOUT_TYPE:
      return {
        ...state,
        layoutType: action.layoutType
      };

    case SWITCH_LANGUAGE:
      return {
        ...state,
        locale: action.payload,

      };
    default:
      return state;
  }
};

export default SettingsReducer;
