import React from "react";
import api from "../../serverless/api";
import {isMobile, isDesktop, isChrome} from 'react-device-detect';
import {accountingEmail } from "../../util/config";
import {Button, message} from "antd";
import {useDispatch, useSelector} from "react-redux";
import {updateAddress, updateVirtuosoBalance, updatePublicKey} from "../../appRedux/actions";
import { metamaskLogin,
         virtuosoRegisterPublicKey
         } from "../../blockchain/metamask";

import IntlMessages from "util/IntlMessages";

import logger from "../../serverless/logger";
const logm = logger.info.child({ winstonModule: 'Settings' });
const { REACT_APP_DEBUG } = process.env;

const Settings = () => {

  const address = useSelector(({blockchain}) => blockchain.address);
  const publicKey = useSelector(({blockchain}) => blockchain.publicKey);
  const balance = useSelector(({blockchain}) => blockchain.balance);
  const virtuosoBalance = useSelector(({blockchain}) => blockchain.virtuosoBalance);
  const dispatch = useDispatch();


  const log = logm.child({ winstonComponent: 'Settings' });


  let vb = "$0";
  let showWithdaw = false;
  if( virtuosoBalance !== undefined)
  {
    const vb1 = virtuosoBalance/100;
    vb = ' $' + vb1.toString();
    if( vb1 > 100) showWithdaw = true;
  };

  let pb = " is not registered";
  if( publicKey !== undefined && publicKey !== "") pb = " is " + publicKey;


  async function register()
  {

            log.info("Register clicked", {address, wf: "register"});

            if( address !== undefined && address !== "")
            {
                 log.profile(`Registered public key of address ${address}`);
                 const key = 'RegisterPublicKey';
                 message.loading({content: `Please provide public key in Metamask and confirm transaction`, key, duration: 60});



                const result = await virtuosoRegisterPublicKey(address);
                if( result.publicKey !== "" && result.hash !== "")
                {
                    dispatch(updatePublicKey(result.publicKey));
                    message.success({content: `Public key ${result.publicKey} is written to blockchain with transaction ${result.hash}`, key, duration: 10});
                }
                else message.error({content: `Public key is not provided or written to blockchain`, key, duration: 10});
                log.profile(`Registered public key of address ${address}`, {address, result, wf: "register"});

            };
  }

  async function test()
  {
            //logger.meta.address = address;
            log.info("Test error clicked", {address, wf: "testerror"});
            try{
                throw new Error({message: "errortest"});
           } catch (error) {

             // return error
             log.error("catch", {error});
          }

  }


  async function connect()
  {

            log.info("Connect clicked", {address, wf: "connect"});
            const newAddress = await metamaskLogin();
            dispatch(updateAddress(newAddress));
  }

  return (
    <div>
      <h2 className="title gx-mb-4"><IntlMessages id="sidebar.settings"/></h2>

      {address===""?
      (
      <div className="gx-d-flex justify-content-center">
        <Button
        type="primary"
        onClick={connect}
        key="connect"
        >
        Connect with Metamask
        </Button>
      </div>
      )
      :
      (
      <div>
      <div className="gx-d-flex justify-content-center">
        <h4>Your Virtuoso balance: {vb}</h4>
      </div>
      {showWithdaw?(
       <div className="gx-d-flex justify-content-center">
        <Button
        type="primary"
        onClick={(e) => {window.location = accountingEmail; e.preventDefault();}}
        key = "withdraw"
        >
        Withdraw
        </Button>
      </div>):("")}
      {REACT_APP_DEBUG==="true"?(
      <div className="gx-d-flex justify-content-center">
        <Button
        type="primary"
        onClick={test}
        key = "testButton"
        >
        Test
        </Button>
      </div>):("")}
      <div className="gx-d-flex justify-content-center">
        <h4>Your Public Key {pb}</h4>
      </div>
      {(isChrome && isDesktop && (address!==""))?(
        <div className="gx-d-flex justify-content-center">
        <Button
        type="primary"
        onClick={register}
        key="register"
        >
        Register public key
        </Button>
      </div>):("")}

      </div>
      )}

    </div>
  );
};

export default Settings;
