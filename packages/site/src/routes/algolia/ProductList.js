import React from 'react';
import {Col, Row} from 'antd';

import ProductItem from './ProductItem';

const ProductList = ({hits}) => {
 // console.log("ProductList", hits);
  return (
    <div id="product">
      <Row key={"ProductListRow"}>
        {hits.map(product => (
          <Col xl={8} lg={12} md={12} sm={12} xs={24} key={"ProductListCol"+product.objectID}>
            <ProductItem
              item={product}
              key={"ProductList"+product.objectID}

              />
          </Col>
        ))}
      </Row>
    </div>
  );
};
export default ProductList;
