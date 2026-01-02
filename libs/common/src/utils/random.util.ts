/**
 * Generate a random number between min and max (inclusive)
 *
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random number in the range [min, max]
 *
 * @example
 * randomBetween(10, 100) // Returns a number between 10 and 100
 * randomBetween(-0.01, 0.01) // Returns a percentage delta for price changes
 */
export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
