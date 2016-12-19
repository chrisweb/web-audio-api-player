
interface IPlayerError extends Error {
    code?: number;
}

class PlayerError extends Error implements IPlayerError {

    public code: number;

    constructor(message: string, code?: number) {

        super(message);

        this.code = code;

        // Set the prototype explictilly
        Object.setPrototypeOf(this, PlayerError.prototype);

    }
    
}
