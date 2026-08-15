declare global {
  interface Window {
    translate?: {
      to?: string;
      execute: (documents?: Element[] | NodeListOf<Element>) => void;
      changeLanguage?: (language: string) => void;
      reset?: () => void;
      setDocuments?: (documents: Element[] | NodeListOf<Element>) => void;
      listener?: {
        start?: () => void;
      };
      language?: {
        setLocal?: (language: string) => void;
        getLocal?: () => string;
        getCurrent?: () => string;
        translateLocal?: boolean;
      };
      service?: {
        use?: (service: string) => void;
      };
      selectLanguageTag?: {
        show?: boolean;
      };
      storage?: {
        set: (key: string, value: unknown) => void;
        get?: (key: string) => unknown;
      };
      node?: {
        data?: Map<unknown, unknown>;
      };
    };
  }
}

export {};
