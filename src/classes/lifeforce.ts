module Insight {
    export class Lifeforce {
        max: number;
        current: number;

        constructor () {
            this.max = 100;

            this.current = 100;
        }

        getCurrent () {
            return this.current;
        }

        getMax () {
            return this.max;
        }

        addToMax (quantity: number) {
            this.max += quantity;
        }

        damage (quantity: number) {
            this.current -= quantity;
            if (this.current <= 0) {
                this.current = 0;
            }
        }

        heal (quantity: number) {
            this.current += quantity;
            if (this.current >= this.max) {
                this.current = this.max;
            }
        }
    }
}
