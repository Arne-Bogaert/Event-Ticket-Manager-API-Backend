export default async () => {
  await globalThis.mySQLContainer.stop();
};
