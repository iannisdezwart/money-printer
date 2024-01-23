export const search = (params: Record<string, string>) => {
  const nonEmptyParams = Object.entries(params).filter(([, value]) => value);
  return new URLSearchParams(nonEmptyParams).toString();
};
