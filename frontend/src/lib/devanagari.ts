/** Fisher-Yates shuffle: returns a new array */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Full Devanagari alphabet */
export const DEV_ALPHABET = ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'क्ष', 'त्र', 'ज्ञ']

/** Space-separated string of the full alphabet for friezes */
export const DEV_FRIEZE = DEV_ALPHABET.join(' ')

/** Shuffled copy (computed once at module load) */
export const DEV_FRIEZE_SHUFFLED = shuffle(DEV_ALPHABET)

/** 9-char subset for the hero chalk grid */
export const DEV_GRID = DEV_ALPHABET.slice(0, 9)

/** First 8 chars: used in login frieze */
export const DEV_LOGIN = DEV_ALPHABET.slice(0, 8)

/** Middle 8 chars: used in register frieze */
export const DEV_REGISTER = DEV_ALPHABET.slice(4, 12)

/** Shuffled small grids */
export const DEV_GRID_SHUFFLED = shuffle(DEV_GRID)
export const DEV_LOGIN_SHUFFLED = shuffle(DEV_LOGIN)
export const DEV_REGISTER_SHUFFLED = shuffle(DEV_REGISTER)
