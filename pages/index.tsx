import { Divider } from "@interchain-ui/react";
import { Layout, Wallet } from "@/components";
import { useChain, useChainWallet, useWallet } from "@cosmos-kit/react";
import { MsgExecuteContract, MsgStoreCode } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { toUtf8 } from "@cosmjs/encoding";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";


const custody_contract = 'terra10cxuzggyvvv44magvrh3thpdnk9cmlgk93gmx2';
const overseer = 'terra1tmnqgvg567ypvsvk6rwsga3srp7e3lg6u0elp8';
const WrappedBETH = 'terra1dzhzukyezv0etz22ud940z7adyv7xgcjkahuun';
const bETH = 'terra1u5szg038ur9kzuular3cae8hq6q5rk5u27tuvz';
const bETHConverter = 'terra1emvfel8x7wmvkwjfq3jpa6sq4nsfjjqjm7ucnl';

const amountToWithdraw = "3128741";

export default function Home() {




  const wallet = useWallet();
  const cosmosKit = useChain("terra");




  const onClick = async () => {
    const voteMessages = [];

    const unlock_msg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: cosmosKit.address,
        contract: overseer,
        msg: toUtf8(JSON.stringify({
          unlock_collateral: {
            collaterals: [[WrappedBETH, amountToWithdraw]]
          }
        })),
      })
    };

    const withdraw_msg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: cosmosKit.address,
        contract: custody_contract,
        msg: toUtf8(JSON.stringify({
          withdraw_collateral: {
            amount: amountToWithdraw
          }
        })),
      })
    };

    const convert_msg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: cosmosKit.address,
        contract: WrappedBETH,
        msg: toUtf8(JSON.stringify({
          send: {
            amount: amountToWithdraw,
            msg: toUtf8(
              JSON.stringify({
                convert_anchor_to_wormhole: {}
              })
            ),
            contract: bETHConverter
          }
        })),
      })
    };

    let client = await cosmosKit.getCosmWasmClient();
    const res = await cosmosKit.signAndBroadcast([unlock_msg, withdraw_msg, convert_msg], {
      gas: "2738993",
      amount: [{
        denom: "uluna",
        amount: "79430797"
      }]
    }, undefined, "cosmwasm");

    if (res) {
      alert("Voted successfully!");
    }
  };

  return (
    <Layout>
      <Wallet />
      <Divider mb="$16" />
      <a onClick={onClick} >Click here to free you bETH</a>
    </Layout >
  );
}
