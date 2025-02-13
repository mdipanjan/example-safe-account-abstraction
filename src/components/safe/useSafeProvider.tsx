import { useEffect, useCallback, useState } from "react";
import { useMagic } from "../magic/MagicProvider";
import { providerToSmartAccountSigner } from "permissionless";
import { Safe4337Pack } from "@safe-global/relay-kit";
import Safe from "@safe-global/protocol-kit";

export const useSafeProvider = () => {
  const { magic, publicClient } = useMagic();
  const [smartClient, setSmartClient] = useState<Safe>();

  const connectToSmartContractAccount = useCallback(async () => {
    if (!magic || !publicClient) return;

    const pimlicoKey = `https://api.pimlico.io/v2/sepolia/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`;
    const magicProvider = await magic.wallet.getProvider();
    const userInfo = await magic.user.getInfo();
    const smartAccountSigner = await providerToSmartAccountSigner(
      magicProvider
    );

    const saltNonce = Math.trunc(Math.random() * 10 ** 10).toString(); // Random 10-digit integer
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

  useEffect(() => {
    if (magic?.user.isLoggedIn) {
      connectToSmartContractAccount();
    }
  }, [magic?.user.isLoggedIn, connectToSmartContractAccount]);

  return {
    smartClient,
  };
};
