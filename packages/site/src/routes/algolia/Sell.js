import React, {useState, useEffect} from "react";
import {Button, Card, Modal, Form, InputNumber, Input, Radio, Checkbox} from "antd";
import {isMobile, isDesktop, isChrome} from 'react-device-detect';
import sell from "../../serverless/sell"
import {footerAgreement, footerAgreementLink } from "../../util/config";

const DEBUG = ("true"===process.env.REACT_APP_DEBUG);

const SellButton = ({item, address}) => {
//class SellButton extends React.Component {

  const [modalText, setModalText] = useState('Please specify the price of the NFT token');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("Sell NFT token " + item.vrtTokenId);
  const [price, setPrice] = useState(100);
  const [currency, setCurrency] = useState('usd');
  const [sendEmail, setSendEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [okDisabled, setOkDisabled] = useState(true);

/*  state = {
    ModalText: 'Sell text',
    visible: false,
    confirmLoading: false,
    title: "Sell NFT token " + this.props.item.vrtTokenId,
    price: 0,
    currency: 'usd',
    comment: "",
    email: "",
    agreementAccepted: false,
    sendEmail: false,
    okDisabled: true
  };
*/
  const showModal = () => {

      setVisible(true);
      setModalText('Please specify the price of the NFT token');
      setLoading(false);

  };

      useEffect(() => {
            async function checkOkButton() {

                const newOkDisabled = (Number(price)>= 5 && accepted===true)? false : true;
                if( newOkDisabled !== okDisabled) setOkDisabled(newOkDisabled);
                //if( DEBUG) console.log("Sell okDisabled: ", newOkDisabled, price, accepted);

        }
      checkOkButton()
      },[price, accepted]);


  const handleOk = async () => {

      setModalText('Preparing sale information...');
      setLoading( true );

    if(DEBUG) console.log("Sell token", item.tokenId.toString());

    const sellData =
    {
        tokenId: item.tokenId,
        price: price,
        currency: currency,
        comment: comment,
        item: item,
        email: email,
        address: address
    };

    const operatorData = await sell.operator(sellData);
    if(DEBUG) console.log("Sell 2", operatorData);

    setModalText('Writing sale information to IPFS...');

    const ipfsHash = await sell.ipfs(operatorData.sale);

    let unlockableIPFSHash = "";
    if( item.uri.contains_unlockable_content === true)
    {
          setModalText( 'Writing unlockable information to IPFS...');
          if(DEBUG) console.log("unlockableIPFSHash start");
          unlockableIPFSHash = await sell.unlockable(sellData, operatorData, address);
    };
    if(DEBUG) console.log("unlockableIPFSHash", unlockableIPFSHash);
    setModalText( 'Writing sale information to blockchain..');

    const txresult = await sell.blockchain(
            sellData.tokenId,
            ipfsHash,
            operatorData.sale.operator,
            unlockableIPFSHash,
            address );
    if(DEBUG) console.log("Sell txresult", txresult);
    setVisible(false);
  };

  const handleCancel = () => {
      setVisible(false);
  };

  const handleChange = (values) => {
  if(DEBUG) console.log("Sell values changed", values);
      if( values.price !== undefined) setPrice(values.price);
      if( values.comment !== undefined) setComment(values.comment);
      if( values.currency !== undefined) setCurrency( values.currency );
      if( values.accepted !== undefined) setAccepted( values.accepted);
      if( values.email !== undefined) setEmail( values.email);
      if( values.sendEmail!== undefined) setSendEmail( values.sendEmail);
  };


    return (
        <span>
        {( (isChrome===true && isDesktop===true && address !== "") ||
           (item.uri.contains_unlockable_content === false && address !== "") )?(
        <Button type="primary"
            onClick={showModal}
          >
          Sell
          </Button>):("")}
        <Modal title={title}
               visible={visible}
               onOk={handleOk}
               confirmLoading={loading}
               onCancel={handleCancel}
               footer={null}
        >
          <p>{modalText}</p>
        <Form
        onValuesChange = {handleChange}
        layout="vertical"
        name="form_in_modal"
        initialValues={{
          currency: "usd",
          comment: "",
          price: 100,
          sendEmail:false,
          email:"",
          accepted:false
        }}
      >
        <Form.Item
          name="price"
          label="Price"
          rules={[
            {
              validator: (_, value) =>
              ((value > 10 && currency!=="rub") || value > 700) ? Promise.resolve() : Promise.reject(new Error(`Price should be higher than ${currency==='rub'?'700 RUB':'10 '+currency.toUpperCase()}`)),
            },

            {
              required: true,
              message: 'Please input the the price of NFT token!',
            },
          ]}
        >
          <InputNumber
            min={10}
          />
        </Form.Item>
        <Form.Item
            name="commission"
            >
        NFT Virtuoso commission on this sale is 30%
        </Form.Item>

        <Form.Item
            name="sendEmail"
            valuePropName="checked"
            >
        <Checkbox>Notify me by e-mail when NFT token will be sold</Checkbox>
        </Form.Item>

        <Form.Item
            name="email"
            label="E-mail"
            hidden={!sendEmail}
            rules={[
          {
            type: 'email',
            message: 'The input is not valid E-mail',
          }
        ]}
            >
          <Input type="textarea"  />
        </Form.Item>
        {/*}
        <Form.Item name="comment" label="Comment">
          <Input type="textarea" />
        </Form.Item>
        */}
        <Form.Item name="currency" >
          <Radio.Group>
            <Radio value="usd"  >USD</Radio>
            <Radio value="eur"  >EUR</Radio>
            <Radio value="chf"  >CHF</Radio>
            <Radio value="rub"  >RUB</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item
            name="accepted"
            valuePropName="checked"
            rules={[
          {
            validator: (_, value) =>
              value ? Promise.resolve() : Promise.reject(new Error('You should accept agreement')),
          },
        ]}
            >
        <Checkbox>I accept <a href={footerAgreementLink} target="_blank">NFT Virtuoso {footerAgreement}</a></Checkbox>
        </Form.Item>
        <Form.Item
            name="sell"
            className="currency-sell-form_last-form-item"
            >

            <Button
                 type="primary"
                 onClick={handleOk}
                 disabled={okDisabled}
                 loading={loading}
            >
            Sell
            </Button>
          </Form.Item>

      </Form>

        </Modal>
       </span>
    );
};

export default SellButton;
