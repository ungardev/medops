export interface ClinicEvent {
  id: number;
  title: string;
  description: string;
  date: string; // ISO string
}

export interface ClinicEventInput {
  title: string;
  description: string;
  date: string;
}
