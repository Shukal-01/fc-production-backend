module.exports = {
  imageExtensions: (extension) => {
    const extensions = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/svg",
      "image/webp",
    ];
    return extensions.includes(extension);
  },
};
