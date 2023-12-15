export const pageDown = async (page) => {
  const scrollHeight = 'document.body.scrollHeight';
  await page.evaluate(scrollHeight);
  await page.evaluate(`window.scrollTo(0, ${scrollHeight})`);

  return null;
};
