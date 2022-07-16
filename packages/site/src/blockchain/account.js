import React, { useEffect, useCallback } from "react";
import {isMobile} from 'react-device-detect';
import {useDispatch, useSelector} from "react-redux";
import {message} from 'antd';
import {updateAddress, updateVirtuosoBalance, updatePublicKey} from "../appRedux/actions";
import { metamaskLogin,
         initAccount,
         getVirtuosoBalance,
         getVirtuosoPublicKey,
         convertAddress,
         getAddress,
         initVirtuoso  } from "./metamask";

const {URL, REACT_APP_NETWORK_EXPLORER, REACT_APP_NETWORK_HEXCHAIN_ID, REACT_APP_NETWORK_NAME } = process.env;
const DEBUG = ("true"===process.env.REACT_APP_DEBUG);



const MetaMaskAccount = () => {


  const address = useSelector(({blockchain}) => blockchain.address);
  const virtuosoBalance  = useSelector(({blockchain}) => blockchain.virtuosoBalance);
  const dispatch = useDispatch();

  let metamaskText = "CONNECT WITH METAMASK";
  let topupText = "";
  let topup = "";
  let blockExplorer = "";



const handleEvents = useCallback( async (params) => {
  if(DEBUG) console.log("handleEvents ", params);

  switch( params.event )
  {
        case 'Balance':
            const adr = convertAddress(params.args[0]);
            const myaddress = await getAddress();
            if(DEBUG) console.log("handleEvents Balance ", adr, myaddress);
           if( adr === myaddress)
           {
               const newVirtuosoBalance = await getVirtuosoBalance(myaddress);
               const vb100 = newVirtuosoBalance/100;
               const vb = "$" + vb100.toFixed(2);
               if(DEBUG) console.log(`handleEvents: my balance ${virtuosoBalance} changed by ${params.args[1]} to ${newVirtuosoBalance} for ${params.args[2]}`);

               dispatch(updateVirtuosoBalance(newVirtuosoBalance));
               message.info(`Your virtuoso balance changed to ${vb} for ${params.args[2]}`, 10);

           };
           break;
        case "OnMint":
          break;
        case "OnSale":
          break;
        case "Transfer":
          break;
        default:
            if(DEBUG) console.log("handleEvents unexpected event", params);

  };


}, []);

const handleChainChanged = useCallback( async (_chainId) => {
  if(DEBUG) console.log("handleChainChanged ", _chainId );
  if( _chainId !== REACT_APP_NETWORK_HEXCHAIN_ID)
  {
      dispatch(updateAddress(""));
      if(DEBUG) console.log("handleChainChanged wrong chain", _chainId, "needs to be", REACT_APP_NETWORK_HEXCHAIN_ID );
      message.info(`You're on the wrong chain ${_chainId}, needs to be on ${REACT_APP_NETWORK_NAME} ${REACT_APP_NETWORK_HEXCHAIN_ID}`, 10);
  }
  else
  {
      await initVirtuoso(handleEvents);
      if(DEBUG) console.log("handleChainChanged getAddress");
      const newAddress = await getAddress();
      const newAddress1 = convertAddress(newAddress);

      if(DEBUG) console.log("handleChainChanged getVirtuosoBalance");
      const newVirtuosoBalance = await getVirtuosoBalance(newAddress);
      const newPublicKey = await getVirtuosoPublicKey(newAddress);
      dispatch(updateAddress(newAddress1));
      dispatch(updateVirtuosoBalance(newVirtuosoBalance));
      dispatch(updatePublicKey(newPublicKey));
      message.info(`You've switched to the right chain ${REACT_APP_NETWORK_NAME} ${_chainId} with address ${newAddress1}`, 10);


  };
  // We recommend reloading the page, unless you must do otherwise

}, []);

const handleAccountsChanged = useCallback( async (accounts) => {
  if (accounts.length === 0) {
    // MetaMask is locked or the user has not connected any accounts
    console.log('handleAccountsChanged: Please connect to MetaMask.');
    dispatch(updateAddress(""));
  } else
  {
    const newAddress = convertAddress(accounts[0]);
    if ( newAddress!== address)
    {
         if( isMobile ) window.location.reload(true);

         dispatch(updateAddress(newAddress));
         const newVirtuosoBalance = await getVirtuosoBalance(newAddress);
         const newPublicKey = await getVirtuosoPublicKey(newAddress);
         dispatch(updateVirtuosoBalance(newVirtuosoBalance));
         dispatch(updatePublicKey(newPublicKey));
         if(DEBUG) console.log('handleAccountsChanged: new address and balance', address, newAddress, newVirtuosoBalance);
         message.info(`Account changed to ${newAddress}`, 10);
    }
    // Do any other work!
  }
}, []);

  useEffect(() => {
    async function fetchAddress() {
              const newAddress = await initAccount(handleEvents, handleChainChanged, handleAccountsChanged );
              dispatch(updateAddress(newAddress));
              const newVirtuosoBalance = await getVirtuosoBalance(newAddress);
              const newPublicKey = await getVirtuosoPublicKey(newAddress);
              dispatch(updateVirtuosoBalance(newVirtuosoBalance));
              dispatch(updatePublicKey(newPublicKey));
              if(DEBUG) console.log(`useEffect Address ${newAddress} virtuosoBalance ${newVirtuosoBalance} publicKey ${newPublicKey}`);
    }
  fetchAddress()
  },[dispatch, handleAccountsChanged, handleChainChanged, handleEvents])


  if(DEBUG) console.log(`Address ${address} ${virtuosoBalance/100}`);

  let result = (
            <ul className="gx-login-list">
              <li
               onClick={ async () => {
                    if(DEBUG) console.log("Connect to MetaMask clicked");
                    const newAddress = await metamaskLogin();
                    dispatch(updateAddress(newAddress));
                }}
              >
              {metamaskText}
              </li>
              </ul>
  );

  if((address !== undefined) && (address !== ""))
  {
    metamaskText = address.slice(0,6)+"..."+address.slice(38,42);
    if( virtuosoBalance !== undefined)
    {
      const vb = virtuosoBalance/100;
      topupText = "$" + vb.toFixed(2);
      //topup = "/api/create-checkout-session?type=mint&address=" + address.toString();
    };
    blockExplorer = REACT_APP_NETWORK_EXPLORER + "address/" + address;
    result =
    (
            <ul className="gx-login-list" >
              <li
               onClick={ async () => {
                    window.open(blockExplorer);
                }}
              >
              {metamaskText}
              </li>
              <li>
              {topupText}
              </li>
            </ul>

    );
   };
    return result;
};

export default MetaMaskAccount;
