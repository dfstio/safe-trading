import {combineReducers} from "redux";
import Settings from "./Settings";
import Common from "./Common";
import Blockchain from "./Blockchain";
import {connectRouter} from 'connected-react-router'

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  settings: Settings,
  common: Common,
  blockchain: Blockchain,
});

export default createRootReducer;
