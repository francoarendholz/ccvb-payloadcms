import * as migration_20261008_151117_initial from './20261008_151117_initial';
import * as migration_20261008_153603_workflow_totp from './20261008_153603_workflow_totp';
import * as migration_20261008_155025_optional_review from './20261008_155025_optional_review';

export const migrations = [
  {
    up: migration_20261008_151117_initial.up,
    down: migration_20261008_151117_initial.down,
    name: '20261008_151117_initial',
  },
  {
    up: migration_20261008_153603_workflow_totp.up,
    down: migration_20261008_153603_workflow_totp.down,
    name: '20261008_153603_workflow_totp',
  },
  {
    up: migration_20261008_155025_optional_review.up,
    down: migration_20261008_155025_optional_review.down,
    name: '20261008_155025_optional_review'
  },
];
