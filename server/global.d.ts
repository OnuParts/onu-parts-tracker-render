// Extend Express Request to include session
declare namespace Express {
  interface Request {
    session: {
      user?: {
        id: number;
        username: string;
        name: string;
        role: string;
      };
      destroy: (callback: (err: any) => void) => void;
    };
  }
}