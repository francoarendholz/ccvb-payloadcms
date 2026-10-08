import * as migration_20261008_151117_initial from './20261008_151117_initial';
import * as migration_20261008_153603_workflow_totp from './20261008_153603_workflow_totp';

export const migrations = [
  {
    up: migration_20261008_151117_initial.up,
    down: migration_20261008_151117_initial.down,
    name: '20261008_151117_initial',
  },
  {
    up: migration_20261008_153603_workflow_totp.up,
    down: migration_20261008_153603_workflow_totp.down,
    name: '20261008_153603_workflow_totp'
  },
];
