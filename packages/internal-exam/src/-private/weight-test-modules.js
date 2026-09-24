const TEST_TYPE_WEIGHT = {
  unit: 10,
  integration: 20,
  acceptance: 150,
};
const WEIGHT_REGEX = /\/(unit|integration|acceptance)\//;
const DEFAULT_WEIGHT = 50;

/**
 * Returns the weight for a given module path. Acceptance tests are generally
 * slowest, followed by integration then unit; unclassifiable modules default
 * to a weight between acceptance and integration.
 *
 * @param {string} modulePath
 */
function getWeight(modulePath) {
  const [, key] = WEIGHT_REGEX.exec(modulePath) || [];
  if (typeof TEST_TYPE_WEIGHT[key] === 'number') {
    return TEST_TYPE_WEIGHT[key];
  } else {
    return DEFAULT_WEIGHT;
  }
}

/**
 * Returns the list of modules sorted by weight, heaviest (slowest) first.
 *
 * @param {string[]} modules
 * @return {string[]}
 */
export default function weightTestModules(modules) {
  const groups = new Map();

  modules.forEach((module) => {
    const moduleWeight = getWeight(module);
    let moduleWeightGroup = groups.get(moduleWeight);

    if (Array.isArray(moduleWeightGroup)) {
      moduleWeightGroup.push(module);
    } else {
      moduleWeightGroup = [module];
    }

    groups.set(moduleWeight, moduleWeightGroup);
  });

  // return modules sorted by weight and alphabetically within its weighted groups
  return Array.from(groups.keys())
    .sort((a, b) => b - a)
    .reduce((accumulatedArray, weight) => {
      const sortedModuleArr = groups.get(weight).sort();
      return accumulatedArray.concat(sortedModuleArr);
    }, []);
}
