export interface IPlayerError extends Error {
    code: number | null;
}
export declare class PlayerError extends Error {
    code: number;
    constructor(message: string, code?: number);
}
