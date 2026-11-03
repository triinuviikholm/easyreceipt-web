// JSON shapes returned by the API. Money is always a decimal string such as "12.49".

export type PaymentMethod = "CARD" | "CASH";

export type CategoryDTO = {
  id: string;
  name: string;
  color: string;
  receiptCount: number;
  isDefault: boolean;
};

export type ReceiptDTO = {
  id: string;
  store: string;
  date: string; // YYYY-MM-DD
  amount: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  category: { id: string; name: string; color: string };
};

export type StatsDTO = {
  month: string;
  total: string;
  receiptCount: number;
  comparison: {
    kind: "same-period" | "previous-month";
    previousTotal: string;
    changePercent: number | null;
    label: string;
  };
  byCategory: { id: string; name: string; color: string; total: string; percent: number }[];
  latest: ReceiptDTO[];
};

export type ApiErrorBody = {
  error: string;
  fieldErrors?: Record<string, string>;
};
