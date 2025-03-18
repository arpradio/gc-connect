declare namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_LOGO_SRC: string;
      NEXT_PUBLIC_COMPANY_NAME: string;
      BLOCKFROST_API_KEY?: string;
      CARDANO_NETWORK?: 'mainnet' | 'preprod' | 'preview';
      PINATA_API_KEY?: string;
      PINATA_API_SECRET?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
    }
  }