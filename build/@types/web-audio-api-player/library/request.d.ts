import { IPlayerError } from './error';
import { IOnProgress } from './sound';
export interface IRequested {
    url: string;
    loadingProgress: number;
    onLoading: IOnProgress;
    onPlaying: IOnProgress;
}
export declare class PlayerRequest {
    getArrayBuffer(requested: IRequested): Promise<ArrayBuffer | IPlayerError>;
}
