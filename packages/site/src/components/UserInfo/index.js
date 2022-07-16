import {Avatar, Popover} from "antd";
import jazzicon from '@metamask/jazzicon';
import React, { createRef, useEffect, PureComponent } from 'react';
import {useDispatch, useSelector} from "react-redux";

const UserInfo = () => {

  const address = useSelector(({blockchain}) => blockchain.address);

  const userMenuOptions = (
    <ul className="gx-user-popover">
      <li>Topup balance</li>
      <li>Balance history</li>
    </ul>
  );

  //componentRef.current.appendChild(identicon);


  /*
  <div style={{"border-radius": "50px", overflow: "hidden", padding: "0px", margin: "0px", width: "38px", height: "38px", display: "inline-block", background: "rgb(35, 60, 225)"}}>
      <svg x="0" y="0" width="38" height="38">
      <rect x="0" y="0" width="38" height="38"
      transform="translate(3.2564549859523515 1.4080886294670862)
      rotate(75.9 19 19)"
      fill="#FAAB00">
      </rect>
      <rect x="0" y="0" width="38" height="38" transform="translate(-11.202634171018696 -11.67291887244622) rotate(350.0 19 19)" fill="#F1F500">
      </rect>
      <rect x="0" y="0" width="38" height="38" transform="translate(26.77566249728413 -2.3238430728563464) rotate(453.1 19 19)" fill="#F97501"></rect></svg></div>


 */


  return (
    <Popover overlayClassName="gx-popover-horizantal" placement="bottomRight" content={userMenuOptions}
             trigger="click">
      {(address==="")?
      (
          ""
      )
      :
      (
      <Jazz
        className="gx-avatar gx-pointer"
        address={address}
        />
      )}
    </Popover>
  );

};

const Jazz = (props) => {

// 38 x 38
  const address = props.address;
  const diameter = 38;
  //console.log("Jazz", address);


  function jsNumberForAddress(address) {
       const addr = address.slice(2, 10);
       const seed = parseInt(addr, 16);
       return seed;
  }
  const numericRepresentation = jsNumberForAddress(address);
  const identicon = jazzicon(diameter, numericRepresentation);
  const container = createRef();

  function removeExistingChildren() {
    const { children } = container.current;

    for (let i = 0; i < children.length; i++) {
      container.current.removeChild(children[i]);
    }
  }

    useEffect(() => {
          removeExistingChildren();
          container.current.appendChild(identicon);

  },[address])


return (<div ref={container}  />)


};


export default UserInfo;



