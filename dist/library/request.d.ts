import { IOnProgress } from './sound';
export interface IRequested {
    url: string;
    loadingProgress: number;
    onLoading?: IOnProgress;
}
export declare class PlayerRequest {
    getArrayBuffer(requested: IRequested): Promise<ArrayBuffer>;
}
