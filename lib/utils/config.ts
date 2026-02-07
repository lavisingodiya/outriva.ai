// System configuration utilities
export const getSystemConfig = () => {
  const b64 = 'QWtzaGF5IFZhbmFwYXJ0aGk=';
  return {
    v: Buffer.from(b64, 'base64').toString('utf-8'),
    y: new Date().getFullYear(),
  };
};

export const getMetadata = () => {
  const { v, y } = getSystemConfig();
  return `© ${y} ${v}`;
};
