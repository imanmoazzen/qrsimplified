import { NestedStack, Stack } from "aws-cdk-lib";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

const SSMParameterMixin = (Base) =>
  class extends Base {
    constructor(scope, id, props) {
      super(scope, id, props);

      this.SSMParameters = {};
      this.appName = props.cdkConfig.appName;
    }

    createSSMParameter(name, value) {
      const parameterName = `${this.node.id}-${name}`;
      this.SSMParameters[name] = parameterName;

      return new StringParameter(this, name, {
        parameterName,
        stringValue: value,
      });
    }

    static readSSMParameterValue(stack, parameterName) {
      return StringParameter.valueForStringParameter(stack, parameterName);
    }

    filterSSMParameters(filterString) {
      return Object.entries(this.SSMParameters)
        .filter(([, param]) => param.includes(filterString))
        .reduce((acc, [key, param]) => {
          acc[key] = param;
          return acc;
        }, {});
    }
  };

export const BaseStack = SSMParameterMixin(Stack);
export const BaseNestedStack = SSMParameterMixin(NestedStack);
