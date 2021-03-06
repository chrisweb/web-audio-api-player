﻿export interface IPlayerError extends Error {
    code: number | null;
}

// https://github.com/Microsoft/TypeScript/issues/12123
export class PlayerError extends Error {

    public code: number;

    constructor(message: string, code?: number) {

        super(message);

        this.code = code || null;

        // Set the prototype explictilly
        Object.setPrototypeOf(this, PlayerError.prototype);

    }

}
