/* eslint-disable quotes */
import { useCallback, useEffect, useMemo, useState } from "react";
import Divider from "@/components/ui/Divider";
import { LoginProps } from "@/utils/types";
import { logout } from "@/utils/common";
import { useMagic } from "../MagicProvider";
import Card from "@/components/ui/Card";
import CardHeader from "@/components/ui/CardHeader";
import CardLabel from "@/components/ui/CardLabel";
import Spinner from "@/components/ui/Spinner";
import { getNetworkName, getNetworkToken } from "@/utils/network";
import { useSafeProvider } from "@/components/safe/useSafeProvider";
import { formatEther } from "viem";
import { useCowSwap } from "@/components/cowSwap/useCowSwap";
const UserInfo = ({ token, setToken }: LoginProps) => {
  const { magic, web3, publicClient } = useMagic();
  const { smartClient, createSafe, reInitSafe, newProtocolKit } =
    useSafeProvider();
  const { initSwap } = useCowSwap();
  const [copied, setCopied] = useState("Copy");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [magicBalance, setMagicBalance] = useState<string>("...");
  const [safeBalance, setSafeBalance] = useState<string>("...");
  const [safeAddress, setSafeAddress] = useState<string | undefined>("");
  const [magicAddress] = useState(localStorage.getItem("user"));

  const getBalance = useCallback(async () => {
    if (magicAddress && publicClient) {
      const magicBalance = await publicClient?.getBalance({
        address: magicAddress as `0x${string}`,
      });
      if (magicBalance == BigInt(0)) {
        setMagicBalance("0");
      } else {
        setMagicBalance(formatEther(magicBalance));
      }
    }
    if (safeAddress && smartClient) {
      const safeAddress = localStorage.getItem("safeAddress");
      // console.log("safeAddress=======", safeAddress);
      // return;
      if (!safeAddress) return;

      const newProtocolKit = await smartClient.connect({
        safeAddress: safeAddress as string,
      });

      const safeBalance = await newProtocolKit.getBalance();
      if (safeBalance == BigInt(0)) {
        setSafeBalance("0");
      } else {
        setSafeBalance(formatEther(safeBalance));
      }
    }
  }, [safeAddress, magicAddress, publicClient]);

  const getSmartContractAccount = useCallback(async () => {
    if (smartClient) {
      const safeAddress = localStorage.getItem("safeAddress");
      // console.log("safeAddress=======", safeAddress);
      // return;
      if (!safeAddress) return;

      const newProtocolKit = await smartClient.connect({
        safeAddress: safeAddress as string,
      });
      const connectedSafeAccount = await newProtocolKit.getAddress();

      setSafeAddress(connectedSafeAccount);
    }
  }, [smartClient]);

  useEffect(() => {
    getSmartContractAccount();
  }, [getSmartContractAccount]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await getBalance();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, [getBalance]);

  useEffect(() => {
    if (web3) {
      refresh();
    }
  }, [web3, refresh]);

  useEffect(() => {
    setMagicBalance("...");
    setSafeBalance("...");
  }, [magic]);

  const disconnect = useCallback(async () => {
    if (magic) {
      await logout(setToken, magic);
    }
  }, [magic, setToken]);

  const copy = useCallback(() => {
    if (magicAddress && copied === "Copy") {
      setCopied("Copied!");
      navigator.clipboard.writeText(magicAddress);
      setTimeout(() => {
        setCopied("Copy");
      }, 1000);
    }
  }, [copied, magicAddress]);

  return (
    <Card>
      <CardHeader id="Wallet">Wallet</CardHeader>
      <CardLabel
        leftHeader="Status"
        rightAction={<div onClick={disconnect}>Disconnect</div>}
        isDisconnect
      />
      <div className="flex-row">
        <div className="green-dot" />
        <div className="connected">Connected to {getNetworkName()}</div>
      </div>
      <div>
        <button
          className="bg-blue-500 text-white p-2 rounded-md"
          onClick={() => {
            createSafe();
          }}
        >
          Create Safe
        </button>
      </div>

      <div className="mt-2">
        <button
          className="bg-green-500 text-white p-2 rounded-md"
          onClick={() => {
            reInitSafe();
          }}
        >
          Check Safe
        </button>
      </div>
      <div className="mt-2">
        <button
          className="bg-red-500 text-white p-2 rounded-md"
          onClick={() => {
            initSwap();
          }}
        >
          Init Swap on CowSwap
        </button>
      </div>
      <Divider />
      <CardLabel
        leftHeader="Addresses"
        rightAction={
          !magicAddress ? <Spinner /> : <div onClick={copy}>{copied}</div>
        }
      />
      <div className="flex flex-col gap-2">
        <div className="code">
          Magic Wallet:{" "}
          {magicAddress?.length == 0 ? "Fetching address.." : magicAddress}
        </div>
        <div className="code">
          Safe Smart Account:{" "}
          {safeAddress?.length == 0 ? "Fetching address.." : safeAddress}
        </div>
      </div>
      <Divider />
      <CardLabel
        leftHeader="Balance"
        rightAction={
          isRefreshing ? (
            <div className="loading-container">
              <Spinner />
            </div>
          ) : (
            <div onClick={refresh}>Refresh</div>
          )
        }
      />
      <div className="flex flex-col gap-2">
        <div className="code">
          Magic Balance: {magicBalance.substring(0, 7)} {getNetworkToken()}
        </div>
        <div className="code">
          Safe Smart Account Balance: {safeBalance.substring(0, 7)}{" "}
          {getNetworkToken()}
        </div>
      </div>
    </Card>
  );
};

export default UserInfo;
