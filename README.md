# Core Analytics Server
Simple, privacy first, and scalable Analytics server.

## Code Guardian
[![<app> build verification](https://github.com/aicore/Core-Analytics-Server/actions/workflows/build_verify.yml/badge.svg)](https://github.com/aicore/template-nodejs/actions/workflows/build_verify.yml)

<a href="https://sonarcloud.io/summary/new_code?id=aicore_Core-Analytics-Server">
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=alert_status" alt="Sonar code quality check" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=security_rating" alt="Security rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=vulnerabilities" alt="vulnerabilities" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=coverage" alt="Code Coverage" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=bugs" alt="Code Bugs" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=reliability_rating" alt="Reliability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=sqale_rating" alt="Maintainability Rating" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=ncloc" alt="Lines of Code" />
  <img src="https://sonarcloud.io/api/project_badges/measure?project=aicore_Core-Analytics-Server&metric=sqale_index" alt="Technical debt" />
</a>

# Usage

# Config
The features of the analytics server can be configured in the `analytics-config.json` file.
* The changes to the file will be automatically picked up and configuration updated by the server without needing a restart.
* **NB**: The server relies on `configVersion` number to decide if the updated config should be loaded. Increase the version number after you made your config
changes for the new configuration to take effect. This will help reduce unintended config changes.

## Config fields
1. `configVersion` : The version number for run time configuration as discussed above.
2. `webDashboardEnabled` : `true/false` to enable or disable web dashboard
3. `systemGenerated` : The properties in this object are system generated and read only. It is used by the analytics server to communicate about the
config changes to the user.
4. `rotateDumpFiles`: Specifies details on how the analytics dump files are rotated. See below 
section for more details.
5. `allowedAppNames`: An array that whitelists the appNames that this analytics
server will accept. if `*` is specified in the list, then everything will be accepted.

### rotateDumpFiles configuration
1. `maxFileSizeBytes`: When the current dump file size crosses this threshold, it will be rotated 
to persistent storage and a new dump file will be created to continue dumping.
2. `rotateInEveryNSeconds`: The time in seconds after which the log file will be rotated. Note that the log file
will be rotated when either of `maxFileSizeBytes` or `rotateInEveryNSeconds` threshold is breached.
   1. `storage`: Configuration on where to persist the rotated dump file.
      1. `destination`: Can be `none`, `local` or `linode`. 
          2. If the destination is `local`, the dumps will be persisted in the current machine.
          2. If the destination is `none`, the dumps will be deleted as soon as it is rotated.
          4. If `destination` is `linode`, then provide linode object storage access config here.
             ``` 
             // Linode storage config example: 
             "storage": {
                "destination":"linode",
                "accessKeyId":  "LinodeAccessKeyId",
                "secretAccessKey":  "LinodeSecretAccessKey",
                "region":  "LinodeRegion",
                "bucket": "LinodeBucket"
             }
             ```

### systemGenerated configuration
1. `webDashboardAccessToken` : a random token that can be used to access the web dashboard. This is reset everytime the web dashboard is disabled/enabled from the config file.

# Wiki Docs
See wiki for more architecture and implementation details: https://github.com/aicore/Core-Analytics-Server/wiki

# Development Notes
Commands available:
```shell
> npm run build
# To lint the files in the project, run the following command:
> npm run lint
#To Automatically fix lint errors:
> npm run lint:fix
```

## Testing
To run all tests:
```shell
> npm run test
  Hello world Tests
    ✔ should return Hello World
    #indexOf()
      ✔ should return -1 when the value is not present
```

Additionally, to run unit/integration tests only, use the commands:
```shell
> npm run test:unit
> npm run test:integ
```

## Coverage Reports
To run all tests with coverage:

```shell
> npm run cover
  Hello world Tests
    ✔ should return Hello World
    #indexOf()
      ✔ should return -1 when the value is not present


  2 passing (6ms)

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |                   
 index.js |     100 |      100 |     100 |     100 |                   
----------|---------|----------|---------|---------|-------------------

=============================== Coverage summary ===============================
Statements   : 100% ( 5/5 )
Branches     : 100% ( 2/2 )
Functions    : 100% ( 1/1 )
Lines        : 100% ( 5/5 )
================================================================================
Detailed unit test coverage report: file:///template-nodejs/coverage-unit/index.html
Detailed integration test coverage report: file:///template-nodejs/coverage-integration/index.html
```
After running coverage, detailed reports can be found in the coverage folder listed in the output of coverage command.
Open the file in browser to view detailed reports.

To run unit/integration tests only with coverage
```shell
> npm run cover:unit
> npm run cover:integ
```

Sample coverage report:
![image](https://user-images.githubusercontent.com/5336369/148687351-6d6c12a2-a232-433d-ab62-2cf5d39c96bd.png)

### Unit and Integration coverage configs
Unit and integration test coverage settings can be updated by configs `.nycrc.unit.json` and `.nycrc.integration.json`.

See https://github.com/istanbuljs/nyc for config options.

# Sonar Cloud
Static code analysis is setup in this repository
2. [Sonar cloud](https://sonarcloud.io/) integration using `.sonarcloud.properties`
   1. In sonar cloud, enable Automatic analysis from `Administration
      Analysis Method` for the first time ![image](https://user-images.githubusercontent.com/5336369/148695840-65585d04-5e59-450b-8794-54ca3c62b9fe.png)

## IDE setup
SonarLint is currently available as a free plugin for jetbrains, eclipse, vscode and visual studio IDEs.
Use sonarLint plugin for webstorm or any of the available
IDEs from this link before raising a pull request: https://www.sonarlint.org/ .

SonarLint static code analysis checker is not yet available as a Brackets
extension.

## Internals
### Testing framework: Mocha , assertion style: chai
 See https://mochajs.org/#getting-started on how to write tests
 Use chai for BDD style assertions (expect, should etc..). See move here: https://www.chaijs.com/guide/styles/#expect

### Mocks and spies: sinon
 if you want to mock/spy on fn() for unit tests, use sinon. refer docs: https://sinonjs.org/

### Note on coverage suite used here:
we use c8 for coverage https://github.com/bcoe/c8. Its reporting is based on nyc, so detailed docs can be found
 here: https://github.com/istanbuljs/nyc ; We didn't use nyc as it do not yet have ES module support
 see: https://github.com/digitalbazaar/bedrock-test/issues/16 . c8 is drop replacement for nyc coverage reporting tool
