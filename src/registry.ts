export interface RegistryItem {
    matches(): boolean;
    onMatch(): void;
}

export class Registry {

    private static instance: Registry;
    private items: RegistryItem[];

    public static getInstance(): Registry {
        if (!this.instance) {
            Registry.instance = new Registry();
        }

        return Registry.instance;
    }

    public addRegistryItem(item: RegistryItem) {
        this.items.push(item);
    }

}