import { computeFeedback } from '../cipher/src/utils/computeFeedback.js';

function runTest(secret, guess, expectedBlack, expectedWhite) {
  const result = computeFeedback(secret, guess);
  const passed = result.black === expectedBlack && result.white === expectedWhite;
  
  if (!passed) {
    console.error(`FAIL: Secret [${secret}] Guess [${guess}]`);
    console.error(`Expected { black: ${expectedBlack}, white: ${expectedWhite} }`);
    console.error(`Got { black: ${result.black}, white: ${result.white} }`);
    process.exit(1);
  } else {
    console.log(`PASS: Secret [${secret}] Guess [${guess}] -> { black: ${result.black}, white: ${result.white} }`);
  }
}

console.log("Running Phase 1 validation...");
runTest(['red','red','green','blue'], ['red','green','red','red'], 1, 2);
runTest(['red','red','red','red'], ['red','red','blue','blue'], 2, 0);
console.log("All validation tests passed.");
