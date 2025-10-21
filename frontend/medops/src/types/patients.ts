export interface Patient {
  id: number;
  name: string;
  age: number;
  diagnosis: string;
}

export type PatientInput = {
  first_name: string;
  last_name: string;
  age: number;
  diagnosis: string;
};
