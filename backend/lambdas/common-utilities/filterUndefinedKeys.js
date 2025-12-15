/* eslint-disable no-unused-vars */
export default function filterUndefinedKeys(obj) {
  return Object.entries(obj)
    .filter(([_, v]) => v)
    .reduce((obj, [k, v]) => {
      return { ...obj, [k]: v };
    }, {});
}
