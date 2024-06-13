import { Divider } from "@interchain-ui/react";
import { Layout, Wallet } from "@/components";
import {
  LCDClient,
  MnemonicKey,
  MsgExecuteContract,
  MsgSend
} from '@terra-money/terra.js';
import { useCallback, useEffect, useMemo, useState } from "react";

const custody_contract = 'terra10cxuzggyvvv44magvrh3thpdnk9cmlgk93gmx2';
const overseer = 'terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8';
const WrappedBETH = 'terra1dzhzukyezv0etz22ud940z7adyv7xgcjkahuun';
const bETH = 'terra1u5szg038ur9kzuular3cae8hq6q5rk5u27tuvz';
const bETHConverter = 'terra1emvfel8x7wmvkwjfq3jpa6sq4nsfjjqjm7ucnl';

export default function Home() {

  const [mnemonic, setMnemonic] = useState("");
  const [balance, setBalance] = useState("0");

  // Function to handle input change
  const handleInputChange = (event: any) => {
    setMnemonic(event.target.value);
  };

  const addr = useMemo(() => {

    const mk = new MnemonicKey({
      mnemonic,
    });
    return mk.accAddress
  }, [mnemonic])

  useEffect(() => {

    let func = async () => {

      const mk = new MnemonicKey({
        mnemonic,
      });

      let client = new LCDClient({
        URL: 'https://terra-classic-lcd.publicnode.com',
        chainID: 'columbus-5',
        isClassic: false
      });
      const amount: any = await client.wasm.contractQuery(custody_contract, {
        borrower: {
          address: mk.accAddress
        }
      });
      setBalance(amount.balance)
    }
    func()

  }, [mnemonic]);



  const onClick = useCallback(async () => {

    const mk = new MnemonicKey({
      mnemonic,
    });


    let client = new LCDClient({
      URL: 'https://terra-classic-lcd.publicnode.com',
      chainID: 'columbus-5',
      isClassic: false
    });
    const accountInfo = await client.auth.accountInfo(mk.accAddress);

    // Query the spendable amount

    const amount: any = await client.wasm.contractQuery(custody_contract, {
      borrower: {
        address: mk.accAddress
      }
    });
    const amountToWithdraw = amount.balance;
    const amountBETH = parseInt(amount.balance) * 100;

    const decimals = await client.wasm.contractQuery(bETH, {
      token_info: {}
    });

    console.log(amount, decimals);

    const unlock_msg = new MsgExecuteContract(
      mk.accAddress, // sender
      overseer, // contract address
      {
        unlock_collateral: {
          collaterals: [[WrappedBETH, amountToWithdraw]]
        }
      } // handle msg,
    );

    const withdraw_msg = new MsgExecuteContract(
      mk.accAddress, // sender
      custody_contract, // contract address
      {
        withdraw_collateral: {
          amount: amountToWithdraw
        }
      } // handle msg,
    );

    const convert_msg = new MsgExecuteContract(
      mk.accAddress, // sender
      WrappedBETH, // contract address
      {
        send: {
          amount: amountToWithdraw,
          msg: btoa(
            JSON.stringify({
              convert_anchor_to_wormhole: {}
            })
          ),
          contract: bETHConverter
        }
      } // handle msg,
    );

    let create_options = {
      msgs: [unlock_msg, withdraw_msg, convert_msg],
      memo: '',
      gasPrices: '29uluna',
      gasAdjustment: 1.75
    };
    let wallet = client.wallet(mk);

    let tx = await wallet.createAndSignTx(create_options);
    let result = await client.tx.broadcast(tx);
    console.log(result)
  }, [mnemonic]);

  return (
    <Layout>
      <Wallet />
      <input type="text"
        value={mnemonic}
        onChange={handleInputChange} />
      <button onClick={onClick} >Click here to free you bETH</button>
      Current balance to free : {balance} bETH
      <br />
      Current address associated : {addr}

      <Divider mb="$16" />
    </Layout >
  );
}
