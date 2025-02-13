import React, { useCallback, useEffect, useState } from "react";
import Divider from "@/components/ui/Divider";
import FormButton from "@/components/ui/FormButton";
import FormInput from "@/components/ui/FormInput";
import ErrorText from "@/components/ui/ErrorText";
import Card from "@/components/ui/Card";
import CardHeader from "@/components/ui/CardHeader";
import { getFaucetUrl, getNetworkToken } from "@/utils/network";
import Image from "next/image";
import Link from "public/link.svg";
import { useSafeProvider } from "@/components/safe/useSafeProvider";
import { isAddress, parseEther } from "viem";
import showToast from "@/utils/showToast";

const SendSafeTransaction = () => {
  const { smartClient } = useSafeProvider();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [disabled, setDisabled] = useState(!toAddress || !amount);
  const [hash, setHash] = useState<any>("");
  const [toAddressError, setToAddressError] = useState(false);
  const [amountError, setAmountError] = useState(false);

  useEffect(() => {
    setDisabled(!toAddress || !amount);
    setAmountError(false);
    setToAddressError(false);
  }, [amount, toAddress]);

  const sendTransaction = useCallback(async () => {
    if (!smartClient) return;

    if (!isAddress(toAddress)) {
      return setToAddressError(true);
    }
    if (isNaN(Number(amount))) {
      return setAmountError(true);
    }
    setDisabled(true);

    const transaction = {
      to: toAddress,
      value: parseEther(amount).toString(),
      data: "0x",
    };

    const transactions = [transaction];

    const safeOperation = await smartClient.createTransaction({ transactions });
    // const signedSafeOperation = await smartClient.signSafeOperation(safeOperation);
    // const userOperationHash = await smartClient.executeTransaction({
    //   executable: signedSafeOperation
    // });

    let userOperationReceipt = null;

    // while (!userOperationReceipt) {
    //   await new Promise((resolve) => setTimeout(resolve, 2000));
    //   userOperationReceipt = await smartClient.getUserOperationReceipt(userOperationHash);
    // }

    console.log("Transaction successful:", userOperationReceipt);
    if (userOperationReceipt) {
      setToAddress("");
      setAmount("");
      console.log("Transaction hash:", userOperationReceipt);
      showToast({
        message: "Transaction Successful.",
        type: "success",
      });
      setHash(userOperationReceipt);
      console.log("UserOp Transaction receipt:", userOperationReceipt);
    }
    setDisabled(false);
  }, [smartClient, amount, toAddress]);

  return (
    <Card>
      <CardHeader id="send-transaction">Send Safe Transaction</CardHeader>
      {getFaucetUrl() && (
        <div>
          <a href={getFaucetUrl()} target="_blank" rel="noreferrer">
            <FormButton onClick={() => null} disabled={false}>
              Get Test {getNetworkToken()}
              <Image src={Link} alt="link-icon" className="ml-[3px]" />
            </FormButton>
          </a>
          <Divider />
        </div>
      )}
      <FormInput
        value={toAddress}
        onChange={(e: any) => setToAddress(e.target.value)}
        placeholder="Receiving Address"
      />
      {toAddressError ? <ErrorText>Invalid address</ErrorText> : null}
      <FormInput
        value={amount}
        onChange={(e: any) => setAmount(e.target.value)}
        placeholder={`Amount (${getNetworkToken()})`}
      />
      {amountError ? (
        <ErrorText className="error">Invalid amount</ErrorText>
      ) : null}
      <FormButton
        onClick={sendTransaction}
        disabled={!toAddress || !amount || disabled}
      >
        Send Transaction
      </FormButton>
    </Card>
  );
};

export default SendSafeTransaction;
