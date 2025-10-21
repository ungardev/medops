export interface Payment {
  id: number;
  patient: string;   // o Patient si quieres relacionar
  amount: number;
  method: string;    // "cash" | "card" | "transfer"
  date: string;      // ISO string
}

export interface PaymentInput {
  patient: string;
  amount: number;
  method: string;
  date: string;
}
