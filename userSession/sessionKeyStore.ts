
export interface SessionKeyStorage {
  WriteRotation(SessionSign: string, RotationCounter: number): Promise<void>;
  Clear(): Promise<void>;
  get SessionSign(): string ;
  get SessionKey(): string ;
  get RotationCounter(): number ;
}
