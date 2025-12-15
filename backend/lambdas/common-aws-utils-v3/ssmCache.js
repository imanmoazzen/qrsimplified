import { GetParameterCommand, GetParametersByPathCommand } from "@aws-sdk/client-ssm";
import { Mutex } from "async-mutex";

// need to alias this function to ensure we don't mess with the instance method defined here.
import { isUndefinedOrNull as undefinedOrNullCheck } from "../common-utilities/helperFunctions.js";

export class SsmCache {
  constructor(ssmClient) {
    this.mutex = new Mutex();
    this.ssmClient = ssmClient;
    this.cache = {};
    this.allLoaded = false;
  }

  async loadAll() {
    if (this.allLoaded) {
      return;
    }
    await this.mutex.runExclusive(async () => {
      const path = "/app/configuration";
      const params = {
        Path: path,
        MaxResults: 10, //this is the maximum value
        Recursive: false,
        WithDecryption: true,
      };
      await this._loadAllInternal(params);
      this.allLoaded = true;
    });
  }

  async _loadAllInternal(params) {
    const { Path } = params;
    return new Promise((resolve, reject) => {
      const cmd = new GetParametersByPathCommand(params);
      this.ssmClient.send(cmd).then(
        (data) => {
          data.Parameters.forEach((p) => {
            this.cache[p.Name] = p.Value;
          });
          if (data.NextToken) {
            this._loadAllInternal({
              ...params,
              NextToken: data.NextToken,
            });
          }
          resolve();
        },
        (err) => {
          console.error(`Error fetching SSM parameters by path: ${Path}.`, err);
          reject(err);
        }
      );
    });
  }

  async getValue(name) {
    if (this.isUndefinedOrNull(name)) {
      console.error(`SsmCache: Got undefined name.`);
      return;
    }
    return await this.mutex.runExclusive(async () => {
      const parameterName = `/app/configuration/${name}`;
      const value = this.cache[parameterName];
      if (this.isUndefinedOrNull(value)) {
        const params = { Name: parameterName, WithDecryption: true };
        return new Promise((resolve, reject) => {
          const cmd = new GetParameterCommand(params);
          this.ssmClient.send(cmd).then(
            (data) => {
              const value = data.Parameter?.Value;
              if (!this.isUndefinedOrNull(value)) {
                this.cache[parameterName] = value;
              }
              resolve(value);
            },
            (err) => {
              if (err.name === "ParameterNotFound") {
                resolve(null);
              } else {
                console.error(`Error fetching SSM parameter with name: ${parameterName}`, err);
                reject(err);
              }
            }
          );
        });
      } else {
        return value;
      }
    });
  }

  isUndefinedOrNull(value) {
    return undefinedOrNullCheck(value);
  }
}
