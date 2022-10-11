import { JSONFile, Low } from "@commonify/lowdb";

export class LowDB<T> implements Low<T> {
    data!: T;
    write!: Low<T>["write"];
    read!: Low<T>["read"];
    adapter!: Low<T>["adapter"];
    private low: Low<T>;
    private initialized: boolean;
    waitInit() {
        return new Promise<void>((res) => {
            if (this.initialized) res();
            const interval = setInterval(() => {
                if (this.initialized) {
                    clearInterval(interval);
                    res();
                }
            }, 100);
        });
    }
    constructor(filename: string, initialIfNull: T, onRead?: (data: T) => void) {
        this.initialized = false;
        this.low = new Low(new JSONFile<T>(filename));
        this["data"] = this.low["data"] as T;
        this["adapter"] = this.low["adapter"];
        this["write"] = this.low["write"];
        this["read"] = this.low["read"];

        this.write().then(async () => {
            try {
                await this.read();
            } catch (err) {
                console.log(`File ${filename} =>`, "Something went wrong while trying to read the file, resetting!");
                this.data ||= initialIfNull;
                await this.write();
            }
            this.data ||= initialIfNull;
            this.initialized = true;
            onRead?.(this.data);
        });
    }
}
