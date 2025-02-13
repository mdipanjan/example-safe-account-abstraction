import { useEffect, useCallback, useState } from "react";
import { useMagic } from "../magic/MagicProvider";
import { providerToSmartAccountSigner } from "permissionless";
import Safe from "@safe-global/protocol-kit";
import { sepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

export const useSafeProvider = () => {
  const { magic, publicClient } = useMagic();
  const [smartClient, setSmartClient] = useState<Safe>();
  const saltNonce = Math.trunc(Math.random() * 10 ** 10).toString(); // Random 10-digit integer

  const connectToSmartContractAccount = useCallback(async () => {
    if (!magic || !publicClient) return;

    const pimlicoKey = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;
    const magicProvider = await magic.wallet.getProvider();
    const userInfo = await magic.user.getInfo();
    const smartAccountSigner = await providerToSmartAccountSigner(
      magicProvider
    );

    const protocolKit = await Safe.init({
      provider: magicProvider,
      signer: smartAccountSigner.publicKey,
      predictedSafe: {
        safeAccountConfig: {
          owners: [
            process.env.NEXT_PUBLIC_AGENT_ADDRESS as string,
            userInfo.publicAddress ?? "",
          ],
          threshold: 1,
        },
        safeDeploymentConfig: {
          saltNonce,
        },
      },
    });

    setSmartClient(protocolKit);
    console.log("protocolKit=======", protocolKit);
  }, [magic, publicClient]);

  const createSafe = useCallback(async () => {
    if (!smartClient) return;

    const safeAddress = await smartClient.getAddress();

    const deploymentTransaction =
      await smartClient.createSafeDeploymentTransaction();

    const safeClient = await smartClient.getSafeProvider().getExternalSigner();

    const transactionHash = await safeClient?.sendTransaction({
      to: deploymentTransaction.to,
      value: BigInt(deploymentTransaction.value),
      data: deploymentTransaction.data as `0x${string}`,
      chain: sepolia,
    });

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(),
    });
    console.log("transactionHash=======", transactionHash);

    await publicClient?.waitForTransactionReceipt({
      hash: transactionHash as `0x${string}`,
    });
    localStorage.setItem("safeAddress", safeAddress);
    console.log(
      `A new Safe multisig was successfully deployed on Sepolia. You can see it live at https://app.safe.global/home?safe=sep:${safeAddress}. The saltNonce used was ${saltNonce}.`
    );
  }, [smartClient]);

  const reInitSafe = useCallback(async () => {
    if (!smartClient) return;
    const safeAddress = localStorage.getItem("safeAddress");
    // console.log("safeAddress=======", safeAddress);
    // return;
    if (!safeAddress) return;

    const newProtocolKit = await smartClient.connect({
      safeAddress: safeAddress as string,
    });

    const isSafeDeployed = await newProtocolKit.isSafeDeployed(); // True
    const safeOwners = await newProtocolKit.getOwners();
    const safeThreshold = await newProtocolKit.getThreshold();

    console.log("safe info=======", {
      isSafeDeployed,
      safeOwners,
      safeThreshold,
    });
    return {
      isSafeDeployed,
      safeOwners,
      safeThreshold,
    };
  }, [smartClient]);

  useEffect(() => {
    if (magic?.user.isLoggedIn) {
      connectToSmartContractAccount();
    }
  }, [magic?.user.isLoggedIn, connectToSmartContractAccount]);

  return {
    smartClient,
    createSafe,
    reInitSafe,
  };
};
