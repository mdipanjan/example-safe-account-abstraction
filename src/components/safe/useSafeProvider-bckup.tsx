import { useEffect, useCallback, useState } from "react";
import { useMagic } from "../magic/MagicProvider";
import { providerToSmartAccountSigner } from "permissionless";
import { Safe4337Pack } from "@safe-global/relay-kit";

export const useSafeProvider = () => {
  const { magic, publicClient } = useMagic();
  const [smartClient, setSmartClient] = useState<Safe4337Pack>();

  const connectToSmartContractAccount = useCallback(async () => {
    if (!magic || !publicClient) return;

    const pimlicoKey = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;
    const magicProvider = await magic.wallet.getProvider();
    const userInfo = await magic.user.getInfo();
    const smartAccountSigner = await providerToSmartAccountSigner(
      magicProvider
    );

    const safe4337Pack = await Safe4337Pack.init({
      provider: magicProvider,
      signer: smartAccountSigner.publicKey,
      bundlerUrl: pimlicoKey,
      paymasterOptions: {
        isSponsored: true,
        paymasterUrl: pimlicoKey,
        paymasterAddress: "0x0000000000325602a77416A16136FDafd04b299f", // Sepolia paymaster address
        paymasterTokenAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // Sepolia token address
      },
      options: {
        owners: [
          userInfo.publicAddress ?? "",
          process.env.NEXT_PUBLIC_AGENT_PRIVATE_KEY as ??"",
        ],
        threshold: 1,
      },
    });

    setSmartClient(safe4337Pack);

    console.log("safe4337Pack=======", safe4337Pack);
  }, [magic, publicClient]);

  useEffect(() => {
    if (magic?.user.isLoggedIn) {
      connectToSmartContractAccount();
    }
  }, [magic?.user.isLoggedIn, connectToSmartContractAccount]);

  return {
    smartClient,
  };
};
