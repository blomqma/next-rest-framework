import { ValidMethod } from '../constants';

export const isValidMethod = (x: unknown): x is ValidMethod =>
  Object.values(ValidMethod).includes(x as ValidMethod);

export const capitalizeFirstLetter = (str: string) =>
  str[0]?.toUpperCase() + str.slice(1);

export const parseRpcOperationResponseJson = async (res: unknown) => {
  if (res instanceof FormData || res instanceof URLSearchParams) {
    const body: Record<string, FormDataEntryValue> = {};

    for (const [key, value] of res.entries()) {
      body[key] = value;
    }

    return body;
  }

  return res;
};
