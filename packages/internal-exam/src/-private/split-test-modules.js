function createGroups(num) {
  const groups = new Array(num);

  for (let i = 0; i < num; i++) {
    groups[i] = [];
  }

  return groups;
}

function splitIntoGroups(arr, numGroups) {
  const groups = createGroups(numGroups);

  for (let i = 0; i < arr.length; i++) {
    groups[i % numGroups].push(arr[i]);
  }

  return groups;
}

/**
 * Splits the list of modules into a unique subset of modules per partition,
 * returning the modules for the requested partition(s).
 *
 * @param {string[]} modules
 * @param {number} split
 * @param {number[]} partitions
 * @return {string[]}
 */
export default function splitTestModules(modules, split, partitions) {
  if (split < 1) {
    throw new Error('You must specify a split greater than 0');
  }

  const testGroups = splitIntoGroups(modules, split);
  const tests = [];

  for (let i = 0; i < partitions.length; i++) {
    const partition = parseInt(partitions[i], 10);
    if (isNaN(partition)) {
      throw new Error(`You must specify numbers for partition (you specified '${partitions}')`);
    }

    if (split < partition) {
      throw new Error(`You must specify partitions numbered less than or equal to your split value of ${split}`);
    } else if (partition < 1) {
      throw new Error('You must specify partitions numbered greater than 0');
    }

    const group = partition - 1;
    tests.push(...testGroups[group]);
  }

  return tests;
}
