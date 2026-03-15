const path = require('path');

const rootDir = path.resolve(__dirname, '../..');

module.exports = {
    apps: [
        {
            name: 'dew-backend',
            cwd: path.join(rootDir, 'backend'),
            script: 'server.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '300M',
            env_file: path.join(rootDir, 'backend', '.env'),
            out_file: path.join(rootDir, 'logs', 'backend-out.log'),
            error_file: path.join(rootDir, 'logs', 'backend-error.log'),
            time: true,
        },
    ],
};
