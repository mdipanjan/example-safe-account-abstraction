/* eslint-disable quotes */
import { COW_ADDRESS, INPUT_AMOUNT, WETH_ADDRESS } from "@/constant";
import {
  SwapAdvancedSettings,
  TradeParameters,
  TradingSdk,
  SupportedChainId,
  OrderKind,
  SigningScheme,
} from "@cowprotocol/cow-sdk";
import { VoidSigner } from "@ethersproject/abstract-signer";
import { JsonRpcProvider } from "@ethersproject/providers";
import Safe from "@safe-global/protocol-kit";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import { defineChain, http, createPublicClient } from "viem";
import { sepolia } from "viem/chains";

// Load environment variables from .env file

export const useCowSwap = () => {
  const initSwap = async () => {
    try {
      const SAFE_ADDRESS = localStorage.getItem("safeAddress");
      const SIGNER_PRIVATE_KEY = process.env.NEXT_PUBLIC_AGENT_PRIVATE_KEY;
      const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

      // Check if all required environment variables are present
      if (!SAFE_ADDRESS || !SIGNER_PRIVATE_KEY || !RPC_URL) {
        throw new Error("Missing environment variables in .env file");
      }

      const protocolKit = await Safe.init({
        provider: RPC_URL,
        signer: SIGNER_PRIVATE_KEY,
        safeAddress: SAFE_ADDRESS,
      });

      const smartContractWalletAddress = SAFE_ADDRESS;

      const traderParams = {
        chainId: SupportedChainId.SEPOLIA,
        signer: new VoidSigner(
          smartContractWalletAddress,
          new JsonRpcProvider("https://sepolia.gateway.tenderly.co")
        ),
        appCode: "awesome-app",
      };

      const sdk = new TradingSdk(traderParams);
      console.log(
        "sdk ======================COW SWAP====================",
        sdk
      );
      const parameters: TradeParameters = {
        kind: OrderKind.SELL,
        sellToken: WETH_ADDRESS,
        sellTokenDecimals: 18,
        buyToken: COW_ADDRESS,
        buyTokenDecimals: 18,
        amount: INPUT_AMOUNT,
      };

      const advancedParameters: SwapAdvancedSettings = {
        quoteRequest: {
          // Specify the signing scheme
          signingScheme: SigningScheme.PRESIGN,
        },
      };

      const orderId = await sdk.postSwapOrder(parameters, advancedParameters);

      console.log(`Order ID: [${orderId}]`);

      const preSignTransaction = await sdk.getPreSignTransaction({
        orderId,
        account: smartContractWalletAddress,
      });
      console.log(
        "preSignTransaction ======================COW SWAP====================",
        preSignTransaction
      );

      const customChain = defineChain({
        ...sepolia,
        name: "custom chain",
        transport: http(RPC_URL),
      });

      const publicClient = createPublicClient({
        chain: customChain,
        transport: http(RPC_URL),
      });

      const safePreSignTx: MetaTransactionData = {
        to: preSignTransaction.to,
        value: preSignTransaction.value,
        data: preSignTransaction.data,
        operation: OperationType.Call,
      };
      console.log(
        "safePreSignTx ======================COW SWAP====================",
        safePreSignTx
      );

      const safeTx = await protocolKit.createTransaction({
        transactions: [safePreSignTx],
        onlyCalls: true,
      });
      console.log(
        "safeTx ======================COW SWAP====================",
        safeTx
      );
      const txResponse = await protocolKit.executeTransaction(safeTx);
      console.log(`Sent tx hash: [${txResponse.hash}]`);
      console.log("Waiting for the tx to be mined");
      await publicClient.waitForTransactionReceipt({
        hash: txResponse.hash as `0x${string}`,
      });
      console.log(
        "txResponse ======================COW SWAP====================",
        txResponse
      );
    } catch (error) {
      console.error(error);
    }
  };

  return {
    initSwap,
  };
};
