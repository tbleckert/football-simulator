export default function getRandomElement(options: number[][]): number {
    const weighted = options.map(([action, weight]) => Array(weight).fill(action)).reduce((c, v) => c.concat(v), []);

    return weighted[Math.floor((Math.random() * weighted.length))];
}
