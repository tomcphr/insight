module Insight {
    export class Inventory {
        storage: object = {
            "pickaxe"    :    {}
        };
        current: string = "pickaxe";

        getItems () {
            return this.storage;
        }

        getCurrentItem () {
            return this.current;
        }

        setCurrentItem (item) {
            this.current = item;
        }

        addItem (item, quantity: number) {
            this.checkItem(item);

            this.storage[item].count += quantity;
        }

        removeItem (item, quantity: number) {
            this.checkItem(item);

            this.storage[item].count -= quantity;
        }

        getItemCount (item) {
            this.checkItem(item);

            return this.storage[item].count;
        }

        checkItem (item) {
            var exists = this.storage.hasOwnProperty(item);
            if (!exists) {
                this.storage[item] = {
                    "count"  :  0,
                }
            }
        }
    }
}
