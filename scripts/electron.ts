import { LogLevel, build } from 'vite';
import electronPath from 'electron';
import { ChildProcess, spawn } from 'child_process';

const mode = process.env.MODE === 'development' ? 'development' : 'production';

const logLevel: LogLevel = 'warn';

const electronApp: { current?: ChildProcess } = {
    current: undefined
}

const restartElectron = () => {
    /** Kill electron if process already exist */
    if (electronApp.current) {
        electronApp.current.removeListener('exit', process.exit);
        electronApp.current.kill('SIGINT');
        electronApp.current = undefined;
    }

    /** Spawn new electron process */
    electronApp.current = spawn(String(electronPath), ['--inspect', '--serve', '.'], {
        stdio: 'inherit',
    });

    /** Stops the watch script when the application has been quit */
    electronApp.current.addListener('exit', process.exit);
}

console.info('Starting electron main and renderer in watch mode')

build({
    mode,
    logLevel,
    configFile: 'projects/main/vite.config.js',
    build: {
        /**
         * Set to {} to enable rollup watcher
         * @see https://vitejs.dev/config/build-options.html#build-watch
         */
        watch: {},
    },
    plugins: [
        {
            name: 'reload-app-on-main-package-change',
            writeBundle: () => restartElectron()
        },
    ],
})

build({
    mode,
    logLevel,
    configFile: 'projects/preload/vite.config.js',
    build: {
        /**
         * Set to {} to enable rollup watcher
         * @see https://vitejs.dev/config/build-options.html#build-watch
         */
        watch: {},
    },
    plugins: [
        {
            name: 'reload-page-on-preload-package-change',
            closeBundle: () => {
                console.log('bundle finished');
                //electronApp.current?.send('')
                restartElectron();
            }
        },
    ],
});
