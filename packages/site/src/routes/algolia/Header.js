import React from "react";
import {Button} from "antd";
import {connectSearchBox, SortBy} from "react-instantsearch-dom";


const AlgoliaHeader = ({onCloseFunction}) => (
  <div className="gx-algolia-header">
                   <span className="gx-drawer-btn gx-d-flex gx-d-lg-none" >
                  <Button
                    type="link"
                    onClick={onCloseFunction}
                    >
                    Filter
                    </Button>
        </span>
    <ConnectedSearchBox/>
    <div className="gx-algolia-sort-by">
      <label>Sort by</label>
      <SortBy
        items={[
          {value: 'tokenId', label: 'Creation date'},
          {value: 'virtuoso', label: 'Sale date'},
        ]}
        defaultRefinement="virtuoso"
      />
    </div>
  </div>
);
const CustomSearchBox = ({currentRefinement, refine}) => (
  <div className="gx-search-bar gx-lt-icon-search-bar">
    <div className="gx-form-group">
      <input
        type="search"
        placeholder="Search here..."
        value={currentRefinement}
        onChange={e => refine(e.target.value)}
        autoComplete="off"
        className="ant-input form-control"
        id="q"
      />
      <span className="gx-search-icon gx-pointer"><i className="icon icon-search"/></span>
    </div>
  </div>
);
const ConnectedSearchBox = connectSearchBox(CustomSearchBox);

export default AlgoliaHeader;
