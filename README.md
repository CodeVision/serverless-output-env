# Serverless Output Env

Serverless plugin to output the environment variables from a serverless project.

## About

The [Serverless](https://www.serverless.com) framework allows you to specify environment variables on an individual function level as well as on a global level for all functions. These environment variables are commonly used to refer to resources external to the function in question, such as buckets, tables and queues. These external resources are often defined and created within the serverless configuration file. 

For integration and end-to-end tests of serverless function it is necessary to also have these environment variables at your disposal. 

The [Serverless Export Env](https://github.com/arabold/serverless-export-env) plugin makes it possible to extract all environment variables defined within the `serverless` configuration file to an external `.env` file.

However for some integration tests it is necessary to create test-only resources. These test-only resources are created only in the non-production environments purely to be able to test some integration (between a function and some other service). To add references to these test-only resources to the environment variables of individual functions or globally would make no sense, after all they are not referred to from functions but only in tests.

Unfortunately above mentioned plugin does not offer a solution (anymore) to referring to test only resources within your tests. 

In order to make this possible (again), this plugin allows you to define environment variables under the `custom.output-env` configuration option in the `serverless` configuration file. Similar to the [Serverless Export Env](https://github.com/arabold/serverless-export-env) plugin a command can then be used to export both the 'regular' environment variables (defined for individual functions and at the `provider` level) as well as these custom 'local' environment variables.

Thanks go out to @arabold for the [Serverless Export Env](https://github.com/arabold/serverless-export-env) plugin on which this plugin is largely based.

## Usage

Add the plugin to your project (as dev dependency):

```sh
# npm
$ npm install serverless-output-env --save-dev

# yarn
$ yarn add serverless-output-env --dev 
```

Add the plugin to your `serverless` configuration file as plugin:

```yaml
plugins:
- serverless-output-env
```

Invoke the plugin by using the `output-env` command:

```sh
# prints the environment variables to the command line (--print/-p)
$ serverless output-env --stage dev --print

# writes the environment variables to the default .env file
$ serverless output-env --stage dev

# writes the environment variables to the specified file (--outputFile/-o)
$ serverless output-env --stage test --outputFile .env.test
```

### Command line options
The plugin supports a number of command line options:

| Option       | Shortcut | Default | Description                                                                                                                       |
| ------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| --print      | -p       | false   | Print the environment variables to standard output instead of writing to a file (useful for checking as well as programmatic use) |
| --outputFile | -o       | .env    | Name of the file to output the environment variables to                                                                           |

## Configuration

The main differentiator between this plugin and the 'original' is the option to configure environment variables in the `custom` section of the `serverless` configuration file. The following options can be specified in the `custom.output-env` section.

| Setting                 | Default | Description                                                                             |
| ----------------------- | ------- | --------------------------------------------------------------------------------------- |
| localVariables          | -       | Object to group the additional (local only) environment variables you want to specify.  |
| useDefaultForProduction | false   | Whether to include the variables specified under default in the production stage output |

The `variables` settings follows a structure similar to the `params` key in the `serverless` configuration file. A key can be specified for each stage with variables specific to that stage as well as a default key that applies to all stages.

For example:

```yaml
custom:
  "output-env":
    localVariables:
      dev:
        MY_VAR: value
      default:
        ALL_STAGE_VAR: value
```

Output for the `dev` stage would include both the `MY_VAR` as well as the `ALL_STAGE_VAR` variable. Stage specific variables overwrite variables defined within default.

## Variable resolution

In order to resolve variables used within the environment variables the plugin relies on the (basic) variable resolution offered by the [serverless framework](https://www.serverless.com/framework/docs) as well as the [cfn-resolver-lib](https://github.com/robessog/cfn-resolver-lib#readme) library. Refer to their documentation to have a look at the supported variables and [intrinsic cloudformation functions](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference.html).

## Todo

- Add attribute resolvers for commonly used resources (insofar as possible)
- Add option to customize / override resolution of:
  - Ref
  - Fn::GetAtt
- Add support for `Fn::ImportValue`
- Add `serverless offline` support?


