import { ValidMethod } from '../constants';

export const isValidMethod = (x: unknown): x is ValidMethod =>
  Object.values(ValidMethod).includes(x as ValidMethod);

export const capitalizeFirstLetter = (str: string) =>
  str[0]?.toUpperCase() + str.slice(1);
