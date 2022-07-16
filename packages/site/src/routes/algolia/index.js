import React, {useState} from 'react';
import {Layout, Drawer} from "antd";
import {Configure, connectHits, connectStateResults, InstantSearch, Pagination, Stats,} from 'react-instantsearch-dom';
import {withUrlSync} from './urlSync';
import 'instantsearch.css/themes/algolia.css';
//import './style.css'
import Header from "./Header";
import Sidebar from "./SideBar";
import Footer from "./Footer";
import ProductList from "./ProductList";
import algoliasearch from 'algoliasearch';

const {Content} = Layout;

const {REACT_APP_ALGOLIA_KEY, REACT_APP_ALGOLIA_PROJECT} = process.env;
const searchClient = algoliasearch(REACT_APP_ALGOLIA_PROJECT, REACT_APP_ALGOLIA_KEY);

const App = props =>
{
    const [visible, setVisible] = useState(false);

    function onCloseFunction()
    {
        setVisible(!visible);
        console.log("OnClose");
    }

return (
  <InstantSearch className="gx-main-content"
                 indexName="virtuoso"
                 searchState={props.searchState}
                 createURL={props.createURL}
                 searchClient={searchClient}
                 onSearchStateChange={props.onSearchStateChange}>

    <Configure hitsPerPage={15}/>

    <Layout className="gx-algolia-layout-has-sider">
        <div className="gx-d-block gx-d-lg-none">
            <Drawer
              placement="left"
              closable={false}
              visible={visible}
              onClose={onCloseFunction}
             >
               <Sidebar />
            </Drawer>
          </div>

      <div className="gx-d-none gx-d-lg-flex">
      <Sidebar />
      </div>
      <div className="gx-algolia-main">
         <Header onCloseFunction={onCloseFunction}/>
        <Content className="gx-algolia-content">
          <CustomResults/>
        </Content>
        <Footer>
          <Pagination showLast={true}/>
        </Footer>
      </div>
    </Layout>
  </InstantSearch>
);
};

const CustomResults = connectStateResults(({searchState, searchResult}) => {
  if (searchResult && searchResult.nbHits === 0) {
  //console.log("CustomResults1", searchState, searchResult );
    return (
      <div className="gx-algolia-content-inner">
        <div className="gx-algolia-no-results">
          No results found matching{' '}
          <span className="gx-algolia-query">{searchState.query}</span>
        </div>
      </div>
    );
  } else {
    //console.log("CustomResults2", searchState, searchResult );
    return (
      <div className="gx-algolia-content-inner">
        <Stats />
        <ConnectedProducts/>
      </div>
    );
  }
});

const ConnectedProducts = connectHits(ProductList);

export default withUrlSync(App);
