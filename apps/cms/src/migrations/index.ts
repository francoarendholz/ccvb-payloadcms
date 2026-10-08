import * as migration_20261008_151117_initial from './20261008_151117_initial';

export const migrations = [
  {
    up: migration_20261008_151117_initial.up,
    down: migration_20261008_151117_initial.down,
    name: '20261008_151117_initial'
  },
];
