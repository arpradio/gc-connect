declare namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_COMPANY_NAME: string;
      NEXT_PUBLIC_LOGO_SRC: string;
      BLOCKFROST_API_KEY?: string;
      CARDANO_NETWORK?: 'mainnet' | 'preprod';
      PINATA_API_KEY?: string;
      PINATA_API_SECRET?: string;
    }
  }