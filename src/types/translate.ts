declare global {
  interface Window {
    translate?: {
      execute: (documents?: Element[] | NodeListOf<Element>) => void;
      changeLanguage?: (language: string) => void;
      reset?: () => void;
      setDocuments?: (documents: Element[] | NodeListOf<Element>) => void;
      listener?: {
        start?: () => void;
      };
      language?: {
        setLocal?: (language: string) => void;
        getCurrent?: () => string;
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
      to?: string;
    };
  }
}

export {};