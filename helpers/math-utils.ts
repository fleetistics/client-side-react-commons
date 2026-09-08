export class MathUtils {
    public static DistanceToSegment(x: number, y: number, x1: number, y1: number, x2: number, y2: number): number {
        let dx = x2 - x1, dy = y2 - y1;
        if (dx === 0 && dy === 0) {
            dx = x - x1;
            dy = y - y1;
        }
        else {
            const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
            if (t <= 0) {
                dx = x - x1;
                dy = y - y1;
            }
            else if (t >= 1) {
                dx = x - x2;
                dy = y - y2;
            }
            else {
                dx = x - x1 - t * dx;
                dy = y - y1 - t * dy;
            }
        }
        return Math.sqrt(dx * dx + dy * dy);
    }
    public static RoundTo(value: number, maxDigitsAfterPoint?: number) {
        if (maxDigitsAfterPoint) return Math.round(value * Math.pow(10, maxDigitsAfterPoint)) / Math.pow(10, maxDigitsAfterPoint);
        else return Math.round(value);
    }

}