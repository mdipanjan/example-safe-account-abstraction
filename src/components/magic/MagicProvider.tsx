import { getChainId, getNetworkUrl } from "@/utils/network";
import { OAuthExtension } from "@magic-ext/oauth";
import { Magic as MagicBase } from "magic-sdk";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
const { Web3 } = require("web3");
import { createPublicClient, http, PublicClient } from "viem";
import { sepolia } from "viem/chains";

export type Magic = MagicBase<OAuthExtension[]>;

type MagicContextType = {
  magic: Magic | null;
  web3: typeof Web3 | null;
  publicClient: PublicClient | null;
};

const MagicContext = createContext<MagicContextType>({
  magic: null,
  web3: null,
  publicClient: null,
});

export const useMagic = () => useContext(MagicContext);

const MagicProvider = ({ children }: { children: ReactNode }) => {
  const [magic, setMagic] = useState<Magic | null>(null);
  const [web3, setWeb3] = useState<typeof Web3 | null>(null);
  const [publicClient, setPublicClient] = useState<PublicClient | null>(null);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MAGIC_API_KEY) {
      const magic = new MagicBase(
        process.env.NEXT_PUBLIC_MAGIC_API_KEY as string,
        {
          network: {
            rpcUrl: getNetworkUrl(),
            chainId: getChainId(),
          },
          extensions: [new OAuthExtension()],
        }
      );

      setMagic(magic);
      setWeb3(new Web3((magic as any).rpcProvider));
      const publicClient = createPublicClient({
        transport: http(getNetworkUrl()),
        chain: sepolia,
      });
      setPublicClient(publicClient);
    }
  }, []);

  const value = useMemo(() => {
    return {
      magic,
      web3,
      publicClient,
    };
  }, [magic, web3, publicClient]);

  return (
    <MagicContext.Provider value={value}>{children}</MagicContext.Provider>
  );
};

export default MagicProvider;
