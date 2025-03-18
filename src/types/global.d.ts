declare global {
    interface Window {
      gc: {
        encode: {
          url: (options: {
            input: string;
            apiVersion: string;
            network: string;
            encoding: string;
          }) => Promise<string>;
          qr: (options: {
            input: string;
            apiVersion: string;
            network: string;
            encoding: string;
            qrResultType: string;
          }) => string;
        };
        encodings: {
          msg: {
            decoder: (resultRaw: string) => Promise<{
              exports?: {
                connect?: any;
                [key: string]: any;
              };
              error?: {
                message: string;
                [key: string]: any;
              };
            }>;
          };
        };
      };
      QRCode: {
        new(
          element: HTMLElement,
          options: {
            text: string;
            width?: number;
            height?: number;
            colorDark?: string;
            colorLight?: string;
            correctLevel?: number;
          }
        ): unknown;
        CorrectLevel: {
          L: number;
          M: number;
          Q: number;
          H: number;
        };
      };
    }
  }
  
  export {};