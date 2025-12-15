// takes an array of functions which return promises; calls these functions to
// start execution of their code in such a way that only up to 'concurrency'
// are running at any one time. Returns an array of their results in the same order,
// similar to Promise.all()

// useful for cases where attempting to Promise.all too many things would create
// problems (like promises that spawn ffmpeg processes)
export async function executeWithLimitedConcurrency(promiseFns, concurrency = 5) {
  const unexecutedPromiseFns = [...promiseFns];
  const promiseFunctionOriginalIndexes = [...Array(promiseFns.length).keys()];
  const results = [];
  const makeExecutor = async () => {
    while (unexecutedPromiseFns.length > 0) {
      const promiseFn = unexecutedPromiseFns.pop();
      const promiseFnIndex = promiseFunctionOriginalIndexes.pop();
      results[promiseFnIndex] = await promiseFn();
    }
  };
  const executors = [];
  for (let i = 0; i < concurrency; i++) {
    executors.push(makeExecutor());
  }
  await Promise.all(executors);
  return results;
}
