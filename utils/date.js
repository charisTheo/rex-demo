/**
 * @param {Date} date
 * @return {String} YYYY-MM-DD
 */
export function getReportDateFilterString(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${date.getFullYear()}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}
