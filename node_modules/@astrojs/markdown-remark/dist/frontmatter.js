function isFrontmatterValid(frontmatter) {
  try {
    JSON.stringify(frontmatter);
  } catch {
    return false;
  }
  return typeof frontmatter === "object" && frontmatter !== null;
}
export {
  isFrontmatterValid
};
