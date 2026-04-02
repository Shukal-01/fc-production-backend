const parseTime = (time) => {
  const [timePart, modifier] = time.split(/(AM|PM)/);
  const [hours, minutes] = timePart.split(":").map(Number);
  return {
    hours: modifier === "PM" && hours !== 12 ? hours + 12 : hours % 12,
    minutes: minutes || 0,
  };
};

module.exports = {
  parseTime,
};
