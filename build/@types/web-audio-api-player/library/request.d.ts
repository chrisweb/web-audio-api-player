import { IPlayerError } from './error';
export interface IRequested {
    url: string;
    loadingProgress: number;
}
export declare class PlayerRequest {
    getArrayBuffer(requested: IRequested): Promise<ArrayBuffer | IPlayerError>;
}
